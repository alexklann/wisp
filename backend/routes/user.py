from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import aliased
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel

from database import get_session
from models import (
    Attachment,
    AttachmentResponse,
    Channel,
    ChatMessageResponse,
    Message,
    RepliedMessagePreview,
    ServerMember,
    User,
)
from routes.auth import get_current_user_id

router = APIRouter()

class EditSelfRequestBody(BaseModel):
    username: str | None = None
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None

@router.patch("/me/")
async def edit_self(
    request_body: EditSelfRequestBody,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(User)
        .where(User.id == user_id)
    )
    user = (await session.exec(statement)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_UNAUTHORIZED,
            detail="User not found",
        )

    user.username = request_body.username or user.username
    user.display_name = request_body.display_name or user.display_name
    user.bio = request_body.bio or user.bio
    user.avatar_url = request_body.avatar_url or user.avatar_url

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


