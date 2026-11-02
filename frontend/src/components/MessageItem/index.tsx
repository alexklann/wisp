import type Message from "../../types/message";
import MessageActions from "./components/MessageActions";
import MessageHeader from "./components/MessageHeader";
import MessageReply from "./components/MessageReply";
import MessageAttachments from "./components/MessageAttachments";
import MessageContent from "./components/MessageContent";
import { twMerge } from "tailwind-merge";
import { useLongPress } from "../../hooks/useLongPress";
import { useUIStore } from "../../stores/useUIStore";

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
  const longPress = useLongPress(() => {
    navigator.vibrate?.(10);
    setMessageActionSheetSelectedMessageId(message.id);
  });

  const messageActionSheetSelectedMessageId = useUIStore(
    (state) => state.messageActionSheetSelectedMessageId,
  );
  const setMessageActionSheetSelectedMessageId = useUIStore(
    (state) => state.setMessageActionSheetSelectedMessageId,
  );

  return (
    <div
      {...(showActions ? longPress : {})}
      className={twMerge(
        "group relative flex flex-col border-2 border-transparent hover:rounded-lg hover:border-brand-pink hover:bg-surface",
        isConsecutive ? "py-0" : "py-0.5",
        messageActionSheetSelectedMessageId === message.id ? "bg-surface" : "",
      )}
    >
      {showActions && <MessageActions message={message} />}
      <MessageHeader
        avatarUrl={message.sender_avatar_url}
        displayName={message.sender_display_name}
        createdAt={message.created_at}
        editedAt={message.edited_at}
        isConsecutive={isConsecutive}
        context={message.context ?? 0}
      />
      <div className="flex flex-col ml-12">
        <MessageReply messagePreview={message.replied_message} />
        <MessageContent
          messageId={message.id}
          messageContent={message.content}
          messageContext={message.context}
        />
        <MessageAttachments messageAttachments={message.attachments} messageContext={message.context ?? 0}/>
        {message.context !== 0 && message.context !== null  && (
          <span className="absolute bottom-0 right-0 px-2 py-1 text-text/20 text-xs">{message.context ?? 0}</span>
        )}
      </div>
    </div>
  );
}
