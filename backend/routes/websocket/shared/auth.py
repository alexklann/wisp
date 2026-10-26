import json
from fastapi import status, WebSocket
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from models import (
    Channel,
    ServerMember,
)
from core.jwt import verify_jwt


async def user_is_member(user_id: str, channel_id: str, session: AsyncSession) -> bool:
    statement = select(Channel).where(Channel.id == channel_id)
    result = await session.exec(statement)
    channel = result.first()

    if channel is None:
        return False

    statement = select(ServerMember).where(
        ServerMember.user_id == user_id,
        ServerMember.server_id == channel.server_id,
    )
    result = await session.exec(statement)
    if result.first() is None:
        return False

    return True


async def validate_jwt_token(token: str, websocket: WebSocket) -> str | None:
    try:
        token_result = verify_jwt(token)
        if token_result is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError()
        return token_result["user_id"]
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
