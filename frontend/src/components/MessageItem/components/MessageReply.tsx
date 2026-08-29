import type { RepliedMessagePreview } from "../../../types/message";

export default function MessageReply({
  messagePreview,
}: {
  messagePreview: RepliedMessagePreview | undefined;
}) {
  if (!messagePreview) return <></>;

  return (
    <div
      title={`${messagePreview.sender_username}: ${messagePreview.content}`}
      className="flex flex-row gap-1 items-center py-1 text-white/50"
    >
      <span className="text-xs">Reply to:</span>
      <span className="text-xs font-bold">
        {messagePreview.sender_username}:
      </span>
      <span className="w-[75%] truncate text-xs">
        {messagePreview.content && messagePreview.content.trim().length > 0 ? (
          messagePreview.content
        ) : messagePreview.has_attachment ? (
          "[Attachment]"
        ) : "Message not found"}
      </span>
    </div>
  );
}
