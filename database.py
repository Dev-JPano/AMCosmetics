# database.py
import os
from typing import Any, Optional

from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


if not SUPABASE_URL:
    raise RuntimeError("Missing SUPABASE_URL in .env")

if not SUPABASE_ANON_KEY:
    raise RuntimeError("Missing SUPABASE_ANON_KEY in .env")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY in .env")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class Database:
    def __init__(self, table_name: str, use_admin: bool = True):
        self.table_name = table_name
        self.client = supabase_admin if use_admin else supabase

    def get_all(
        self,
        order_by: Optional[str] = None,
        desc: bool = False,
        limit: Optional[int] = None,
    ) -> list[dict]:
        query = self.client.table(self.table_name).select("*")

        if order_by:
            query = query.order(order_by, desc=desc)

        if limit is not None:
            query = query.limit(limit)

        response = query.execute()
        return response.data or []

    def get_by_id(self, record_id: Any, id_column: str = "id") -> Optional[dict]:
        response = (
            self.client
            .table(self.table_name)
            .select("*")
            .eq(id_column, record_id)
            .limit(1)
            .execute()
        )

        rows = response.data or []
        return rows[0] if rows else None

    def find_one(self, column: str, value: Any) -> Optional[dict]:
        response = (
            self.client
            .table(self.table_name)
            .select("*")
            .eq(column, value)
            .limit(1)
            .execute()
        )

        rows = response.data or []
        return rows[0] if rows else None

    def find_many(
        self,
        column: str,
        value: Any,
        order_by: Optional[str] = None,
        desc: bool = False,
    ) -> list[dict]:
        query = (
            self.client
            .table(self.table_name)
            .select("*")
            .eq(column, value)
        )

        if order_by:
            query = query.order(order_by, desc=desc)

        response = query.execute()
        return response.data or []

    def insert(self, data: dict) -> dict:
        response = (
            self.client
            .table(self.table_name)
            .insert(data)
            .execute()
        )

        rows = response.data or []
        return rows[0] if rows else {}

    def insert_many(self, rows: list[dict]) -> list[dict]:
        if not rows:
            return []

        response = (
            self.client
            .table(self.table_name)
            .insert(rows)
            .execute()
        )

        return response.data or []

    def update_by_id(self, record_id: Any, data: dict, id_column: str = "id") -> Optional[dict]:
        response = (
            self.client
            .table(self.table_name)
            .update(data)
            .eq(id_column, record_id)
            .execute()
        )

        rows = response.data or []
        return rows[0] if rows else None

    def update_where(self, column: str, value: Any, data: dict) -> list[dict]:
        response = (
            self.client
            .table(self.table_name)
            .update(data)
            .eq(column, value)
            .execute()
        )

        return response.data or []

    def delete_by_id(self, record_id: Any, id_column: str = "id") -> bool:
        response = (
            self.client
            .table(self.table_name)
            .delete()
            .eq(id_column, record_id)
            .execute()
        )

        return bool(response.data)

    def delete_where(self, column: str, value: Any) -> bool:
        response = (
            self.client
            .table(self.table_name)
            .delete()
            .eq(column, value)
            .execute()
        )

        return bool(response.data)


admins_db = Database("admins")
app_config_db = Database("app_config")
brands_db = Database("brands")
products_db = Database("products")
product_images_db = Database("product_images")
product_reviews_db = Database("product_reviews")
payments_db = Database("payments")
orders_db = Database("orders")
order_items_db = Database("order_items")