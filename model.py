# model.py
from datetime import datetime
from typing import Any, Optional


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def clean_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def to_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except Exception:
        return default


def to_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value

    if value is None:
        return default

    text = str(value).strip().lower()

    if text in ("true", "1", "yes", "y", "visible", "active"):
        return True

    if text in ("false", "0", "no", "n", "hidden", "inactive"):
        return False

    return default


# =========================================================
# Admin
# =========================================================

def admin_from_db(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "name": row.get("name", ""),
        "username": row.get("username", ""),
        "role": row.get("role", "admin"),
        "status": row.get("status", "offline"),
        "createdAt": row.get("created_at", ""),
    }


def admin_to_db(data: dict) -> dict:
    return {
        "id": clean_text(data.get("id")),
        "name": clean_text(data.get("name")),
        "username": clean_text(data.get("username")),
        "password_hash": clean_text(data.get("passwordHash") or data.get("password_hash") or data.get("password")),
        "role": clean_text(data.get("role"), "admin"),
        "status": clean_text(data.get("status"), "offline"),
        "created_at": data.get("createdAt") or data.get("created_at") or now_iso(),
    }


# =========================================================
# Config
# =========================================================

def config_from_db(row: dict) -> dict:
    return {
        "app": {
            "title": row.get("title", "AM Cosmetic Hub"),
            "currency": row.get("currency", "PHP"),
            "theme": row.get("theme", "light"),
            "acceptMode": row.get("accept_mode", "MANUAL"),
        },
        "fees": {
            "codPercent": to_float(row.get("cod_percent"), 3),
            "ewalletPercent": to_float(row.get("ewallet_percent"), 2),
            "counterPercent": to_float(row.get("counter_percent"), 2),
            "cardPercent": to_float(row.get("card_percent"), 0),
        },
        "images": {
            "qrcode": row.get("qr_code_url", ""),
            "productFallback": row.get("product_fallback_url", ""),
            "brandFallback": row.get("brand_fallback_url", ""),
        },
        "tracking": {
            "prefix": row.get("tracking_prefix", "AMCH"),
        },
    }


def config_to_db(data: dict) -> dict:
    app = data.get("app", {}) or {}
    fees = data.get("fees", {}) or {}
    images = data.get("images", {}) or {}
    tracking = data.get("tracking", {}) or {}

    return {
        "title": clean_text(app.get("title"), "AM Cosmetic Hub"),
        "currency": clean_text(app.get("currency"), "PHP"),
        "theme": clean_text(app.get("theme"), "light"),
        "accept_mode": clean_text(app.get("acceptMode"), "MANUAL"),

        "cod_percent": to_float(fees.get("codPercent"), 3),
        "ewallet_percent": to_float(fees.get("ewalletPercent"), 2),
        "counter_percent": to_float(fees.get("counterPercent"), 2),
        "card_percent": to_float(fees.get("cardPercent"), 0),

        "qr_code_url": clean_text(images.get("qrcode")),
        "product_fallback_url": clean_text(images.get("productFallback")),
        "brand_fallback_url": clean_text(images.get("brandFallback")),

        "tracking_prefix": clean_text(tracking.get("prefix"), "AMCH"),
    }


# =========================================================
# Brand
# =========================================================

def brand_from_db(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "name": row.get("name", ""),
        "img": row.get("image_url", ""),
        "imageUrl": row.get("image_url", ""),
        "createdAt": row.get("created_at", ""),
        "updatedAt": row.get("updated_at", ""),
    }


def brand_to_db(data: dict) -> dict:
    return {
        "id": clean_text(data.get("id")),
        "name": clean_text(data.get("name")),
        "image_url": clean_text(data.get("imageUrl") or data.get("image_url") or data.get("img")),
    }


# =========================================================
# Product
# =========================================================

def product_from_db(
    row: dict,
    images: Optional[list[dict]] = None,
    reviews: Optional[list[dict]] = None,
) -> dict:
    product_images = images or []
    product_reviews = reviews or []

    return {
        "id": row.get("id", ""),
        "brandID": row.get("brand_id", ""),
        "brandId": row.get("brand_id", ""),
        "name": row.get("name", ""),
        "description": row.get("description", ""),
        "pricing": {
            "realPrice": to_float(row.get("real_price"), 0),
            "displayPrice": to_float(row.get("display_price"), 0),
        },
        "stock": to_int(row.get("stock"), 0),
        "sold": to_int(row.get("sold"), 0),
        "cartAddedCount": to_int(row.get("cart_added_count"), 0),
        "createdAt": row.get("created_at", ""),
        "updatedAt": row.get("updated_at", ""),
        "images": [
            image.get("image_url", "")
            for image in sorted(product_images, key=lambda item: item.get("sort_order", 1))
            if image.get("image_url")
        ],
        "reviews": [
            review_from_db(review)
            for review in product_reviews
        ],
    }


