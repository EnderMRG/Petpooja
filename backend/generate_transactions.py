"""
Generate realistic mock PoS transaction data.
Run once: python generate_transactions.py
"""
import json, random, os
from datetime import datetime, timedelta

random.seed(42)

# ── Commonly co-ordered item groups (ensures Apriori finds meaningful rules) ──
COMBO_PATTERNS = [
    (["M001", "M019", "M029"], 0.08),   # Veg Burger + Fries + Lime Soda
    (["M003", "M019", "M027"], 0.07),   # Chicken Burger + Fries + Cold Coffee
    (["M002", "M021", "M031"], 0.06),   # Paneer Burger + Garlic Bread + Oreo Shake
    (["M009", "M021"], 0.07),           # Margherita Pizza + Garlic Bread
    (["M010", "M029"], 0.05),           # Paneer Tikka Pizza + Lime Soda
    (["M011", "M018", "M027"], 0.06),   # Pepperoni Pizza + Wings + Cold Coffee
    (["M017", "M030"], 0.05),           # Paneer Tikka + Chai
    (["M004", "M019", "M032"], 0.04),   # Double Decker + Fries + Mojito
    (["M037", "M027"], 0.05),           # Brownie + Cold Coffee
    (["M016", "M047", "M036"], 0.03),   # Mushroom Truffle Pizza + Cheese Garlic Bread + Cappuccino
    (["M012", "M020", "M035"], 0.04),   # Farm Fresh Pizza + Nachos + Iced Tea
    (["M045", "M034"], 0.03),           # Lava Cake + Hot Chocolate
    (["M005", "M046", "M029"], 0.04),   # Aloo Tikki Burger + Peri Peri Fries + Lime Soda
    (["M008", "M024", "M028"], 0.03),   # Tandoori Paneer Burger + Hara Bhara Kebab + Lassi
    (["M039", "M033"], 0.03),           # Sundae + Strawberry Smoothie
]

ALL_ITEM_IDS = [f"M{str(i).zfill(3)}" for i in range(1, 51)]

def generate_transactions(n=800):
    txns = []
    base_date = datetime(2025, 6, 1, 10, 0)
    order_counter = 1

    for _ in range(n):
        items_ordered = []
        roll = random.random()
        cumulative = 0.0

        # Try to select a combo pattern
        pattern_used = False
        for pattern_items, prob in COMBO_PATTERNS:
            cumulative += prob
            if roll < cumulative:
                for item_id in pattern_items:
                    items_ordered.append({"item_id": item_id, "qty": random.choice([1, 1, 1, 2])})
                pattern_used = True
                break

        # If no pattern matched, generate random items
        if not pattern_used:
            num_items = random.choices([1, 2, 3, 4], weights=[25, 40, 25, 10])[0]
            chosen = random.sample(ALL_ITEM_IDS, num_items)
            for item_id in chosen:
                items_ordered.append({"item_id": item_id, "qty": random.choice([1, 1, 1, 2])})

        # Add occasional extra items to combo orders
        if pattern_used and random.random() < 0.3:
            extra = random.choice(ALL_ITEM_IDS)
            if extra not in [i["item_id"] for i in items_ordered]:
                items_ordered.append({"item_id": extra, "qty": 1})

        # Generate timestamp (spread across 6 months, peak lunch/dinner hours)
        days_offset = random.randint(0, 180)
        hour = random.choices(
            [11, 12, 13, 14, 18, 19, 20, 21],
            weights=[10, 20, 20, 10, 10, 20, 20, 10]
        )[0]
        minute = random.randint(0, 59)
        ts = base_date + timedelta(days=days_offset, hours=hour - 10, minutes=minute)

        txns.append({
            "order_id": f"ORD-{str(order_counter).zfill(4)}",
            "timestamp": ts.isoformat(),
            "items_ordered": items_ordered
        })
        order_counter += 1

    # Sort by timestamp
    txns.sort(key=lambda x: x["timestamp"])
    return txns


if __name__ == "__main__":
    data = generate_transactions(800)
    out_path = os.path.join(os.path.dirname(__file__), "data", "transactions.json")
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {len(data)} transactions → {out_path}")
