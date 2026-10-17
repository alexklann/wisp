from fastapi import APIRouter, Depends, Query, WebSocket
from sqlmodel.ext.asyncio.session import AsyncSession
from core.connection_manager import ConnectionManager, get_connection_manager
from database import get_session

from .handler import websocket_request_handler

router = APIRouter()


@router.websocket("/ws")
async def ws_handler(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    token: str = Query(...),
):
    await websocket_request_handler(websocket, session, connection_manager, token)
