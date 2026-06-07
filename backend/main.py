import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
