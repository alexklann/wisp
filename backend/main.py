import os
from pathlib import Path

import psutil
from fastapi import Depends, FastAPI, APIRouter
from fastapi.exceptions import HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.responses import FileResponse

from routes.websocket import ws
from database import get_session
from models import Attachment
from routes import auth, channel, messages, push, server, upload, user

from contextlib import asynccontextmanager
from core.vapid import ensure_vapid_keys


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_vapid_keys()
    yield


app = FastAPI(lifespan=lifespan)

api = APIRouter(prefix="/api")


@api.get("/health")
def get_health():
    return "Healthy"


@api.get("/usage")
def get_disks():
    partition_list = []

    # Get disks and their usage
    for partition in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            partition_list.append(
                {
                    "device": partition.device,
                    "total": usage.total,
                    "free": usage.free,
                    "used": usage.used,
                    "percent": usage.percent,
                }
            )
        except PermissionError, FileNotFoundError, OSError:
            continue

    # Get cpu usage and per-core usage
    per_core_usage = psutil.cpu_percent(interval=0.5, percpu=True)
    total_cpu_usage = psutil.cpu_percent(interval=None)

    # Get memory usage
    svmem = psutil.virtual_memory()
    swap = psutil.swap_memory()

    return {
        "cpu": {"cores": per_core_usage, "total": total_cpu_usage},
        "memory": {
            "total": svmem.total,
            "free": svmem.available,
            "used": svmem.used,
            "percent": svmem.percent,
        },
        "swap": {"total": swap.total, "used": swap.used, "percent": swap.percent},
        "partitions": partition_list,
    }


@api.get("/download/{attachment_id}")
async def download_attachment(
    attachment_id: str,
    session: AsyncSession = Depends(get_session),
):
    attachment = await session.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(attachment.url.lstrip("/"))
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type,
    )


api.include_router(auth.router, prefix="/auth", tags=["Auth Endpoints"])
api.include_router(channel.router, prefix="/channels", tags=["Channel Endpoints"])
api.include_router(server.router, prefix="/servers", tags=["Server Endpoints"])
api.include_router(upload.router, prefix="/upload", tags=["Upload Endpoints"])
api.include_router(messages.router, prefix="/messages", tags=["Messages Endpoint"])
api.include_router(push.router, prefix="/push", tags=["Push API Endpoint"])
api.include_router(user.router, prefix="/users", tags=["Users Endpoint"])

app.include_router(api)
app.include_router(ws.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

STATIC_DIR = "static"
ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
INDEX_FILE = os.path.join(STATIC_DIR, "index.html")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
else:
    print(
        f"No frontend build found at '{ASSETS_DIR}', skipping static asset mount. "
        "Run `bun run build` in frontend/ to serve the app from the backend."
    )


@app.get("/{path:path}")
async def spa(path: str):
    if not os.path.isfile(INDEX_FILE):
        raise HTTPException(
            status_code=404,
            detail="Frontend build not found. Run `bun run build` in frontend/.",
        )

    candidate = os.path.join(STATIC_DIR, path)
    if path and os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(INDEX_FILE)
