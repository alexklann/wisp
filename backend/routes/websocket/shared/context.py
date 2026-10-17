from dataclasses import dataclass
from typing import Optional
from fastapi import WebSocket
from sqlmodel.ext.asyncio.session import AsyncSession
from core.connection_manager import ConnectionManager


@dataclass
class ConnectionContext:
    websocket: WebSocket
    user_id: str
    manager: ConnectionManager
    session: AsyncSession
    current_channel: Optional[str] = None
