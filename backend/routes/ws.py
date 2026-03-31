import asyncio
import json
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from pydantic import TypeAdapter
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.app_state import AppState
from core.client_event import ClientEvent, JoinChannel, Ping, SendMessage, TypingStart
from core.jwt import verify_jwt
from database import get_session
from models import Channel, ChatMessageResponse, Message, ServerMember, User

router = APIRouter()

adapter = TypeAdapter(ClientEvent)


async def handle_event(
    event: ClientEvent,
    websocket: WebSocket,
    user_id: str,
    state: AppState,
    current_channel: list[Optional[str]],
    session: AsyncSession,
) -> None:
    match event:
        case Ping():
            await websocket.send_text("Pong")
        case SendMessage(channel_id=channel_id, content=content):
            new_message = Message(
                channel_id=channel_id,
                sender_id=user_id,
                content=content,
                message_type="text",
            )
            session.add(new_message)
            await session.commit()
            await session.refresh(new_message)

            statement = (
                select(Message, User)
                .where(Message.id == new_message.id)
                .join(User, col(Message.sender_id) == User.id)
            )
            result = await session.exec(statement)
            full_message = result.first()

            if full_message is None:
                print(f"Message {new_message.id} was not found after initialization")
                return

            msg, user = full_message
            response = ChatMessageResponse(
                **msg.model_dump(),
                sender_username=user.username,
                sender_display_name=user.display_name,
                sender_avatar_url=user.avatar_url,
            )

            await state.broadcast(
                {"type": "message", **response.model_dump(mode="json")}
            )
        case JoinChannel(channel_id=channel_id):
            statement = select(Channel).where(Channel.id == channel_id)
            result = await session.exec(statement)
            channel = result.first()

            if channel is None:
                print(f"Channel {channel_id} not found")
                return

            statement = select(ServerMember).where(
                ServerMember.user_id == user_id,
                ServerMember.server_id == channel.server_id,
            )
            result = await session.exec(statement)
            membership = result.first()

            if membership is None:
                print(f"User {user_id} is not a member of server {channel.server_id}")
                return

            print(f"User {user_id} joining channel {channel_id}")
            current_channel[0] = channel_id
            await websocket.send_text(
                json.dumps({"type": "joined_channel", "channel_id": channel_id})
            )
        case TypingStart(channel_id=channel_id):
            statement = select(User).where(User.id == user_id)
            result = await session.exec(statement)
            user = result.first()

            if user is None:
                print(f"User {user_id} not found")
                return

            await state.broadcast(
                {
                    "type": "typing_start",
                    "channel_id": channel_id,
                    "user_id": user.id,
                    "display_name": user.display_name,
                }
            )


@lru_cache
def get_app_state() -> AppState:
    return AppState()


@router.websocket("/ws")
async def ws_handler(
    websocket: WebSocket,
    app_state: AppState = Depends(get_app_state),
    session: AsyncSession = Depends(get_session),
    token: str = Query(...),
):
    try:
        token_result = verify_jwt(token)
        if token_result is None:
            return
        user_id = token_result["user_id"]
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    print(f"User connected: {user_id}")

    app_state.user_set.add(user_id)
    current_channel: list[Optional[str]] = [None]

    queue: asyncio.Queue = asyncio.Queue()
    app_state.subscribe(queue)

    async def receive_loop():
        async for text in websocket.iter_text():
            try:
                event = adapter.validate_json(text)
            except json.JSONDecodeError as e:
                print(f"Invalid JSON: {e}")
                continue
            await handle_event(
                event, websocket, user_id, app_state, current_channel, session
            )

    async def broadcast_loop():
        while True:
            event = await queue.get()
            kind = event.get("type")

            if kind == "message":
                if event.get("channel_id") == current_channel[0]:
                    await websocket.send_text(json.dumps(event))

            elif kind == "typing_start":
                if event.get("channel_id") == current_channel[0]:
                    await websocket.send_text(json.dumps(event))

    try:
        await asyncio.gather(receive_loop(), broadcast_loop())
    except WebSocketDisconnect:
        pass
    finally:
        app_state.user_set.discard(user_id)
        app_state.unsubscribe(queue)
        print(f"User disconnected: {user_id}")
