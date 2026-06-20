"""
Storage utility: upload images to Supabase Storage (bucket: Finstroage, folder: amen) when
SUPABASE_URL + SUPABASE_KEY are configured, otherwise save to local
/uploads/ folder and return a relative URL.
"""

import os
import uuid
import base64
from pathlib import Path
from loguru import logger

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
BUCKET = "Finstroage"
FOLDER = "amen"

LOCAL_UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _supabase_available() -> bool:
    return bool(SUPABASE_URL and SUPABASE_KEY)


def _get_supabase_client():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def _ensure_bucket(client) -> bool:
    """Create bucket if it does not exist. Returns True on success."""
    try:
        buckets = client.storage.list_buckets()
        names = [b.name for b in buckets]
        if BUCKET not in names:
            client.storage.create_bucket(BUCKET, options={"public": True})
            logger.info(f"Created Supabase Storage bucket: {BUCKET}")
        return True
    except Exception as exc:
        logger.warning(f"Supabase bucket check failed: {exc}")
        return False


def upload_image(content: bytes, mime: str = "image/jpeg", filename: str | None = None) -> str:
    """
    Upload raw image bytes. Returns a public URL string.

    Priority:
      1. Supabase Storage bucket 'Finstroage', folder 'amen'  (if SUPABASE_URL + SUPABASE_KEY set)
      2. Local /uploads/ folder                               (fallback)
    """
    ext = _ext_from_mime(mime)
    fname = filename or f"{uuid.uuid4().hex}{ext}"

    if _supabase_available():
        try:
            client = _get_supabase_client()
            if _ensure_bucket(client):
                path = f"{FOLDER}/{fname}"
                client.storage.from_(BUCKET).upload(
                    path=path,
                    file=content,
                    file_options={"content-type": mime, "upsert": "true"},
                )
                public_url = client.storage.from_(BUCKET).get_public_url(path)
                logger.info(f"Uploaded to Supabase Storage: {public_url}")
                return public_url
        except Exception as exc:
            logger.warning(f"Supabase upload failed, falling back to local: {exc}")

    return _save_local(content, fname)


def upload_image_from_base64(data_url_or_b64: str, mime: str = "image/jpeg", filename: str | None = None) -> str:
    """
    Accept either a data-URL (data:image/...;base64,...) or a raw base64 string.
    Returns a public/relative URL.
    """
    if data_url_or_b64.startswith("data:"):
        header, b64part = data_url_or_b64.split(",", 1)
        detected_mime = header.split(":")[1].split(";")[0]
        mime = detected_mime or mime
        raw = base64.b64decode(b64part)
    else:
        raw = base64.b64decode(data_url_or_b64)

    return upload_image(raw, mime=mime, filename=filename)


def _save_local(content: bytes, fname: str) -> str:
    dest = LOCAL_UPLOADS_DIR / fname
    dest.write_bytes(content)
    logger.info(f"Saved image locally: {dest}")
    return f"/uploads/{fname}"


def _ext_from_mime(mime: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
    }
    return mapping.get(mime.lower(), ".jpg")
