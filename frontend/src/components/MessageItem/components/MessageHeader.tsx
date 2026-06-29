import type Message from "../../../types/message";
import MessageAvatar from "./MessageAvatar";

interface Props {
  message: Message;
  isConsecutive: boolean;
}

export default function MessageHeader({ message, isConsecutive }: Props) {
  if (isConsecutive) return;

  return (
    <div className="flex flex-col mb-2">
      <div className="flex flex-row items-center gap-2">
        <MessageAvatar message={message} />
        <span className="font-bold">{message.sender_display_name}</span>
        <div className="flex flex-row gap-1">
          <span className="text-xs">
            {new Date(message.created_at).toLocaleString()}
          </span>
          {message.edited_at !== null && (
            <span
              title={new Date(message.edited_at).toLocaleString()}
              className="text-xs text-text/50"
            >
              (edited)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
