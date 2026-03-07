"""
Module 1 — Revenue Intelligence & Menu Optimization Engine
"""
import os
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder

from modules.db import load_menu as _db_load_menu, load_transactions as _db_load_transactions


def _load_menu(restaurant_id: str = "demo") -> list[dict]:
    return _db_load_menu(restaurant_id)


def _load_transactions(restaurant_id: str = "demo") -> list[dict]:
    return _db_load_transactions(restaurant_id)


# ─────────────────────────────────────────────
# 1. Contribution Margin Analysis
# ─────────────────────────────────────────────
def contribution_margin(restaurant_id: str = "demo") -> list[dict]:
    """Calculate (selling_price - food_cost) for each item, ranked."""
    menu = _load_menu(restaurant_id)
    results = []
    for item in menu:
        margin = item["selling_price"] - item["food_cost"]
        margin_pct = round((margin / item["selling_price"]) * 100, 1)
        results.append({
            "item_id": item["item_id"],
            "name": item["name"],
            "category": item["category"],
            "selling_price": item["selling_price"],
            "food_cost": item["food_cost"],
            "margin": margin,
            "margin_pct": margin_pct,
        })
    results.sort(key=lambda x: x["margin"], reverse=True)
    return results


# ─────────────────────────────────────────────
# 2. Sales Velocity & Popularity Scoring
# ─────────────────────────────────────────────
def sales_velocity(restaurant_id: str = "demo") -> list[dict]:
    """
    Count order frequency from transactions → classify:
      Fast Mover  : top 25 %
      Slow Seller : bottom 25 %
      Moderate    : middle 50 %
    """
    menu = _load_menu(restaurant_id)
    transactions = _load_transactions(restaurant_id)

    # Count how many orders contain each item
    order_count: dict[str, int] = {}
    total_qty: dict[str, int] = {}
    for txn in transactions:
        for entry in txn["items_ordered"]:
            iid = entry["item_id"]
            order_count[iid] = order_count.get(iid, 0) + 1
            total_qty[iid] = total_qty.get(iid, 0) + entry["qty"]

    counts = [order_count.get(item["item_id"], 0) for item in menu]
    if counts:
        sorted_counts = sorted(counts)
        q25 = sorted_counts[len(sorted_counts) // 4]
        q75 = sorted_counts[3 * len(sorted_counts) // 4]
    else:
        q25, q75 = 0, 0

    results = []
    for item in menu:
        iid = item["item_id"]
        cnt = order_count.get(iid, 0)
        qty = total_qty.get(iid, 0)
        if cnt >= q75:
            velocity = "Fast Mover"
        elif cnt <= q25:
            velocity = "Slow Seller"
        else:
            velocity = "Moderate"
        results.append({
            "item_id": iid,
            "name": item["name"],
            "category": item["category"],
            "order_count": cnt,
            "total_qty_sold": qty,
            "velocity": velocity,
        })
    results.sort(key=lambda x: x["order_count"], reverse=True)
    return results


# ─────────────────────────────────────────────
# 3. Menu Matrix Classification
# ─────────────────────────────────────────────
def menu_matrix(restaurant_id: str = "demo") -> list[dict]:
    """
    Classify every item:
      Star        : high margin + high popularity
      Hidden Star : high margin + low popularity
      Plowhorse   : low margin  + high popularity
      Dog         : low margin  + low popularity
    """
    margins = contribution_margin(restaurant_id)
    velocities = sales_velocity(restaurant_id)

    margin_map = {m["item_id"]: m for m in margins}
    velocity_map = {v["item_id"]: v for v in velocities}

    # Determine median thresholds
    all_margins = [m["margin"] for m in margins]
    all_counts = [v["order_count"] for v in velocities]
    median_margin = sorted(all_margins)[len(all_margins) // 2]
    median_count = sorted(all_counts)[len(all_counts) // 2]

    results = []
    for item_id in margin_map:
        m = margin_map[item_id]
        v = velocity_map.get(item_id, {"order_count": 0, "velocity": "Slow Seller"})
        high_margin = m["margin"] >= median_margin
        high_pop = v["order_count"] >= median_count

        if high_margin and high_pop:
            classification = "Star"
        elif high_margin and not high_pop:
            classification = "Hidden Star"
        elif not high_margin and high_pop:
            classification = "Plowhorse"
        else:
            classification = "Dog"

        results.append({
            "item_id": item_id,
            "name": m["name"],
            "category": m["category"],
            "selling_price": m["selling_price"],
            "food_cost": m["food_cost"],
            "margin": m["margin"],
            "margin_pct": m["margin_pct"],
            "order_count": v["order_count"],
            "velocity": v["velocity"],
            "classification": classification,
        })

    results.sort(key=lambda x: x["margin"], reverse=True)
    return results


# ─────────────────────────────────────────────
# 4. Combo / Bundle Recommendation Engine
# ─────────────────────────────────────────────
def combo_recommendations(restaurant_id: str = "demo", min_support: float = 0.02, min_confidence: float = 0.3) -> list[dict]:
    """
    Apriori association rule mining on transaction baskets.
    Prioritize combos that include Hidden Star items.
    """
    transactions = _load_transactions(restaurant_id)
    menu = _load_menu(restaurant_id)
    name_map = {item["item_id"]: item["name"] for item in menu}

    # Build list of baskets (each basket = set of item_ids)
    baskets = []
    for txn in transactions:
        basket = list(set(entry["item_id"] for entry in txn["items_ordered"]))
        baskets.append(basket)

    # One-hot encode
    te = TransactionEncoder()
    te_array = te.fit(baskets).transform(baskets)
    df = pd.DataFrame(te_array, columns=te.columns_)

    # Run Apriori
    frequent = apriori(df, min_support=min_support, use_colnames=True)
    if frequent.empty:
        return []

    rules = association_rules(frequent, metric="confidence", min_threshold=min_confidence)
    if rules.empty:
        return []

    # Get Hidden Star item IDs for prioritization
    matrix = menu_matrix(restaurant_id)
    hidden_star_ids = {item["item_id"] for item in matrix if item["classification"] == "Hidden Star"}

    combos = []
    seen = set()
    for _, row in rules.iterrows():
        antecedents = frozenset(row["antecedents"])
        consequents = frozenset(row["consequents"])
        combo_set = antecedents | consequents
        combo_key = frozenset(combo_set)

        if combo_key in seen:
            continue
        seen.add(combo_key)

        items_list = sorted(combo_set)
        has_hidden_star = bool(combo_set & hidden_star_ids)

        combos.append({
            "combo_items": [{"item_id": iid, "name": name_map.get(iid, iid)} for iid in items_list],
            "support": round(float(row["support"]), 4),
            "confidence": round(float(row["confidence"]), 4),
            "lift": round(float(row["lift"]), 2),
            "includes_hidden_star": has_hidden_star,
        })

    # Sort: Hidden Star combos first, then by lift
    combos.sort(key=lambda x: (-int(x["includes_hidden_star"]), -x["lift"]))
    return combos[:20]  # Top 20


# ─────────────────────────────────────────────
# 5. Price Optimization Suggestions
# ─────────────────────────────────────────────
def price_suggestions(restaurant_id: str = "demo") -> list[dict]:
    """
    Rule-based pricing recommendations.
    """
    matrix = menu_matrix(restaurant_id)
    suggestions = []

    for item in matrix:
        cls = item["classification"]

        if cls == "Plowhorse":
            suggested_increase = max(10, round(item["selling_price"] * 0.08))
            suggestions.append({
                "item_id": item["item_id"],
                "name": item["name"],
                "category": item["category"],
                "classification": cls,
                "current_price": item["selling_price"],
                "current_margin": item["margin"],
                "action": "INCREASE_PRICE",
                "suggested_price": item["selling_price"] + suggested_increase,
                "reason": f"High volume ({item['order_count']} orders) but low margin (₹{item['margin']}). "
                          f"Increase price by ₹{suggested_increase} to improve profitability.",
            })
        elif cls == "Hidden Star":
            promo_price = max(item["food_cost"] + 20, round(item["selling_price"] * 0.85))
            suggestions.append({
                "item_id": item["item_id"],
                "name": item["name"],
                "category": item["category"],
                "classification": cls,
                "current_price": item["selling_price"],
                "current_margin": item["margin"],
                "action": "PROMOTE",
                "suggested_price": promo_price,
                "reason": f"High margin (₹{item['margin']}) but only {item['order_count']} orders. "
                          f"Run promotional pricing at ₹{promo_price} or include in combo deals to boost visibility.",
            })
        elif cls == "Dog":
            suggestions.append({
                "item_id": item["item_id"],
                "name": item["name"],
                "category": item["category"],
                "classification": cls,
                "current_price": item["selling_price"],
                "current_margin": item["margin"],
                "action": "REVIEW",
                "suggested_price": None,
                "reason": f"Low margin (₹{item['margin']}) and low orders ({item['order_count']}). "
                          f"Consider removing from menu or creating a special combo to clear inventory.",
            })

    suggestions.sort(key=lambda x: {"INCREASE_PRICE": 0, "PROMOTE": 1, "REVIEW": 2}[x["action"]])
    return suggestions


# ─────────────────────────────────────────────
# Convenience: hidden stars & risk items
# ─────────────────────────────────────────────
def hidden_stars(restaurant_id: str = "demo") -> list[dict]:
    """Return only Hidden Star items."""
    return [item for item in menu_matrix(restaurant_id) if item["classification"] == "Hidden Star"]


def risk_items(restaurant_id: str = "demo") -> list[dict]:
    """Return Plowhorse items (high volume, low margin)."""
    return [item for item in menu_matrix(restaurant_id) if item["classification"] == "Plowhorse"]
