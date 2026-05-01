# products.py
import uuid

from database import products_db, product_images_db, product_reviews_db
from model import (
    product_from_db,
    product_image_to_db,
    product_to_db,
    review_from_db,
)


def _get_product_images(product_id):
    return product_images_db.find_many(
        "product_id",
        product_id,
        order_by="sort_order",
        desc=False,
    )


def _get_product_reviews(product_id):
    return product_reviews_db.find_many(
        "product_id",
        product_id,
        order_by="created_at",
        desc=True,
    )


def get_all():
    rows = products_db.get_all(order_by="created_at", desc=False)
    result = []

    for row in rows:
        product_id = row.get("id")
        images = _get_product_images(product_id)
        reviews = _get_product_reviews(product_id)
        result.append(product_from_db(row, images, reviews))

    return result


def create_product_entry(payload):
    if not isinstance(payload, dict):
        return {"ok": False, "message": "Invalid payload."}

    data = dict(payload)
    data["id"] = str(data.get("id") or f"P{uuid.uuid4().hex[:6].upper()}")

    db_product = product_to_db(data)

    if not db_product.get("id"):
        return {"ok": False, "message": "Product id is required."}

    if not db_product.get("brand_id"):
        return {"ok": False, "message": "Brand id is required."}

    if not db_product.get("name"):
        return {"ok": False, "message": "Product name is required."}

    created = products_db.insert(db_product)
    product_id = created.get("id", db_product["id"])

    image_rows = []
    for index, image_url in enumerate(data.get("images", []) or [], start=1):
        image_url = str(image_url or "").strip()

        if image_url:
            image_rows.append(product_image_to_db(product_id, image_url, index))

    if image_rows:
        product_images_db.insert_many(image_rows)

    return {
        "ok": True,
        "message": "Product created.",
        "id": product_id,
    }


def replace_product_entry(product_id, payload):
    if not isinstance(payload, dict):
        return {"ok": False, "message": "Invalid payload.", "id": product_id}

    product_id = str(product_id or "").strip()

    if not product_id:
        return {"ok": False, "message": "Missing product id.", "id": product_id}

    existing = products_db.get_by_id(product_id)

    if not existing:
        return {"ok": False, "message": "Product not found.", "id": product_id}

    data = dict(payload)
    data["id"] = str(data.get("id") or product_id)

    db_product = product_to_db(data)
    db_product["id"] = product_id

    updated = products_db.update_by_id(product_id, db_product)

    product_images_db.delete_where("product_id", product_id)

    image_rows = []
    for index, image_url in enumerate(data.get("images", []) or [], start=1):
        image_url = str(image_url or "").strip()

        if image_url:
            image_rows.append(product_image_to_db(product_id, image_url, index))

    if image_rows:
        product_images_db.insert_many(image_rows)

    return {
        "ok": bool(updated),
        "message": "Product updated." if updated else "Product not found.",
        "id": product_id,
    }


def delete_product_entry(product_id):
    product_id = str(product_id or "").strip()

    if not product_id:
        return {"ok": False, "message": "Missing product id.", "id": product_id}

    deleted = products_db.delete_by_id(product_id)

    if not deleted:
        return {"ok": False, "message": "Product not found.", "id": product_id}

    return {
        "ok": True,
        "message": "Product deleted.",
        "id": product_id,
    }


def clear_products():
    products = products_db.get_all()

    for product in products:
        product_id = product.get("id")
        if product_id:
            products_db.delete_by_id(product_id)

    return {
        "ok": True,
        "message": "Products cleared.",
    }


def update_product(product_id, payload):
    if not isinstance(payload, dict):
        return {"ok": False, "message": "Invalid payload.", "id": product_id}

    product_id = str(product_id or "").strip()

    if not product_id:
        return {"ok": False, "message": "Missing product id.", "id": product_id}

    product = products_db.get_by_id(product_id)

    if not product:
        return {"ok": False, "message": "Product not found.", "id": product_id}

    update_data = {}

    delta = payload.get("delta")
    sold_delta = payload.get("soldDelta")

    if delta is not None:
        current_stock = int(product.get("stock") or 0)
        update_data["stock"] = max(0, current_stock - int(float(delta or 0)))

    if sold_delta is not None:
        current_sold = int(product.get("sold") or 0)
        update_data["sold"] = max(0, current_sold + int(float(sold_delta or 0)))

    if not update_data:
        return {
            "ok": True,
            "message": "No product changes applied.",
            "id": product_id,
        }

    products_db.update_by_id(product_id, update_data)

    return {
        "ok": True,
        "message": "Product updated.",
        "id": product_id,
    }


def update_cart_count(product_id, delta):
    product_id = str(product_id or "").strip()

    if not product_id:
        return {"ok": False, "message": "Missing product id.", "id": product_id}

    product = products_db.get_by_id(product_id)

    if not product:
        return {"ok": False, "message": "Product not found.", "id": product_id}

    current = int(product.get("cart_added_count") or 0)
    next_value = max(0, current + int(float(delta or 0)))

    products_db.update_by_id(product_id, {"cart_added_count": next_value})

    return {
        "ok": True,
        "id": product_id,
        "cartAddedCount": next_value,
    }


def get_all_reviews():
    products = products_db.get_all(order_by="created_at", desc=False)
    reviews = []

    for product in products:
        product_id = product.get("id")
        product_name = product.get("name", "")

        images = _get_product_images(product_id)
        image = images[0].get("image_url", "") if images else ""

        product_reviews = _get_product_reviews(product_id)

        for review in product_reviews:
            reviews.append({
                **review_from_db(review),
                "productID": product_id,
                "productName": product_name,
                "image": image,
            })

    return reviews


def reply_to_review(review_id, reply, admin_name):
    review_id = str(review_id or "").strip()

    if not review_id:
        return {"ok": False, "message": "Missing review id.", "id": review_id}

    updated = product_reviews_db.update_by_id(
        review_id,
        {
            "reply": str(reply or "").strip(),
            "reply_admin": str(admin_name or "Administrator").strip() or "Administrator",
        },
    )

    if not updated:
        return {"ok": False, "message": "Review not found.", "id": review_id}

    return {
        "ok": True,
        "message": "Reply saved.",
        "id": review_id,
    }