# orders.py
import uuid

from database import orders_db, order_items_db
from model import order_from_db, order_item_to_db, order_to_db


def get_all():
    orders = orders_db.get_all(order_by="created_at", desc=True)
    result = []

    for order in orders:
        items = order_items_db.find_many(
            "order_id",
            order.get("id"),
            order_by="id",
            desc=False,
        )
        result.append(order_from_db(order, items))

    return result


def create(data):
    if not isinstance(data, dict):
        return {"ok": False, "message": "Invalid payload."}

    payload = dict(data)
    payload["id"] = str(payload.get("id") or f"ORD-{uuid.uuid4().hex[:10].upper()}")

    if not payload.get("reference"):
        payload["reference"] = f"AMCH-{uuid.uuid4().hex[:8].upper()}"

    order_data = order_to_db(payload)

    if not order_data.get("customer_name"):
        return {"ok": False, "message": "Customer name is required."}

    if not order_data.get("reference"):
        return {"ok": False, "message": "Order reference is required."}

    created_order = orders_db.insert(order_data)
    order_id = created_order.get("id", payload["id"])

    item_rows = []
    for item in payload.get("products", []) or []:
        item_row = order_item_to_db(order_id, item)

        if item_row.get("product_id"):
            item_rows.append(item_row)

    if item_rows:
        order_items_db.insert_many(item_rows)

    return {
        "ok": True,
        "message": "Order created successfully.",
        "id": order_id,
        "reference": created_order.get("reference", payload.get("reference", "")),
        "paymentID": created_order.get("payment_id", payload.get("paymentID", "")),
    }


def track(reference):
    reference = str(reference or "").strip()

    if not reference:
        return {"found": False, "message": "Missing order reference."}

    order = orders_db.find_one("reference", reference)

    if not order:
        return {"found": False, "message": "Order not found."}

    items = order_items_db.find_many(
        "order_id",
        order.get("id"),
        order_by="id",
        desc=False,
    )

    return {
        "found": True,
        "order": order_from_db(order, items),
    }