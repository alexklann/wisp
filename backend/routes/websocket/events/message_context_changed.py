import json

from core.client_event import MessageContextChanged

from ..shared import ConnectionContext


async def process(event: MessageContextChanged, ctx: ConnectionContext) -> None:
    await ctx.websocket.send_text(
        json.dumps({"type": "message_context_changed", "message_id": event.message_id, "message_context": event.message_context})
    )
