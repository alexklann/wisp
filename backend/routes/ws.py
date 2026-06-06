import json
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from pydantic import TypeAdapter
from sqlmodel import col, select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from core.app_state import AppState
from core.client_event import ClientEvent, JoinChannel, Ping, SendMessage, TypingStart
from core.connection_manager import ConnectionManager, get_connection_manager
from core.jwt import verify_jwt
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
    )
    session.add(new_message)
    await session.commit()
    await session.refresh(new_message)

    if event.attachment_ids:
        statement = (
            update(Attachment)
            .where(col(Attachment.id).in_(event.attachment_ids))
            .where(col(Attachment.uploader_id) == user_id)
            .where(col(Attachment.message_id).is_(None))
            .values(message_id=new_message.id)
        )
        await session.exec(statement)
        await session.commit()

    statement = (
        select(Message, User)
        .where(Message.id == new_message.id)
        .join(User, col(Message.sender_id) == User.id)
    )
    result = await session.exec(statement)
    msg, user = result.one()

    att_stmt = select(Attachment).where(col(Attachment.message_id) == msg.id)
    att_results = await session.exec(att_stmt)
    linked_attachments = att_results.all()

    response = ChatMessageResponse(
        **msg.model_dump(),
        sender_username=user.username,
        sender_display_name=user.display_name,
        sender_avatar_url=user.avatar_url,
        attachments=[AttachmentResponse(**a.model_dump()) for a in linked_attachments],
    )

    await manager.broadcast(
        event.channel_id, {"type": "message", **response.model_dump(mode="json")}
    )


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
    current_channel: list[Optional[str]] = [None]

    print(f"User connected: {user_id}")

    try:
        async for text in websocket.iter_text():
            try:
                event = event_adapter.validate_json(text)
                print(event)
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
        if current_channel[0]:
            connection_manager.leave_channel(websocket, current_channel[0])
            print(f"User disconnected: {user_id}")
