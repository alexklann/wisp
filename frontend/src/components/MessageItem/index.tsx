import type Message from "../../types/message";
import MessageActions from "./components/MessageActions";
import MessageHeader from "./components/MessageHeader";
import MessageReply from "./components/MessageReply";
import MessageAttachments from "./components/MessageAttachments";
import MessageContent from "./components/MessageContent";
import { twMerge } from "tailwind-merge";

interface Props {
  message: Message;
  isConsecutive: boolean;
  showActions?: boolean;
}

export default function MessageItem({
  message,
  isConsecutive,
  showActions = true,
}: Props) {
  return (
    <div
      className={twMerge(
        "group relative flex flex-col border-2 border-transparent hover:rounded-lg hover:border-brand-pink hover:bg-surface",
        isConsecutive ? "py-0" : "py-0.5",
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${message.color} 10%, transparent)`,
      }}
    >
      {showActions && <MessageActions message={message} />}
      <MessageHeader
        avatarUrl={message.sender_avatar_url}
        displayName={message.sender_display_name}
        createdAt={message.created_at}
        editedAt={message.edited_at}
        isConsecutive={isConsecutive}
      />
      <div className="flex flex-col ml-12">
        <MessageReply messagePreview={message.replied_message} />
        <MessageContent
          messageId={message.id}
          messageContent={message.content}
        />
        <MessageAttachments messageAttachments={message.attachments} />
      </div>
    </div>
  );
}
