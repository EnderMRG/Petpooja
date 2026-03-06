"""
Mock Supplier Webhook Server — Petpooja AI Copilot
Runs on port 8001. Simulates real supplier REST APIs.
Each supplier has its own endpoint: POST /suppliers/{slug}/order
"""
import json
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mock Supplier Webhook Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPLIERS = {
    "bakers-best":  "Baker's Best",
    "amul":         "Amul Wholesale",
    "fresh-farms":  "Fresh Farms",
    "green-valley": "Green Valley",
    "mccain":       "McCain India",
    "kissan":       "Kissan Supply",
    "fortune":      "Fortune Supply",
    "del-monte":    "Del Monte India",
    "bru":          "Bru Wholesale",
    "spice-hub":    "Spice Hub",
}

received_orders = []


@app.post("/suppliers/{slug}/order")
async def receive_order(slug: str, request: Request):
    """Simulate supplier receiving a restock order."""
    if slug not in SUPPLIERS:
        return {"status": "error", "message": f"Unknown supplier: {slug}"}

    body = await request.json()
    supplier_name = SUPPLIERS[slug]

    order_record = {
        "received_at": datetime.now().isoformat(),
        "supplier": supplier_name,
        "slug": slug,
        "ingredient": body.get("ingredient_name", "Unknown"),
        "qty_requested": body.get("qty_requested", 0),
        "unit": body.get("unit", ""),
        "restaurant": body.get("restaurant_name", "Petpooja Copilot"),
        "po_number": body.get("po_number", ""),
    }
    received_orders.append(order_record)

    print(f"\n[SUPPLIER ORDER RECEIVED] {supplier_name}")
    print(f"  Item     : {order_record['ingredient']}")
    print(f"  Quantity : {order_record['qty_requested']} {order_record['unit']}")
    print(f"  PO#      : {order_record['po_number']}")
    print(f"  Time     : {order_record['received_at']}")

    # Simulate processing time and acknowledgement
    eta_days = {
        "bakers-best": 1, "amul": 1, "fresh-farms": 1,
        "green-valley": 2, "mccain": 2, "kissan": 1,
        "fortune": 2, "del-monte": 3, "bru": 2, "spice-hub": 2,
    }.get(slug, 2)

    return {
        "status": "accepted",
        "message": f"Order received by {supplier_name}. Expected delivery in {eta_days} day(s).",
        "po_number": order_record["po_number"],
        "supplier": supplier_name,
        "eta_days": eta_days,
        "acknowledged_at": datetime.now().isoformat(),
    }


@app.get("/suppliers/orders")
def get_all_received_orders():
    """View all orders received by the mock supplier server."""
    return {"orders": received_orders, "total": len(received_orders)}


@app.get("/")
def root():
    return {
        "service": "Mock Supplier Webhook Server",
        "status": "running",
        "port": 8001,
        "suppliers": list(SUPPLIERS.values()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
