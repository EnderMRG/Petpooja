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
from datetime import datetime, date

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from dotenv import load_dotenv

from modules import revenue_engine, voice_copilot

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# ═══════════════════════════════════════════════
# DB Connection Pool
# ═══════════════════════════════════════════════
try:
    _pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    print("✅ Connected to NeonDB")
except Exception as e:
    _pool = None
    print(f"⚠ Could not connect to DB: {e}")


def _get_conn():
    if not _pool:
        raise HTTPException(500, "Database not connected")
    return _pool.getconn()


def _put_conn(conn):
    if _pool and conn:
        _pool.putconn(conn)


def _db_fetch_all(sql, params=()) -> list:
    """Run a SELECT and return all rows as dicts."""
    conn = _get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]
    finally:
        _put_conn(conn)


def _db_fetch_one(sql, params=()) -> Optional[dict]:
    """Run a SELECT and return the first row as dict or None."""
    conn = _get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        _put_conn(conn)


def _db_execute(sql, params=()):
    """Run INSERT/UPDATE/DELETE and commit."""
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _put_conn(conn)


# ── RID helper (X-Restaurant-ID header) ──────────────────────────────
def _get_rid(x_restaurant_id: str | None = Header(default=None)) -> str | None:
    return x_restaurant_id or "demo"


# ═══════════════════════════════════════════════
# DB-backed data helpers  (replace JSON I/O)
# ═══════════════════════════════════════════════

def _load_menu_file(restaurant_id: str | None = None) -> list:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all(
        "SELECT item_id, name, category, selling_price, food_cost, is_available "
        "FROM menu_items WHERE restaurant_id=%s ORDER BY item_id",
        (rid,)
    )
    return [{"item_id": r["item_id"], "name": r["name"], "category": r["category"],
             "selling_price": float(r["selling_price"]), "food_cost": float(r["food_cost"]),
             "is_available": r["is_available"]} for r in rows]


def _save_menu_item_db(item: dict, restaurant_id: str = "demo"):
    _db_execute(
        "INSERT INTO menu_items (item_id, restaurant_id, name, category, selling_price, food_cost, is_available) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (item_id, restaurant_id) DO UPDATE SET "
        "name=EXCLUDED.name, category=EXCLUDED.category, selling_price=EXCLUDED.selling_price, "
        "food_cost=EXCLUDED.food_cost, is_available=EXCLUDED.is_available",
        (item["item_id"], restaurant_id, item["name"], item["category"],
         item["selling_price"], item["food_cost"], item.get("is_available", True))
    )


def _save_menu_file(data: list, restaurant_id: str | None = None):
    rid = restaurant_id or "demo"
    for item in data:
        _save_menu_item_db(item, rid)


def _load_recipes(restaurant_id: str | None = None) -> dict:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all(
        "SELECT r.item_id, m.name as item_name, r.ingredient_id, r.ingredient_name, r.qty, r.unit "
        "FROM recipes r LEFT JOIN menu_items m ON r.item_id=m.item_id AND r.restaurant_id=m.restaurant_id "
        "WHERE r.restaurant_id=%s",
        (rid,)
    )
    result = {}
    for r in rows:
        iid = r["item_id"]
        if iid not in result:
            result[iid] = {"item_id": iid, "name": r["item_name"] or iid, "ingredients": []}
        result[iid]["ingredients"].append({
            "ingredient_id": r["ingredient_id"],
            "name": r["ingredient_name"],
            "qty": float(r["qty"]),
            "unit": r["unit"]
        })
    return result


def _save_recipes(data: dict, restaurant_id: str | None = None):
    rid = restaurant_id or "demo"
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            for item_id, recipe in data.items():
                cur.execute("DELETE FROM recipes WHERE item_id=%s AND restaurant_id=%s", (item_id, rid))
                for ing in recipe.get("ingredients", []):
                    cur.execute(
                        "INSERT INTO recipes (item_id, restaurant_id, ingredient_id, ingredient_name, qty, unit) "
                        "VALUES (%s,%s,%s,%s,%s,%s)",
                        (item_id, rid, ing["ingredient_id"], ing.get("name"), ing.get("qty", 0), ing.get("unit"))
                    )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _put_conn(conn)


