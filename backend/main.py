import os
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.responses import FileResponse

from database import get_session
from models import Attachment
from routes import auth, channel, server, upload, ws

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["Auth Endpoints"])
app.include_router(channel.router, prefix="/channels", tags=["Channel Endpoints"])
app.include_router(server.router, prefix="/servers", tags=["Server Endpoints"])
app.include_router(upload.router, prefix="/upload", tags=["Upload Endpoints"])
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
