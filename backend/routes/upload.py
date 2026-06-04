import asyncio
import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio.session import AsyncSession

from database import get_session
from models import Attachment
from routes.auth import get_current_user_id

IMAGE_UPLOAD_DIR = Path("uploads/image")
FILE_UPLOAD_DIR = Path("uploads/file")

# Runs once on module import
IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
FILE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_SIZE = 1024 * 1024 * 10  # 10MB
MAX_FILE_SIZE = 1024 * 1024 * 1000  # 1GB

IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
IMAGE_MAGIC_BYTES: dict[str, bytes] = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",  # WebP starts with RIFF; we do deeper check below
}

router = APIRouter()


def _validate_magic_bytes(file_bytes: bytes, content_type: str) -> None:
    # Image type not supported; upload as file instead
    expected_magic_bytes = IMAGE_MAGIC_BYTES.get(content_type)
    if expected_magic_bytes is None:
        return

    # Uploaded file is too small to even be an image
    if len(file_bytes) < len(expected_magic_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too small to be a valid image",
        )

    actual = file_bytes[: len(expected_magic_bytes)]

    # Special case for WebP: RIFF + 4 bytes size + WEBP
    if content_type == "image/webp":
        if actual != b"RIFF" or file_bytes[8:12] != b"WEBP":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File claims to be WebP but magic bytes don't match",
            )
    elif actual != expected_magic_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content does not match declared type ({content_type})",
        )


def _process_and_save_image(
    image_bytes: bytes,
    output_path: Path,
    thumb_path: Path,
) -> tuple[int, int]:
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            # WebP supports "RGB", "RGBA", "L" (grayscale), "P" (palette).
            # Convert palette and CMYK to RGBA for safety.
            if img.mode == "CMYK":
                rgb = img.convert("RGB")
            elif img.mode not in ("RGB", "RGBA", "L", "P"):
                rgb = img.convert("RGBA")
            else:
                rgb = img

            # ── Save full-size WebP ───────────────────────────────────────
            rgb.save(output_path, "webp", quality=85, method=6)
            file_size = output_path.stat().st_size

            # ── Generate thumbnail ────────────────────────────────────────
            thumb = rgb.copy()
            thumb.thumbnail((320, 320))  # Thumbnail size
            thumb.save(thumb_path, "webp", quality=85, method=6)
            thumb_size = thumb_path.stat().st_size

            return file_size, thumb_size

    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process image: {exc}",
        ) from exc


@router.post("/")
async def upload(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    content_type = file.content_type

    if content_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content-Type header is required",
        )

    is_image = content_type in IMAGE_MIME_TYPES

    image_bytes = await file.read()

    if is_image:
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {MAX_IMAGE_SIZE // (1024 * 1024)} MB",
            )

        _validate_magic_bytes(image_bytes, content_type)

        file_id = str(uuid.uuid4())
        filename = f"{file_id}.webp"
        thumb_filename = f"{file_id}_thumb.webp"

        file_path = IMAGE_UPLOAD_DIR / filename
        thumb_path = IMAGE_UPLOAD_DIR / thumb_filename

        file_size, thumb_size = await asyncio.to_thread(
            _process_and_save_image,
            image_bytes,
            file_path,
            thumb_path,
        )

        attachment = Attachment(
            id=file_id,
            message_id=None,
            uploader_id=user_id,
            url=f"/uploads/image/{filename}",
            file_type=content_type,
            file_size=file_size,
        )

        session.add(attachment)
        await session.commit()
        await session.refresh(attachment)

        return {
            "id": attachment.id,
            "url": attachment.url,
            "thumbnail_url": f"/uploads/image/{thumb_filename}",
            "thumbnail_size": thumb_size,
            "file_type": attachment.file_type,
            "file_size": attachment.file_size,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Only images are supported currently.",
        )
