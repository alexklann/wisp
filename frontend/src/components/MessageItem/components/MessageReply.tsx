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
      className="flex flex-row gap-1 items-center py-1 text-white/70"
    >
      <span className="text-sm">Reply to:</span>
      <span className="text-sm font-bold">
        {messagePreview.sender_username}:
      </span>
      <span className="w-[75%] truncate text-sm">
        {messagePreview.content && messagePreview.content.trim().length > 0
          ? messagePreview.content
          : messagePreview.has_attachment
            ? "[Attachment]"
            : "Message not found"}
      </span>
    </div>
  );
}
