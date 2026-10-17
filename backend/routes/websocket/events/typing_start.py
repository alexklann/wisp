from sqlmodel import select

from core.client_event import TypingStart
from models import User

from ..shared import ConnectionContext


async def process(event: TypingStart, ctx: ConnectionContext) -> None:
    statement = select(User).where(User.id == ctx.user_id)
    result = await ctx.session.exec(statement)
    user = result.first()

    if user is None:
        return

    await ctx.manager.broadcast(
        event.channel_id,
        {
            "type": "typingStart",
            "channel_id": event.channel_id,
            "user_id": user.id,
            "display_name": user.display_name,
        },
    )
