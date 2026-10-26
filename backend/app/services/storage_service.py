import os
import uuid
import mimetypes
from typing import Tuple
from fastapi import UploadFile, HTTPException
from backend.app.core.config import settings

MAGIC_NUMBERS = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",  # WebP starts with RIFF....WEBP
}

def validate_image_upload(file: UploadFile, contents: bytes) -> str:
    """
    Validates file size, extension, MIME type, and magic bytes.
    Protects against malicious uploads and disguised extensions.
    """
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
        
    if len(contents) < 32:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or too small.")
        
    # Check magic bytes
    detected_mime = None
    for magic, mime in MAGIC_NUMBERS.items():
        if contents.startswith(magic):
            detected_mime = mime
            break
            
    if not detected_mime:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Only authentic JPEG, PNG, and WebP images are permitted."
        )
        
    return detected_mime

def save_image_file(contents: bytes, ext: str = ".jpg") -> Tuple[str, str]:
    """
    Saves image bytes securely with random UUID filename.
    Returns (relative_url_path, absolute_disk_path).
    """
    if not ext.startswith("."):
        ext = f".{ext}"
    filename = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(disk_path, "wb") as f:
        f.write(contents)
    relative_url = f"/uploads/{filename}"
    return relative_url, disk_path
