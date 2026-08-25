import os
from pathlib import Path

import psutil
from annotated_types import Interval
from fastapi import Depends, FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.responses import FileResponse

from database import get_session
from models import Attachment
from routes import auth, channel, messages, push, server, upload, ws

import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

from contextlib import asynccontextmanager

def setup_vapid_keys():
    private_pem_filename = "vapid_private.pem"
    public_pem_filename = "vapid_public.pem"
    env_filename = ".env"

    if os.path.exists(private_pem_filename) or os.path.exists(public_pem_filename):
        print("Vapid keys already exist, skipping...")
        return

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    with open(private_pem_filename, "wb") as f:
        f.write(private_pem)

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    with open(public_pem_filename, "wb") as f:
        f.write(public_pem)

    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    vapid_public_key = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')

    with open(env_filename, "a") as f:
        f.write("\n\n# Auto-generated VAPID Keys for Web Push\n")
        f.write(f"VAPID_PUBLIC_KEY={vapid_public_key}\n")
        f.write('VAPID_CLAIM_SUB="mail@example.com"\n')

    print("Successfully generated vapid keys\n")
    print("Edit VAPID_CLAIM_SUB in .env file and restart") # TODO: Move VAPID_CLAIM_SUB into docker variables

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_vapid_keys()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router, prefix="/auth", tags=["Auth Endpoints"])
app.include_router(channel.router, prefix="/channels", tags=["Channel Endpoints"])
app.include_router(server.router, prefix="/servers", tags=["Server Endpoints"])
app.include_router(upload.router, prefix="/upload", tags=["Upload Endpoints"])
app.include_router(messages.router, prefix="/messages", tags=["Messages Endpoint"])
app.include_router(push.router, prefix="/push", tags=["Push API Endpoint"])
app.include_router(ws.router)

raw_origins = os.getenv("FRONTEND_CORS_ORIGINS", "")
origins = [o.strip().strip('"').strip("'") for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_static_app = StaticFiles(directory="uploads")

cors_wrapped_uploads = CORSMiddleware(
    app=upload_static_app,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.mount("/uploads", cors_wrapped_uploads, name="uploads")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
def get_health():
    return "Healthy"


@app.get("/usage")
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


@app.get("/download/{attachment_id}")
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
