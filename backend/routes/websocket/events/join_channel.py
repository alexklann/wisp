import json

from core.client_event import JoinChannel

from ..shared import ConnectionContext


async def process(event: JoinChannel, ctx: ConnectionContext) -> None:
    # Handle channel switching
    if ctx.current_channel:
        ctx.manager.leave_channel(ctx.websocket, ctx.current_channel)

    ctx.current_channel = event.channel_id
    ctx.manager.join_channel(ctx.websocket, event.channel_id)

    await ctx.websocket.send_text(
        json.dumps({"type": "joined_channel", "channel_id": event.channel_id})
    )
