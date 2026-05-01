# img.py
import re
from urllib.parse import urlparse


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def _allowed_url(url: str) -> bool:
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        return False

    if not parsed.netloc:
        return False

    path = parsed.path or ""

    if "." not in path:
        return True

    ext = path.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def _guess_filename(url: str) -> str:
    path = urlparse(url).path or ""
    name = path.rstrip("/").split("/")[-1]

    if not name:
        return "image-url"

    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name).strip("_")
    return name or "image-url"


def save(file=None, folder: str = "product", url: str = ""):
    """
    Render note:
    Local uploaded files are not reliable/permanent on Render.
    Use hosted image URLs instead.

    This function stays because app.py currently imports img.save().
    Later, app.py can pass request.form.get("url") here.
    """

    folder = str(folder or "product").strip().lower()

    if folder not in ("product", "brand"):
        return {
            "ok": False,
            "message": "Invalid folder. Use 'product' or 'brand'.",
        }

    image_url = str(url or "").strip()

    if image_url:
        if not _allowed_url(image_url):
            return {
                "ok": False,
                "message": "Invalid image URL. Use a valid http/https image URL.",
            }

        return {
            "ok": True,
            "message": "Image URL accepted.",
            "filename": _guess_filename(image_url),
            "folder": folder,
            "path": image_url,
            "url": image_url,
        }

    return {
        "ok": False,
        "message": (
            "Local image upload is disabled for Render deployment. "
            "Upload the image to Cloudinary, Supabase Storage, or another host, "
            "then send the image URL."
        ),
    }