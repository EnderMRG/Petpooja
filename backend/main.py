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
import urllib.request
import urllib.error
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from modules import revenue_engine, voice_copilot

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MENU_FILE = os.path.join(DATA_DIR, "menu.json")
RECIPE_FILE = os.path.join(DATA_DIR, "recipes.json")
SUPPLIER_FILE = os.path.join(DATA_DIR, "suppliers.json")
RESTOCK_LOG_FILE = os.path.join(DATA_DIR, "restock_log.json")


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


def _load_suppliers() -> dict:
    with open(SUPPLIER_FILE, encoding="utf-8") as f:
        return json.load(f)


def _load_restock_log() -> list:
    with open(RESTOCK_LOG_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save_restock_log(data: list):
    with open(RESTOCK_LOG_FILE, "w", encoding="utf-8") as f:
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


class SaveComboRequest(BaseModel):
    name: str
    combo_items: list[dict]  # [{"item_id": ..., "name": ...}]
    discount_pct: float = 10.0  # default 10% bundle discount
    description: str = ""


@app.post("/menu/combos/save")
def save_combo_to_menu(body: SaveComboRequest):
    """Save an AI-recommended combo as a real orderable menu item."""
    menu = _load_menu_file()

    # Resolve prices of component items
    price_map = {item["item_id"]: item["selling_price"] for item in menu}
    cost_map = {item["item_id"]: item["food_cost"] for item in menu}

    total_price = sum(price_map.get(ci["item_id"], 0) for ci in body.combo_items)
    total_cost = sum(cost_map.get(ci["item_id"], 0) for ci in body.combo_items)

    discount = round(total_price * (body.discount_pct / 100))
    combo_price = max(total_cost + 20, total_price - discount)

    # Check for duplicates by name
    existing = next((m for m in menu if m["name"].lower() == body.name.lower()), None)
    if existing:
        raise HTTPException(409, f"A menu item named '{body.name}' already exists.")

    # Generate new item_id
    combo_ids = [m["item_id"] for m in menu if m.get("is_combo")]
    next_num = len(combo_ids) + 1
    new_id = f"COMBO{next_num:03d}"

    new_item = {
        "item_id": new_id,
        "name": body.name,
        "category": "Combos",
        "selling_price": round(combo_price),
        "food_cost": round(total_cost),
        "is_available": True,
        "is_combo": True,
        "combo_components": [ci["item_id"] for ci in body.combo_items],
        "combo_component_names": [ci["name"] for ci in body.combo_items],
        "description": body.description or f"Bundle: {' + '.join(ci['name'] for ci in body.combo_items)}",
        "original_price": round(total_price),
        "discount_pct": body.discount_pct,
    }

    menu.append(new_item)
    _save_menu_file(menu)

    return {
        "message": f"Combo '{body.name}' added to menu as {new_id}",
        "item": new_item,
    }


@app.get("/menu/combos/saved")
def get_saved_combos():
    """Return all menu items that are saved combos."""
    menu = _load_menu_file()
    combos = [m for m in menu if m.get("is_combo")]
    return {"combos": combos, "count": len(combos)}


@app.get("/menu/risks")
def menu_risks():
    """Low-margin high-volume items (Plowhorses)."""
    return {"risk_items": revenue_engine.risk_items()}


@app.get("/menu/price-suggestions")
def menu_price_suggestions():
    """Pricing recommendations for each menu classification."""
    return {"suggestions": revenue_engine.price_suggestions()}


@app.get("/menu/curated")
def get_curated_menu():
    """
    Generate a curated menu based on sales data.
    Scores each item on: margin, order frequency, revenue contribution, margin %.
    Returns items ranked by composite score with tier classification and recommendation.
    """
    matrix = revenue_engine.menu_matrix()

    if not matrix:
        return {"items": [], "generated_at": datetime.now().isoformat()}

    # Normalize values to 0-100 scale
    margins = [i["margin"] for i in matrix]
    counts = [i["order_count"] for i in matrix]
    revenues = [i["selling_price"] * i["order_count"] for i in matrix]
    margin_pcts = [i["margin_pct"] for i in matrix]

    def norm(val, vals):
        mn, mx = min(vals), max(vals)
        if mx == mn:
            return 50.0
        return round((val - mn) / (mx - mn) * 100, 1)

    scored = []
    for item in matrix:
        revenue = item["selling_price"] * item["order_count"]
        score_margin = norm(item["margin"], margins) * 0.30
        score_orders = norm(item["order_count"], counts) * 0.35
        score_revenue = norm(revenue, revenues) * 0.25
        score_margin_pct = norm(item["margin_pct"], margin_pcts) * 0.10
        composite = round(score_margin + score_orders + score_revenue + score_margin_pct, 1)

        # Tier assignment
        if composite >= 70:
            tier, tier_color = "Must Keep", "#10b981"
        elif composite >= 50:
            tier, tier_color = "Strong Performer", "#3b82f6"
        elif composite >= 30:
            tier, tier_color = "Moderate", "#f59e0b"
        else:
            tier, tier_color = "Consider Removing", "#ef4444"

        # Recommendation text
        cls = item["classification"]
        if cls == "Star":
            rec = "⭐ Star item — highlight prominently on menu and upsell actively."
        elif cls == "Hidden Star":
            rec = "💎 Hidden gem — great margin but low visibility. Feature in combos or promotions."
        elif cls == "Plowhorse":
            rec = "🐎 High volume, low margin. Consider a small price increase (₹10–20)."
        else:
            rec = "🐕 Low sales and low margin. Consider removing or bundling to clear stock."

        scored.append({
            "item_id": item["item_id"],
            "name": item["name"],
            "category": item["category"],
            "selling_price": item["selling_price"],
            "food_cost": item["food_cost"],
            "margin": item["margin"],
            "margin_pct": item["margin_pct"],
            "order_count": item["order_count"],
            "total_revenue": revenue,
            "velocity": item["velocity"],
            "classification": cls,
            "composite_score": composite,
            "score_breakdown": {
                "margin_score": round(score_margin / 0.30, 1),
                "popularity_score": round(score_orders / 0.35, 1),
                "revenue_score": round(score_revenue / 0.25, 1),
                "margin_pct_score": round(score_margin_pct / 0.10, 1),
            },
            "tier": tier,
            "tier_color": tier_color,
            "recommendation": rec,
        })

    scored.sort(key=lambda x: x["composite_score"], reverse=True)

    # Summary stats
    total_items = len(scored)
    tiers_count = {}
    for s in scored:
        tiers_count[s["tier"]] = tiers_count.get(s["tier"], 0) + 1

    return {
        "generated_at": datetime.now().isoformat(),
        "total_items": total_items,
        "tiers_summary": tiers_count,
        "items": scored,
    }


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
    max_stock: float = 0
    cost_per_unit: float
    supplier: str = ""


class RestockRequest(BaseModel):
    ingredient_id: str
    qty_requested: float


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


@app.get("/inventory/suppliers")
def get_suppliers():
    """Return supplier registry for dropdown population."""
    return {"suppliers": list(_load_suppliers().keys())}


@app.post("/inventory/restock-request")
def send_restock_request(body: RestockRequest):
    """Send a restock request to the supplier's webhook and log it."""
    items = _load_inventory()
    suppliers = _load_suppliers()
    log = _load_restock_log()

    item = next((i for i in items if i["ingredient_id"] == body.ingredient_id), None)
    if not item:
        raise HTTPException(404, "Ingredient not found")

    supplier_name = item.get("supplier", "")
    supplier_info = suppliers.get(supplier_name)

    po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{body.ingredient_id}"

    log_entry = {
        "po_number": po_number,
        "ingredient_id": body.ingredient_id,
        "ingredient_name": item["name"],
        "unit": item["unit"],
        "qty_requested": body.qty_requested,
        "supplier": supplier_name,
        "status": "sent",
        "sent_at": datetime.now().isoformat(),
        "webhook_url": supplier_info["webhook_url"] if supplier_info else None,
        "supplier_response": None,
        "eta_days": None,
    }

    # Fire the webhook to mock supplier server
    if supplier_info:
        payload = json.dumps({
            "po_number": po_number,
            "ingredient_id": body.ingredient_id,
            "ingredient_name": item["name"],
            "qty_requested": body.qty_requested,
            "unit": item["unit"],
            "restaurant_name": "Petpooja Copilot",
            "contact": "manager@petpooja.ai",
        }).encode()

        try:
            req = urllib.request.Request(
                supplier_info["webhook_url"],
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                supplier_resp = json.loads(resp.read())
                log_entry["status"] = "acknowledged"
                log_entry["supplier_response"] = supplier_resp.get("message")
                log_entry["eta_days"] = supplier_resp.get("eta_days")
        except Exception as e:
            log_entry["status"] = "sent_no_ack"
            log_entry["supplier_response"] = f"Could not reach supplier server: {str(e)}"
    else:
        log_entry["status"] = "no_supplier_mapped"
        log_entry["supplier_response"] = "No webhook URL mapped for this supplier"

    log.append(log_entry)
    _save_restock_log(log)
    return {"message": "Restock request sent", "log": log_entry}


@app.get("/inventory/restock-requests")
def get_restock_requests():
    """Return all restock request logs."""
    return {"requests": _load_restock_log()}


@app.get("/")
def root():
    return {
        "service": "Petpooja AI Copilot",
        "status": "running",
        "modules": ["Revenue Intelligence", "Voice Ordering Copilot", "Menu Management", "Inventory Manager"],
    }