def _load_inventory(restaurant_id: str | None = None) -> list:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all(
        "SELECT ingredient_id, name, category, unit, current_stock, min_stock, cost_per_unit, supplier, last_restocked "
        "FROM inventory WHERE restaurant_id=%s ORDER BY ingredient_id",
        (rid,)
    )
    return [{
        "ingredient_id": r["ingredient_id"],
        "name": r["name"],
        "category": r["category"],
        "unit": r["unit"],
        "current_stock": float(r["current_stock"]),
        "min_stock": float(r["min_stock"]),
        "cost_per_unit": float(r["cost_per_unit"]),
        "supplier": r["supplier"] or "",
        "last_restocked": str(r["last_restocked"]) if r["last_restocked"] else None,
    } for r in rows]


def _save_inventory(data: list, restaurant_id: str | None = None):
    rid = restaurant_id or "demo"
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            for item in data:
                cur.execute(
                    "UPDATE inventory SET current_stock=%s, cost_per_unit=%s, last_restocked=%s "
                    "WHERE ingredient_id=%s AND restaurant_id=%s",
                    (item["current_stock"], item["cost_per_unit"], item.get("last_restocked"), item["ingredient_id"], rid)
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _put_conn(conn)


def _load_suppliers(restaurant_id: str | None = None) -> dict:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all("SELECT name, contact, categories FROM suppliers WHERE restaurant_id=%s", (rid,))
    return {r["name"]: {"contact": r["contact"], "categories": r["categories"] or []} for r in rows}


def _load_restock_log(restaurant_id: str | None = None) -> list:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all(
        "SELECT id, ingredient_id, name, quantity, unit, cost_per_unit, total_cost, supplier, created_at "
        "FROM restock_log WHERE restaurant_id=%s ORDER BY created_at DESC",
        (rid,)
    )
    return [{
        "id": r["id"],
        "ingredient_id": r["ingredient_id"],
        "ingredient_name": r["name"],
        "qty_requested": float(r["quantity"]),
        "unit": r["unit"],
        "cost_per_unit": float(r["cost_per_unit"]),
        "total_cost": float(r["total_cost"]),
        "supplier": r["supplier"],
        "sent_at": r["created_at"].isoformat() if r["created_at"] else None,
    } for r in rows]


def _save_restock_log(log: list, restaurant_id: str | None = None):
    """Append only the last entry to the DB (avoids duplicate inserts)."""
    if not log:
        return
    rid = restaurant_id or "demo"
    entry = log[-1]  # only the newest entry needs inserting
    _db_execute(
        "INSERT INTO restock_log (restaurant_id, ingredient_id, name, quantity, unit, cost_per_unit, total_cost, supplier) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (rid, entry.get("ingredient_id"), entry.get("ingredient_name", entry.get("name","")),
         entry.get("qty_requested", entry.get("quantity", 0)), entry.get("unit"),
         entry.get("cost_per_unit", 0), entry.get("total_cost", 0), entry.get("supplier"))
    )


# ── Users / Auth (from DB) ────────────────────────────────────────────
def _load_users() -> dict:
    rows = _db_fetch_all("SELECT restaurant_id, restaurant_name, owner_name, email, password, roles FROM restaurants")
    if not rows:
        return {"is_setup": False, "restaurants": []}
    restaurants = [{
        "restaurant_id": r["restaurant_id"],
        "restaurant_name": r["restaurant_name"],
        "owner_name": r["owner_name"],
        "email": r["email"],
        "password": r["password"],
        "roles": r["roles"] if isinstance(r["roles"], dict) else json.loads(r["roles"] or "{}")
    } for r in rows]
    return {"is_setup": True, "restaurants": restaurants}


