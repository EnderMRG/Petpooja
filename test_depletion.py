import urllib.request
import json

# Check current stock
data = json.loads(urllib.request.urlopen('http://localhost:8000/inventory/items').read())
buns_before = [i for i in data['items'] if i['ingredient_id'] == 'ING001'][0]['current_stock']
print(f"Burger Buns BEFORE order: {buns_before}")

# Place order for 3x Classic Veg Burger
order_body = json.dumps({
    "items": [{"item_id": "M001", "name": "Classic Veg Burger", "qty": 3, "quantity": 3, "price": 149, "modifiers": []}],
    "upsell_accepted": False,
    "language_detected": "Manual"
}).encode()

req = urllib.request.Request(
    'http://localhost:8000/voice/confirm-order',
    data=order_body,
    headers={'Content-Type': 'application/json'}
)
resp = json.loads(urllib.request.urlopen(req).read())

print("\n--- Stock Impact ---")
impact = resp.get('inventory_impact', {})
for d in impact.get('depleted', []):
    print(f"  {d['name']}: -{d['subtracted']} {d['unit']} -> {d['remaining']} left")

alerts = impact.get('stock_alerts', [])
print(f"\nLow Stock Alerts: {len(alerts)}")
for a in alerts:
    print(f"  WARNING: {a['name']} ({a['current_stock']} {a['unit']} remaining, min: {a['min_stock']})")

# Verify buns after
data2 = json.loads(urllib.request.urlopen('http://localhost:8000/inventory/items').read())
buns_after = [i for i in data2['items'] if i['ingredient_id'] == 'ING001'][0]['current_stock']
print(f"\nBurger Buns AFTER order: {buns_after}")
print(f"Depleted: {buns_before - buns_after} pcs (expected: 3)")
