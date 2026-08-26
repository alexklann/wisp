import json
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from pydantic import TypeAdapter
from sqlalchemy.orm import aliased
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.app_state import AppState
from core.client_event import (
    ClientEvent,
    JoinChannel,
    Ping,
    SendMessage,
    TypingStart,
)
from core.connection_manager import ConnectionManager, get_connection_manager
from core.jwt import verify_jwt
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

from routes.push import send_push_notification

router = APIRouter()

event_adapter = TypeAdapter(ClientEvent)


async def process_send_message(
    event: SendMessage,
    user_id: str,
    manager: ConnectionManager,
    session: AsyncSession,
) -> None:
    new_message = Message(
        channel_id=event.channel_id,
        sender_id=user_id,
        content=event.content,
        message_type="text",
        reply_to_id=event.reply_to_id,
    )
    session.add(new_message)
    await session.commit()

    linked_attachments = []

    if event.attachment_ids:
        att_stmt = select(Attachment).where(
            col(Attachment.id).in_(event.attachment_ids),
            col(Attachment.uploader_id) == user_id,
            col(Attachment.message_id).is_(None),
        )
        att_results = await session.exec(att_stmt)
        linked_attachments = att_results.all()

        for attachment in linked_attachments:
            attachment.message_id = new_message.id
            session.add(attachment)
        await session.commit()

    RepliedMessage = aliased(Message)
    RepliedUser = aliased(User)

    statement = (
        select(Message, User, RepliedMessage, RepliedUser)
        .join(User, col(Message.sender_id) == User.id)
        .outerjoin(RepliedMessage, col(Message.reply_to_id) == RepliedMessage.id)
        .outerjoin(RepliedUser, col(RepliedMessage.sender_id) == RepliedUser.id)
        .where(Message.id == new_message.id)
    )
    result = await session.exec(statement)
    db_message, db_user, replied_msg, replied_user = result.one()

    statement = select(Channel).where(Channel.id == db_message.channel_id)
    result = await session.exec(statement)
    db_channel = result.one()

    reply_data = None
    if replied_msg and replied_user and replied_msg.id is not None:
        reply_data = RepliedMessagePreview(
            id=replied_msg.id,
            content=replied_msg.content,
            sender_username=replied_user.username,
        )

    response = ChatMessageResponse(
        **db_message.model_dump(),
        sender_username=db_user.username,
        sender_display_name=db_user.display_name,
        sender_avatar_url=db_user.avatar_url,
        attachments=[AttachmentResponse(**a.model_dump()) for a in linked_attachments],
        replied_message=reply_data,
    )

    await manager.broadcast(
        event.channel_id, {"type": "message", **response.model_dump(mode="json")}
    )

    success = await send_push_notification(
        server_id=db_channel.server_id,
        title=db_user.display_name,
        body=event.content,
        session=session,
        sender_id=user_id
    )

    if not success:
        print("Error sending push notification")


async def process_join_channel(
    event: JoinChannel,
    websocket: WebSocket,
    user_id: str,
    manager: ConnectionManager,
    active_channel_id: list[Optional[str]],
    session: AsyncSession,
) -> None:
    statement = select(Channel).where(Channel.id == event.channel_id)
    result = await session.exec(statement)
    channel = result.first()

    if channel is None:
        return

    statement = select(ServerMember).where(
        ServerMember.user_id == user_id,
        ServerMember.server_id == channel.server_id,
    )
    result = await session.exec(statement)
    if result.first() is None:
        return

    # Handle channel switching
    if active_channel_id[0]:
        manager.leave_channel(websocket, active_channel_id[0])

    active_channel_id[0] = event.channel_id
    manager.join_channel(websocket, event.channel_id)

    await websocket.send_text(
        json.dumps({"type": "joined_channel", "channel_id": event.channel_id})
    )


async def process_typing_start(
    event: TypingStart,
    user_id: str,
    manager: ConnectionManager,
    session: AsyncSession,
) -> None:
    statement = select(User).where(User.id == user_id)
    result = await session.exec(statement)
    user = result.first()

    if user is None:
        return

    await manager.broadcast(
        event.channel_id,
        {
            "type": "typingStart",
            "channel_id": event.channel_id,
            "user_id": user.id,
            "display_name": user.display_name,
        },
    )


async def handle_event(
    event: ClientEvent,
    websocket: WebSocket,
    user_id: str,
    connection_manager: ConnectionManager,
    active_channel_id: list[Optional[str]],
    session: AsyncSession,
) -> None:
    print(f"Receiving: {event} from {user_id} on {active_channel_id}")
    match event:
        case Ping():
            await websocket.send_text("Pong")

        case SendMessage() as msg:
            await process_send_message(msg, user_id, connection_manager, session)

        case JoinChannel() as join_cmd:
            await process_join_channel(
                join_cmd,
                websocket,
                user_id,
                connection_manager,
                active_channel_id,
                session,
            )

        case TypingStart() as typing_cmd:
            await process_typing_start(typing_cmd, user_id, connection_manager, session)


@lru_cache
def get_app_state() -> AppState:
    return AppState()


@router.websocket("/ws")
async def ws_handler(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    token: str = Query(...),
):
    try:
        token_result = verify_jwt(token)
        if token_result is None:
            await websocket.send_text(json.dumps({"error": "Invalid or missing token"}))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = token_result["user_id"]
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    connection_manager.connect_user(user_id, websocket)
    current_channel: list[Optional[str]] = [None]

    print(f"User connected: {user_id}")

    try:
        async for text in websocket.iter_text():
            try:
                event = event_adapter.validate_json(text)
                await handle_event(
                    event,
                    websocket,
                    user_id,
                    connection_manager,
                    current_channel,
                    session,
                )
            except json.JSONDecodeError:
                continue
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.disconnect_user(user_id, websocket)
        if current_channel[0]:
            connection_manager.leave_channel(websocket, current_channel[0])
            print(f"User disconnected: {user_id}")
