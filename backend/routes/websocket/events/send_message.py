from sqlalchemy.orm import aliased
from sqlmodel import col, select
from dataclasses import dataclass
from collections.abc import Sequence

from core.client_event import SendMessage
from models import (
    Attachment,
    AttachmentResponse,
    Channel,
    ChatMessageResponse,
    Message,
    RepliedMessagePreview,
    User,
)

from ..shared import ConnectionContext

from routes.push import send_push_notification


async def _create_new_message(event: SendMessage, ctx: ConnectionContext) -> Message:
    new_message = Message(
        channel_id=event.channel_id,
        sender_id=ctx.user_id,
        content=event.content,
        message_type="text",
        reply_to_id=event.reply_to_id,
    )
    ctx.session.add(new_message)
    await ctx.session.commit()

    return new_message


async def _link_attachments(
    event: SendMessage, ctx: ConnectionContext, message: Message
) -> Sequence[Attachment]:
    linked_attachments: Sequence[Attachment] = []

    if event.attachment_ids:
        att_stmt = select(Attachment).where(
            col(Attachment.id).in_(event.attachment_ids),
            col(Attachment.uploader_id) == ctx.user_id,
            col(Attachment.message_id).is_(None),
        )
        att_results = await ctx.session.exec(att_stmt)
        linked_attachments = att_results.all()

        for attachment in linked_attachments:
            attachment.message_id = message.id
            ctx.session.add(attachment)
        await ctx.session.commit()

    return linked_attachments


@dataclass
class MessageContext:
    sender: User
    channel: Channel
    replied_message: Message | None
    replied_user: User | None


async def _load_message_context(
    message: Message, ctx: ConnectionContext
) -> MessageContext:
    replied = aliased(Message)
    replied_sender = aliased(User)

    statement = (
        select(User, Channel, replied, replied_sender)
        .select_from(Message)
        .join(User, col(Message.sender_id) == User.id)
        .join(Channel, col(Message.channel_id) == Channel.id)
        .outerjoin(replied, col(Message.reply_to_id) == replied.id)
        .outerjoin(replied_sender, col(replied.sender_id) == replied_sender.id)
        .where(Message.id == message.id)
    )
    sender, channel, replied_message, replied_user = (
        await ctx.session.exec(statement)
    ).one()

    return MessageContext(
        sender=sender,
        channel=channel,
        replied_message=replied_message,
        replied_user=replied_user,
    )


async def _build_reply_preview(
    message_ctx: MessageContext, ctx: ConnectionContext
) -> RepliedMessagePreview | None:
    if (
        message_ctx.replied_message is None
        or message_ctx.replied_user is None
        or message_ctx.replied_message.id is None
    ):
        return None

    has_reply_attachment = bool(
        (
            await ctx.session.exec(
                select(Attachment.id)
                .where(col(Attachment.message_id) == message_ctx.replied_message.id)
                .limit(1)
            )
        ).first()
    )

    return RepliedMessagePreview(
        id=message_ctx.replied_message.id,
        content=message_ctx.replied_message.content,
        sender_username=message_ctx.replied_user.username,
        has_attachment=has_reply_attachment,
    )


def _build_response(
    message: Message,
    message_ctx: MessageContext,
    attachments: Sequence[Attachment],
    reply: RepliedMessagePreview | None,
) -> ChatMessageResponse:
    return ChatMessageResponse(
        **message.model_dump(),
        sender_username=message_ctx.sender.username,
        sender_display_name=message_ctx.sender.display_name,
        sender_avatar_url=message_ctx.sender.avatar_url,
        attachments=[AttachmentResponse(**a.model_dump()) for a in attachments],
        replied_message=reply,
    )


async def _publish(
    event: SendMessage,
    response: ChatMessageResponse,
    message_ctx: MessageContext,
    attachments: Sequence[Attachment],
    ctx: ConnectionContext,
):
    await ctx.manager.broadcast(
        message_ctx.channel.id, {"type": "message", **response.model_dump(mode="json")}
    )

    push_body = event.content.strip() if event.content and event.content.strip() else ""
    if not push_body and attachments:
        push_body = "Sent an attachment"
    elif not push_body:
        push_body = "Sent a message"

    success = await send_push_notification(
        server_id=message_ctx.channel.server_id,
        title=message_ctx.sender.display_name,
        body=push_body,
        session=ctx.session,
        sender_id=ctx.user_id,
    )

    if not success:
        print("Error sending push notification")


async def process(event: SendMessage, ctx: ConnectionContext) -> None:
    message = await _create_new_message(event, ctx)
    attachments = await _link_attachments(event, ctx, message)
    message_ctx = await _load_message_context(message, ctx)
    reply = await _build_reply_preview(message_ctx, ctx)

    response = _build_response(message, message_ctx, attachments, reply)
    await _publish(event, response, message_ctx, attachments, ctx)
