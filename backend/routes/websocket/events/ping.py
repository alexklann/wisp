import json

from core.client_event import Ping

from ..shared import ConnectionContext


async def process(_event: Ping, ctx: ConnectionContext) -> None:
    await ctx.websocket.send_text("Pong")
