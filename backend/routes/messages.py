from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.connection_manager import ConnectionManager, get_connection_manager
from database import get_session
from models import Channel, Message, ServerMember
from routes.auth import get_current_user_id

router = APIRouter()


@router.delete("/{message_id}/")
async def delete_message(
    message_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
    manager: ConnectionManager = Depends(get_connection_manager),
):
    statement = (
        select(Message)
        .join(Channel, col(Message.channel_id) == Channel.id)
        .join(ServerMember, col(ServerMember.server_id) == Channel.server_id)
        .where(Message.sender_id == user_id)
        .where(Message.id == message_id)
        .where(ServerMember.user_id == user_id)
    )
    result = await session.exec(statement)
    message = result.first()

    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message does not exist or user does not own message",
        )

    channel_id = message.channel_id
    await session.delete(message)
    await session.commit()

    await manager.broadcast(
        channel_id,
        {"type": "message_deleted", "message_id": message_id, "channel_id": channel_id},
    )

    return channel_id
