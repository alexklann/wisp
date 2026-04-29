from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from models import Message
from routes.auth import get_current_user_id

router = APIRouter()


class RegisterResponseBody(BaseModel):
    id: str
    username: str
    display_name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    token: str


@router.delete("/{message_id}/")
async def delete_message(
    message_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(Message)
        .where(Message.sender_id == user_id)
        .where(Message.id == message_id)
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

    return channel_id
