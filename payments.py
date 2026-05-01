# payments.py
import uuid

from database import payments_db
from model import payment_from_db, payment_to_db


def get_all():
    rows = payments_db.get_all(order_by="created_at", desc=True)
    return [payment_from_db(row) for row in rows]


def create(data):
    if not isinstance(data, dict):
        return {"ok": False, "message": "Invalid payload."}

    payload = dict(data)
    payload["id"] = str(payload.get("id") or f"PAY-{uuid.uuid4().hex[:10].upper()}")

    db_data = payment_to_db(payload)
    created = payments_db.insert(db_data)

    return {
        "ok": True,
        "message": "Payment created successfully.",
        "id": created.get("id", payload["id"]),
    }


def update_status(payment_id, status):
    payment_id = str(payment_id or "").strip()

    if not payment_id:
        return {"ok": False, "message": "Missing payment id.", "id": payment_id}

    updated = payments_db.update_by_id(
        payment_id,
        {
            "status": str(status or "Pending").strip() or "Pending",
        },
    )

    if not updated:
        return {"ok": False, "message": "Payment not found.", "id": payment_id}

    return {
        "ok": True,
        "message": "Payment status updated.",
        "id": payment_id,
        "status": updated.get("status", "Pending"),
    }