def _save_users(data: dict):
    """Upsert all restaurants in the users structure."""
    for r in data.get("restaurants", []):
        _db_execute(
            "INSERT INTO restaurants (restaurant_id, restaurant_name, owner_name, email, password, roles) "
            "VALUES (%s,%s,%s,%s,%s,%s) "
            "ON CONFLICT (restaurant_id) DO UPDATE SET "
            "restaurant_name=EXCLUDED.restaurant_name, owner_name=EXCLUDED.owner_name, "
            "email=EXCLUDED.email, password=EXCLUDED.password, roles=EXCLUDED.roles",
            (r.get("restaurant_id","demo"), r["restaurant_name"], r.get("owner_name",""),
             r.get("email"), r.get("password"), json.dumps(r.get("roles",{})))
        )


# ── Orders (from DB) ─────────────────────────────────────────────────
def _load_orders_file(restaurant_id: str | None = None) -> list:
    rid = restaurant_id or "demo"
    rows = _db_fetch_all(
        "SELECT order_id, created_at, order_status, items, total_amount FROM orders "
        "WHERE restaurant_id=%s ORDER BY created_at DESC",
        (rid,)
    )
    return [{
        "order_id": r["order_id"],
        "timestamp": r["created_at"].isoformat() if r["created_at"] else None,
        "status": r["order_status"],
        "items": r["items"] if isinstance(r["items"], list) else json.loads(r["items"] or "[]"),
        "total": float(r["total_amount"]) if r["total_amount"] else 0,
    } for r in rows]


