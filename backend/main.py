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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
def get_health():
    return "Healthy"
