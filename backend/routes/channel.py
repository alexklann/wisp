from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from database import get_session
from models import (
    Attachment,
    AttachmentResponse,
    Channel,
    ChatMessageResponse,
    Message,
    ServerMember,
    User,
)
from routes.auth import get_current_user_id

router = APIRouter()


@router.get("/{channel_id}/messages/")
async def get_messages(
    channel_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = select(Channel).where(Channel.id == channel_id)
    result = await session.exec(statement)
    channel = result.first()

    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel does not exist",
        )

    statement = (
        select(ServerMember)
        .where(ServerMember.server_id == channel.server_id)
        .where(ServerMember.user_id == user_id)
    )
    result = await session.exec(statement)
    server_member = result.first()

    if server_member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not member of this server",
        )

    statement = (
        select(Message, User)
        .join(User, col(Message.sender_id) == User.id)
        .where(Message.channel_id == channel_id)
    )

    result = await session.exec(statement)

    messages_with_users = []
    for db_message, db_user in result:
        if (
            db_message.id is None
            or db_message.sender_id is None
            or db_message.created_at is None
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Messages don't exist",
            )

        messages_with_users.append(
            ChatMessageResponse(
                id=db_message.id,
                channel_id=db_message.channel_id,
                sender_id=db_message.sender_id,
                sender_username=db_user.username,
                sender_display_name=db_user.display_name,
                sender_avatar_url=db_user.avatar_url,
                content=db_message.content,
                message_type=db_message.message_type,
                edited_at=db_message.edited_at,
                reply_to_id=db_message.reply_to_id,
                is_deleted=bool(db_message.is_deleted),
                created_at=db_message.created_at,
                attachments=[],
            )
        )

    if messages_with_users:
        message_ids = [m.id for m in messages_with_users]
        statement = select(Attachment).where(
            col(Attachment.message_id).in_(message_ids)
        )
        result = await session.exec(statement)

        attachments_map: dict[int, list[Attachment]] = {}
        for attachment in result:
            if not attachment.message_id:
                continue
            attachments_map.setdefault(attachment.message_id, []).append(attachment)

        for msg in messages_with_users:
            attachments = attachments_map.get(msg.id, [])
            msg.attachments = [
                AttachmentResponse(
                    id=a.id,
                    url=a.url,
                    file_type=a.file_type,
                    file_size=a.file_size,
                    file_name=a.file_name,
                    created_at=a.created_at,
                )
                for a in attachments
            ]

    return messages_with_users
