from fastapi import Depends, Query, WebSocket
from pydantic import TypeAdapter, ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from core.client_event import (
    ClientEvent,
    JoinChannel,
    Ping,
    SendMessage,
    TypingStart,
)
from core.connection_manager import ConnectionManager, get_connection_manager
from database import get_session

from .events import *
from .shared import ConnectionContext, validate_jwt_token, user_is_member

event_adapter = TypeAdapter(ClientEvent)

PROTECTED_HANDLERS = {
    SendMessage: send_message.process,
    JoinChannel: join_channel.process,
    TypingStart: typing_start.process,
}


async def websocket_request_handler(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    token: str = Query(...),
):
    user_id = await validate_jwt_token(token, websocket)
    if user_id is None:
        return

    await websocket.accept()

    connection_manager.connect_user(user_id, websocket)

    ctx = ConnectionContext(
        websocket=websocket,
        user_id=user_id,
        manager=connection_manager,
        session=session,
    )

    try:
        async for text in websocket.iter_text():
            try:
                event = event_adapter.validate_json(text)

                await handle_event(event, ctx)
            except ValidationError:
                continue
    finally:
        connection_manager.disconnect_user(user_id, websocket)
        if ctx.current_channel:
            connection_manager.leave_channel(websocket, ctx.current_channel)


async def handle_event(event: ClientEvent, ctx: ConnectionContext) -> None:
    # Unprotected Routes
    match event:
        case Ping():
            await ping.process(event, ctx)
            return

    # Protected Routes
    if not await user_is_member(ctx.user_id, event.channel_id, ctx.session):
        return
    await PROTECTED_HANDLERS[type(event)](event, ctx)
