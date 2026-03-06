"""
Petpooja AI Copilot — FastAPI Backend
Module 1: Revenue Intelligence & Menu Optimization
Module 2: AI Voice Ordering Copilot
"""
import json
import os
import shutil
import tempfile
import uuid

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from modules import revenue_engine, voice_copilot

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MENU_FILE = os.path.join(DATA_DIR, "menu.json")
RECIPE_FILE = os.path.join(DATA_DIR, "recipes.json")


def _load_menu_file() -> list:
    with open(MENU_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save_menu_file(data: list):
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load_recipes() -> dict:
    with open(RECIPE_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save_recipes(data: dict):
    with open(RECIPE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

app = FastAPI(
    title="Petpooja AI Copilot",
    description="Revenue Intelligence & Voice Ordering for Restaurants",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════
# Module 1 — Revenue Intelligence Endpoints
# ═══════════════════════════════════════════════

@app.get("/menu/analysis")
def menu_analysis():
    """Full item-level profitability matrix."""
    return {"items": revenue_engine.menu_matrix()}


@app.get("/menu/hidden-stars")
def menu_hidden_stars():
    """Under-promoted high-margin items."""
    return {"hidden_stars": revenue_engine.hidden_stars()}


@app.get("/menu/combos")
def menu_combos():
    """Recommended item bundles from Apriori association rules."""
    return {"combos": revenue_engine.combo_recommendations()}


@app.get("/menu/risks")
def menu_risks():
    """Low-margin high-volume items (Plowhorses)."""
    return {"risk_items": revenue_engine.risk_items()}


@app.get("/menu/price-suggestions")
def menu_price_suggestions():
    """Pricing recommendations for each menu classification."""
    return {"suggestions": revenue_engine.price_suggestions()}


# ═══════════════════════════════════════════════
# Module 2 — Voice Ordering Copilot Endpoints
# ═══════════════════════════════════════════════

class TranscriptionInput(BaseModel):
    transcription: str


class ConfirmOrderInput(BaseModel):
    items: list[dict]
    upsell_accepted: bool = False
    upsell_items: list[dict] | None = None
    language_detected: str = "English"


@app.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    """Accept audio file, return transcription via Whisper."""
    if not file.filename:
        raise HTTPException(400, "No file provided")

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = voice_copilot.transcribe_audio(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)


@app.post("/voice/parse-order")
def voice_parse_order(input: TranscriptionInput):
    """Accept transcription text, return mapped order JSON."""
    parsed = voice_copilot.parse_order(input.transcription)

    # Get upsell suggestion
    if parsed["items"]:
        upsell = voice_copilot.suggest_upsell(parsed["items"])
        parsed["upsell_suggestion"] = upsell

    return parsed


@app.post("/voice/confirm-order")
def voice_confirm_order(input: ConfirmOrderInput):
    """Finalize order, push to PoS, generate KOT, and auto-deplete inventory."""
    result = voice_copilot.confirm_order(
        items=input.items,
        upsell_accepted=input.upsell_accepted,
        upsell_items=input.upsell_items,
        language_detected=input.language_detected,
    )

    # ─── Auto-deplete inventory based on recipes ───
    recipes = _load_recipes()
    inventory = _load_inventory()
    inv_map = {i["ingredient_id"]: i for i in inventory}
    depleted = {}
    stock_alerts = []

    all_items = list(input.items)
    if input.upsell_accepted and input.upsell_items:
        all_items.extend(input.upsell_items)

    for item in all_items:
        item_id = item.get("item_id", "")
        qty_ordered = item.get("quantity", 1)
        recipe = recipes.get(item_id, {})
        for ing in recipe.get("ingredients", []):
            ing_id = ing["ingredient_id"]
            subtract = ing["qty"] * qty_ordered
            if ing_id in inv_map:
                inv_map[ing_id]["current_stock"] = round(
                    max(0, inv_map[ing_id]["current_stock"] - subtract), 3
                )
                depleted[ing_id] = {
                    "name": inv_map[ing_id]["name"],
                    "subtracted": round(depleted.get(ing_id, {}).get("subtracted", 0) + subtract, 3),
                    "remaining": inv_map[ing_id]["current_stock"],
                    "unit": inv_map[ing_id]["unit"],
                }

    # Check for low-stock alerts
    for ing_id, info in depleted.items():
        inv_item = inv_map[ing_id]
        if inv_item["current_stock"] <= inv_item["min_stock"]:
            stock_alerts.append({
                "ingredient_id": ing_id,
                "name": inv_item["name"],
                "current_stock": inv_item["current_stock"],
                "min_stock": inv_item["min_stock"],
                "unit": inv_item["unit"],
            })

    # Save updated inventory
    if depleted:
        _save_inventory(list(inv_map.values()))

    result["inventory_impact"] = {
        "depleted": list(depleted.values()),
        "stock_alerts": stock_alerts,
    }
    return result


@app.get("/voice/orders")
def voice_orders():
    """List all placed orders."""
    return {"orders": voice_copilot.get_all_orders()}


# ═══════════════════════════════════════════════
# Module 3 — Menu Management (CRUD)
# ═══════════════════════════════════════════════

class MenuItemCreate(BaseModel):
    name: str
    category: str
    selling_price: float
    food_cost: float
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    selling_price: Optional[float] = None
    food_cost: Optional[float] = None
    is_available: Optional[bool] = None


@app.get("/menu/items")
def get_menu_items():
    """Return all raw menu items."""
    return {"items": _load_menu_file()}


@app.post("/menu/items", status_code=201)
def add_menu_item(item: MenuItemCreate):
    """Add a new menu item and persist to menu.json."""
    menu = _load_menu_file()
    # Auto-generate next ID
    existing_ids = [m.get("item_id", "M000") for m in menu]
    nums = [int(i[1:]) for i in existing_ids if i.startswith("M") and i[1:].isdigit()]
    next_num = max(nums, default=0) + 1
    new_item = {
        "item_id": f"M{next_num:03d}",
        "name": item.name,
        "category": item.category,
        "selling_price": item.selling_price,
        "food_cost": item.food_cost,
        "is_available": item.is_available,
    }
    menu.append(new_item)
    _save_menu_file(menu)
    return {"item": new_item, "message": "Item added successfully"}


@app.put("/menu/items/{item_id}")
def update_menu_item(item_id: str, updates: MenuItemUpdate):
    """Update any fields of a menu item."""
    menu = _load_menu_file()
    for item in menu:
        if item["item_id"] == item_id:
            if updates.name is not None:
                item["name"] = updates.name
            if updates.category is not None:
                item["category"] = updates.category
            if updates.selling_price is not None:
                item["selling_price"] = updates.selling_price
            if updates.food_cost is not None:
                item["food_cost"] = updates.food_cost
            if updates.is_available is not None:
                item["is_available"] = updates.is_available
            _save_menu_file(menu)
            return {"item": item, "message": "Item updated successfully"}
    raise HTTPException(status_code=404, detail=f"Item {item_id} not found")


@app.patch("/menu/items/{item_id}/toggle")
def toggle_menu_item(item_id: str):
    """Toggle availability of a menu item."""
    menu = _load_menu_file()
    for item in menu:
        if item["item_id"] == item_id:
            item["is_available"] = not item.get("is_available", True)
            _save_menu_file(menu)
            return {"item": item, "message": f"Availability set to {item['is_available']}"}
    raise HTTPException(status_code=404, detail=f"Item {item_id} not found")


@app.delete("/menu/items/{item_id}")
def delete_menu_item(item_id: str):
    """Permanently delete a menu item."""
    menu = _load_menu_file()
    updated = [m for m in menu if m["item_id"] != item_id]
    if len(updated) == len(menu):
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
    _save_menu_file(updated)
    return {"message": f"Item {item_id} deleted successfully"}


# ═══════════════════════════════════════════════
# Module 4 — Recipe Management (BOM)
# ═══════════════════════════════════════════════

@app.get("/recipes")
def get_all_recipes():
    """Return all recipes keyed by item_id."""
    return _load_recipes()


@app.get("/recipes/{item_id}")
def get_recipe(item_id: str):
    """Return recipe for a specific menu item."""
    recipes = _load_recipes()
    recipe = recipes.get(item_id)
    if not recipe:
        return {"item_id": item_id, "ingredients": []}
    return recipe


@app.put("/recipes/{item_id}")
def update_recipe(item_id: str, ingredients: list[dict]):
    """Create or update recipe for a menu item."""
    recipes = _load_recipes()
    menu = _load_menu_file()
    item_name = next((m["name"] for m in menu if m["item_id"] == item_id), item_id)
    recipes[item_id] = {
        "item_id": item_id,
        "name": item_name,
        "ingredients": ingredients,
    }
    _save_recipes(recipes)
    return {"message": "Recipe saved", "recipe": recipes[item_id]}


# ═══════════════════════════════════════════════
# Health check
# ═══════════════════════════════════════════════

# ─── Inventory Management ───────────────────────────────────────────
INVENTORY_FILE = os.path.join(DATA_DIR, "inventory.json")


def _load_inventory() -> list:
    with open(INVENTORY_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save_inventory(data: list):
    with open(INVENTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class InventoryItem(BaseModel):
    name: str
    category: str
    unit: str
    current_stock: float
    min_stock: float
    cost_per_unit: float
    supplier: str = ""


@app.get("/inventory/items")
def get_inventory():
    return {"items": _load_inventory()}


@app.post("/inventory/items")
def add_inventory_item(item: InventoryItem):
    items = _load_inventory()
    new_id = f"ING{len(items)+1:03d}"
    new_item = {
        "ingredient_id": new_id,
        **item.dict(),
        "last_restocked": str(__import__("datetime").date.today()),
    }
    items.append(new_item)
    _save_inventory(items)
    return {"message": "Item added", "item": new_item}


@app.put("/inventory/items/{ingredient_id}")
def update_inventory_item(ingredient_id: str, item: InventoryItem):
    items = _load_inventory()
    for i, it in enumerate(items):
        if it["ingredient_id"] == ingredient_id:
            items[i].update(item.dict())
            _save_inventory(items)
            return {"message": "Item updated", "item": items[i]}
    raise HTTPException(404, "Ingredient not found")


@app.patch("/inventory/items/{ingredient_id}/restock")
def restock_item(ingredient_id: str, qty: float = 0):
    items = _load_inventory()
    for it in items:
        if it["ingredient_id"] == ingredient_id:
            it["current_stock"] += qty
            it["last_restocked"] = str(__import__("datetime").date.today())
            _save_inventory(items)
            return {"message": "Restocked", "item": it}
    raise HTTPException(404, "Ingredient not found")


@app.delete("/inventory/items/{ingredient_id}")
def delete_inventory_item(ingredient_id: str):
    items = _load_inventory()
    filtered = [i for i in items if i["ingredient_id"] != ingredient_id]
    if len(filtered) == len(items):
        raise HTTPException(404, "Ingredient not found")
    _save_inventory(filtered)
    return {"message": "Item deleted"}


@app.get("/")
def root():
    return {
        "service": "Petpooja AI Copilot",
        "status": "running",
        "modules": ["Revenue Intelligence", "Voice Ordering Copilot", "Menu Management", "Inventory Manager"],
    }
