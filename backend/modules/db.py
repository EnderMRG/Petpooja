"""
modules/db.py - Shared NeonDB connection pool for all modules.
All backend modules import from here instead of reading JSON files.
"""
import os
import json
import psycopg2
import psycopg2.extras
from psycopg2 import pool
from dotenv import load_dotenv
from typing import Optional

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    _pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    print("✅ [modules/db] NeonDB pool ready")
except Exception as e:
    _pool = None
    print(f"⚠ [modules/db] DB connection failed: {e}")


def get_conn():
    if not _pool:
        raise RuntimeError("Database not connected")
    return _pool.getconn()


def put_conn(conn):
    if _pool and conn:
        _pool.putconn(conn)


def fetch_all(sql, params=()) -> list:
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]
    finally:
        put_conn(conn)


def fetch_one(sql, params=()) -> Optional[dict]:
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        put_conn(conn)


def execute(sql, params=()):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)


def execute_many(sql, rows: list):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.executemany(sql, rows)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)


# ─── Convenience helpers used by multiple modules ─────────────────────────

def load_menu(restaurant_id: str = "demo") -> list[dict]:
    rows = fetch_all(
        "SELECT item_id, name, category, selling_price, food_cost, is_available "
        "FROM menu_items WHERE restaurant_id=%s ORDER BY item_id",
        (restaurant_id,)
    )
    return [{
        "item_id": r["item_id"],
        "name": r["name"],
        "category": r["category"],
        "selling_price": float(r["selling_price"]),
        "food_cost": float(r["food_cost"]),
        "is_available": r["is_available"],
    } for r in rows]


def load_transactions(restaurant_id: str = "demo") -> list[dict]:
    rows = fetch_all(
        "SELECT order_id, created_at, items_ordered FROM transactions "
        "WHERE restaurant_id=%s ORDER BY created_at",
        (restaurant_id,)
    )
    result = []
    for r in rows:
        items = r["items_ordered"]
        if isinstance(items, str):
            items = json.loads(items)
        result.append({
            "order_id": r["order_id"],
            "timestamp": r["created_at"].isoformat() if r["created_at"] else None,
            "items_ordered": items,
        })
    return result


def load_orders(restaurant_id: str = "demo") -> list[dict]:
    rows = fetch_all(
        "SELECT order_id, created_at, order_status, items, total_amount "
        "FROM orders WHERE restaurant_id=%s ORDER BY created_at DESC",
        (restaurant_id,)
    )
    return [{
        "order_id": r["order_id"],
        "timestamp": r["created_at"].isoformat() if r["created_at"] else None,
        "status": r["order_status"],
        "items": r["items"] if isinstance(r["items"], list) else json.loads(r["items"] or "[]"),
        "total": float(r["total_amount"]) if r["total_amount"] else 0,
    } for r in rows]


def save_order(order: dict, restaurant_id: str = "demo"):
    items = order.get("items", [])
    total = float(order.get("total", 0) or 0) or sum(
        float(i.get("price", 0)) * int(i.get("quantity", i.get("qty", 1))) for i in items
    )
    execute(
        "INSERT INTO orders (order_id, restaurant_id, created_at, order_status, items, total_amount) "
        "VALUES (%s,%s,%s,%s,%s,%s) "
        "ON CONFLICT (order_id, restaurant_id) DO UPDATE SET "
        "order_status=EXCLUDED.order_status, items=EXCLUDED.items, total_amount=EXCLUDED.total_amount",
        (order["order_id"], restaurant_id, order.get("timestamp"),
         order.get("status", "received"), json.dumps(items), round(total, 2))
    )


def update_order_status(order_id: str, status: str, restaurant_id: str = "demo"):
    execute(
        "UPDATE orders SET order_status=%s WHERE order_id=%s AND restaurant_id=%s",
        (status, order_id, restaurant_id)
    )