def _save_orders_file(data: list, restaurant_id: str | None = None):
    rid = restaurant_id or "demo"
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            for o in data:
                cur.execute(
                    "INSERT INTO orders (order_id, restaurant_id, created_at, order_status, items, total_amount) "
                    "VALUES (%s,%s,%s,%s,%s,%s) "
                    "ON CONFLICT (order_id, restaurant_id) DO UPDATE SET "
                    "order_status=EXCLUDED.order_status, items=EXCLUDED.items",
                    (o.get("order_id"), rid, o.get("timestamp"), o.get("status","received"),
                     json.dumps(o.get("items",[])), o.get("total",0))
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _put_conn(conn)


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
# Auth & Setup Endpoints
# ═══════════════════════════════════════════════

class SetupRequest(BaseModel):
    restaurant_name: str
    owner_name: str
    email: str
    password: str
    manager_pin: str

class LoginRequest(BaseModel):
    pin: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UpdateRolesRequest(BaseModel):
    manager_pin: Optional[str] = None
    cashier_pin: Optional[str] = None
    kitchen_pin: Optional[str] = None

@app.get("/auth/restaurants")
def list_restaurants():
    """Return all restaurants (public info only) for the login restaurant picker."""
    rows = _db_fetch_all(
        "SELECT restaurant_id, restaurant_name, owner_name FROM restaurants ORDER BY restaurant_name"
    )
    return {"restaurants": rows}

@app.get("/auth/status")
def auth_status():
    """Check if any restaurant has been set up yet."""
    rows = _db_fetch_all("SELECT restaurant_id FROM restaurants")
    return {"is_setup": len(rows) > 0}


@app.post("/auth/setup")
def auth_setup(req: SetupRequest):
    """Create a new restaurant account."""
    users = _load_users()
    restaurants = users.get("restaurants", [])
    if not restaurants and users.get("is_setup"):
        # Safe migration — copy fields, don't reference `users` itself to avoid circular ref
        restaurants = [{
            "restaurant_id": "legacy",
            "restaurant_name": users.get("restaurant_name", ""),
            "owner_name": users.get("owner_name", ""),
            "email": None, "password": None,
            "roles": users.get("roles", {})
        }]
        
    for r in restaurants:
        if r.get("email") and r.get("email") == req.email:
            raise HTTPException(400, "Email already in use. Please log in instead.")

    new_res = {
        "restaurant_id": str(uuid.uuid4()),
        "restaurant_name": req.restaurant_name,
        "owner_name": req.owner_name,
        "email": req.email,
        "password": req.password,
        "roles": {
            "manager": {"pin": req.manager_pin, "label": "Manager"},
            "cashier": {"pin": "2222", "label": "Cashier"},
            "kitchen": {"pin": "3333", "label": "Kitchen"},
        }
    }
    
    # Save as clean top-level document — no circular references
    _save_users({"is_setup": True, "restaurants": restaurants + [new_res]})
    return {
        "success": True, 
        "message": f"Restaurant '{req.restaurant_name}' created.", 
        "role": "manager",
        "restaurant_name": req.restaurant_name,
        "owner_name": req.owner_name,
        "label": "Manager"
    }

@app.post("/auth/login")
def auth_login(req: LoginRequest):
    """Validate Email/Password for owner, or PIN for role staff."""
    users = _load_users()
    restaurants = users.get("restaurants", [])
    if not restaurants and users.get("is_setup"):
        restaurants = [{
            "restaurant_id": "legacy",
            "restaurant_name": users.get("restaurant_name", ""),
            "owner_name": users.get("owner_name", ""),
            "email": None, "password": None,
            "roles": users.get("roles", {})
        }]
        
    if not restaurants:
        raise HTTPException(400, "No restaurants set up yet.")

    # Email/Password Login (Owner/Manager)
    if req.email and req.password:
        for r in restaurants:
            if r.get("email") == req.email and r.get("password") == req.password:
                return {
                    "success": True,
                    "role": "manager",
                    "label": "Manager",
                    "restaurant_id": r.get("restaurant_id", "demo"),
                    "restaurant_name": r.get("restaurant_name", ""),
                    "owner_name": r.get("owner_name", "")
                }
        raise HTTPException(401, "Invalid email or password.")
        
    # PIN Login (Roles)
    if req.pin:
        for r in restaurants:
            for role_key, role_data in r.get("roles", {}).items():
                if role_data.get("pin") == req.pin:
                    return {
                        "success": True,
                        "role": role_key,
                        "label": role_data.get("label", role_key),
                        "restaurant_id": r.get("restaurant_id", "demo"),
                        "restaurant_name": r.get("restaurant_name", ""),
                        "owner_name": r.get("owner_name", ""),
                    }
        raise HTTPException(401, "Invalid PIN.")
        
    raise HTTPException(400, "Please provide email/password or PIN.")

@app.put("/auth/roles")
def auth_update_roles(req: UpdateRolesRequest):
    """Manager can update role PINs (defaults to latest restaurant for MVP)."""
    users = _load_users()
    restaurants = users.get("restaurants", [])
    if not restaurants and users.get("is_setup"):
        restaurants = [{
            "restaurant_id": "legacy",
            "restaurant_name": users.get("restaurant_name", ""),
            "owner_name": users.get("owner_name", ""),
            "email": None, "password": None,
            "roles": users.get("roles", {})
        }]
        
    if not restaurants:
        raise HTTPException(400, "Restaurant not set up yet.")
        
    # Update the most recently added restaurant
    latest_idx = len(restaurants) - 1
    roles = restaurants[latest_idx].get("roles", {})
    if req.manager_pin:
        roles["manager"]["pin"] = req.manager_pin
    if req.cashier_pin:
        roles["cashier"]["pin"] = req.cashier_pin
    if req.kitchen_pin:
        roles["kitchen"]["pin"] = req.kitchen_pin
        
    restaurants[latest_idx]["roles"] = roles
    _save_users({"is_setup": True, "restaurants": restaurants})
    return {"success": True}


# ═══════════════════════════════════════════════
# Orders Status Endpoints (KDS)
# ═══════════════════════════════════════════════

class OrderStatusUpdate(BaseModel):
    status: str  # 'preparing' | 'ready' | 'completed' | 'cancelled'

@app.get("/orders/active")
def get_active_orders(rid: str | None = Depends(_get_rid)):
    """Return all orders that are not completed or cancelled."""
    orders = _load_orders_file(rid)
    active = [o for o in orders if o.get("status") not in ("completed", "cancelled")]
    for o in active:
        if "status" not in o:
            o["status"] = "received"
    return {"orders": active}

@app.get("/orders/all")
def get_all_orders(rid: str | None = Depends(_get_rid)):
    """Return all orders."""
    orders = _load_orders_file(rid)
    for o in orders:
        if "status" not in o:
            o["status"] = "completed"
    return {"orders": orders}

@app.put("/orders/{order_id}/status")
def update_order_status(order_id: str, req: OrderStatusUpdate, rid: str | None = Depends(_get_rid)):
    """Update the status of a specific order (kitchen use)."""
    valid = {"received", "preparing", "ready", "completed", "cancelled"}
    if req.status not in valid:
        raise HTTPException(400, f"Invalid status. Use one of: {valid}")
    orders = _load_orders_file(rid)
    for order in orders:
        if order.get("order_id") == order_id:
            order["status"] = req.status
            order["status_updated_at"] = datetime.now().isoformat()
            _save_orders_file(orders)
            return {"success": True, "order_id": order_id, "status": req.status}
    raise HTTPException(404, f"Order '{order_id}' not found.")


# ═══════════════════════════════════════════════
# Module 1 — Revenue Intelligence Endpoints
# ═══════════════════════════════════════════════


@app.get("/menu/analysis")
def menu_analysis(rid: str = Depends(_get_rid)):
    """Full item-level profitability matrix."""
    return {"items": revenue_engine.menu_matrix(rid)}


@app.get("/menu/hidden-stars")
def menu_hidden_stars(rid: str = Depends(_get_rid)):
    """Under-promoted high-margin items."""
    return {"hidden_stars": revenue_engine.hidden_stars(rid)}


@app.get("/menu/combos")
def menu_combos(rid: str = Depends(_get_rid)):
    """Recommended item bundles from Apriori association rules."""
    return {"combos": revenue_engine.combo_recommendations(rid)}


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
def voice_parse_order(input: TranscriptionInput, rid: str = Depends(_get_rid)):
    """Accept transcription text, return mapped order JSON."""
    parsed = voice_copilot.parse_order(input.transcription)

    # Get upsell suggestion
    if parsed["items"]:
        upsell = voice_copilot.suggest_upsell(parsed["items"], rid)
        parsed["upsell_suggestion"] = upsell

    return parsed


@app.post("/voice/confirm-order")
def voice_confirm_order(input: ConfirmOrderInput, rid: str = Depends(_get_rid)):
    """Finalize order, push to PoS, generate KOT, and auto-deplete inventory."""
    result = voice_copilot.confirm_order(
        items=input.items,
        upsell_accepted=input.upsell_accepted,
        upsell_items=input.upsell_items,
        language_detected=input.language_detected,
        restaurant_id=rid,
    )

    # ─── Auto-deplete inventory based on recipes ───
    recipes = _load_recipes(rid)
    inventory = _load_inventory(rid)
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

    if depleted:
        _save_inventory(list(inv_map.values()), rid)

    result["inventory_impact"] = {
        "depleted": list(depleted.values()),
        "stock_alerts": stock_alerts,
    }
    return result


@app.get("/voice/orders")
def voice_orders(rid: str = Depends(_get_rid)):
    """List all placed orders."""
    return {"orders": voice_copilot.get_all_orders(rid)}


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
def get_menu_items(rid: str = Depends(_get_rid)):
    """Return all raw menu items."""
    return {"items": _load_menu_file(rid)}


@app.post("/menu/items", status_code=201)
def add_menu_item(item: MenuItemCreate, rid: str = Depends(_get_rid)):
    """Add a new menu item and persist to DB."""
    menu = _load_menu_file(rid)
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
    _save_menu_item_db(new_item, rid)
    return {"item": new_item, "message": "Item added successfully"}


@app.put("/menu/items/{item_id}")
def update_menu_item(item_id: str, updates: MenuItemUpdate, rid: str = Depends(_get_rid)):
    """Update any fields of a menu item."""
    menu = _load_menu_file(rid)
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
            _save_menu_item_db(item, rid)
            return {"item": item, "message": "Item updated successfully"}
    raise HTTPException(status_code=404, detail=f"Item {item_id} not found")


@app.patch("/menu/items/{item_id}/toggle")
def toggle_menu_item(item_id: str, rid: str = Depends(_get_rid)):
    """Toggle availability of a menu item."""
    menu = _load_menu_file(rid)
    for item in menu:
        if item["item_id"] == item_id:
            item["is_available"] = not item.get("is_available", True)
            _save_menu_item_db(item, rid)
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



# ─── Inventory Management ───────────────────────────────────────────


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