def product_to_db(data: dict) -> dict:
    pricing = data.get("pricing", {}) or {}

    return {
        "id": clean_text(data.get("id")),
        "brand_id": clean_text(data.get("brandID") or data.get("brandId") or data.get("brand_id")),
        "name": clean_text(data.get("name")),
        "description": clean_text(data.get("description")),
        "real_price": to_float(pricing.get("realPrice") or data.get("realPrice") or data.get("real_price"), 0),
        "display_price": to_float(pricing.get("displayPrice") or data.get("displayPrice") or data.get("display_price"), 0),
        "stock": to_int(data.get("stock"), 0),
        "sold": to_int(data.get("sold"), 0),
        "cart_added_count": to_int(data.get("cartAddedCount") or data.get("cart_added_count"), 0),
        "created_at": data.get("createdAt") or data.get("created_at") or now_iso(),
        "updated_at": data.get("updatedAt") or data.get("updated_at") or now_iso(),
    }


def product_image_to_db(product_id: str, image_url: str, sort_order: int = 1) -> dict:
    return {
        "product_id": product_id,
        "image_url": clean_text(image_url),
        "alt_text": "",
        "sort_order": sort_order,
    }


# =========================================================
# Review
# =========================================================

def review_from_db(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "orderID": row.get("order_id", ""),
        "customerName": row.get("customer_name", "Anonymous"),
        "visible": str(bool(row.get("visible", False))).lower(),
        "rating": to_int(row.get("rating"), 0),
        "text": row.get("text", ""),
        "reply": row.get("reply", ""),
        "replyAdmin": row.get("reply_admin", ""),
        "like": to_int(row.get("like_count"), 0),
        "dislike": to_int(row.get("dislike_count"), 0),
        "date": row.get("review_date", ""),
        "time": row.get("review_time", ""),
        "createdAt": row.get("created_at", ""),
        "status": row.get("status", "visible"),
    }


def review_to_db(data: dict, product_id: str) -> dict:
    return {
        "id": clean_text(data.get("id")),
        "product_id": product_id,
        "order_id": clean_text(data.get("orderID") or data.get("order_id")),
        "customer_name": clean_text(data.get("customerName"), "Anonymous"),
        "visible": to_bool(data.get("visible"), False),
        "rating": to_int(data.get("rating"), 0),
        "text": clean_text(data.get("text")),
        "reply": clean_text(data.get("reply")),
        "reply_admin": clean_text(data.get("replyAdmin") or data.get("reply_admin")),
        "like_count": to_int(data.get("like"), 0),
        "dislike_count": to_int(data.get("dislike"), 0),
        "review_date": data.get("date") or data.get("review_date") or None,
        "review_time": data.get("time") or data.get("review_time") or None,
        "created_at": data.get("createdAt") or data.get("created_at") or now_iso(),
        "status": clean_text(data.get("status"), "visible"),
    }


# =========================================================
# Payment
# =========================================================

def payment_from_db(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "amount": to_float(row.get("amount"), 0),
        "method": row.get("method", ""),
        "status": row.get("status", "Pending"),
        "paid": to_float(row.get("paid"), 0),
    }


def payment_to_db(data: dict) -> dict:
    return {
        "id": clean_text(data.get("id")),
        "amount": to_float(data.get("amount"), 0),
        "method": clean_text(data.get("method")),
        "status": clean_text(data.get("status"), "Pending"),
        "paid": to_float(data.get("paid"), 0),
    }


# =========================================================
# Order
# =========================================================

def order_from_db(row: dict, items: Optional[list[dict]] = None) -> dict:
    order_items = items or []

    return {
        "id": row.get("id", ""),
        "time": row.get("order_time", ""),
        "date": row.get("order_date", ""),
        "paymentID": row.get("payment_id", ""),
        "reference": row.get("reference", ""),
        "customer": {
            "ip": row.get("customer_ip", ""),
            "name": row.get("customer_name", ""),
            "address": row.get("customer_address", ""),
            "landmark": row.get("customer_landmark", ""),
            "number": row.get("customer_number", ""),
            "email": row.get("customer_email", ""),
        },
        "products": [
            order_item_from_db(item)
            for item in order_items
        ],
    }


def order_to_db(data: dict) -> dict:
    customer = data.get("customer", {}) or {}

    return {
        "id": clean_text(data.get("id")),
        "payment_id": clean_text(data.get("paymentID") or data.get("payment_id")),
        "reference": clean_text(data.get("reference")),

        "customer_ip": clean_text(customer.get("ip")),
        "customer_name": clean_text(customer.get("name")),
        "customer_address": clean_text(customer.get("address")),
        "customer_landmark": clean_text(customer.get("landmark")),
        "customer_number": clean_text(customer.get("number")),
        "customer_email": clean_text(customer.get("email")),

        "order_date": data.get("date") or data.get("order_date") or None,
        "order_time": data.get("time") or data.get("order_time") or None,
    }


def order_item_from_db(row: dict) -> dict:
    return {
        "id": row.get("product_id", ""),
        "quantity": to_int(row.get("quantity"), 0),
        "price": to_float(row.get("price"), 0),
        "total": to_float(row.get("total"), 0),
        "request": row.get("request", ""),
    }


def order_item_to_db(order_id: str, data: dict) -> dict:
    return {
        "order_id": order_id,
        "product_id": clean_text(data.get("id") or data.get("productID") or data.get("product_id")),
        "quantity": to_int(data.get("quantity"), 1),
        "price": to_float(data.get("price"), 0),
        "total": to_float(data.get("total"), 0),
        "request": clean_text(data.get("request")),
    }