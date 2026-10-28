import EditIcon from "../../../icons/EditIcon";
import PinIcon from "../../../icons/PinIcon";
import ReplyIcon from "../../../icons/ReplyIcon";
import TrashIcon from "../../../icons/TrashIcon";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useUIStore } from "../../../stores/useUIStore";
import BaseActionButton from "../../BaseActionButton";
import type Message from "../../../types/message";
import { useState } from "react";
import { useMessageActions } from "../hooks/useMessageActions";

interface Props {
  message: Message;
}

export default function MessageActions({ message }: Props) {
  const user = useAuthStore((state) => state.user);

  const editingMessageId = useUIStore((state) => state.editingMessageId);
  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const { pinMessage, deleteMessage, setReplyingMessage } = useMessageActions();

  const [isMessagePinned, setIsMessagePinned] = useState<boolean>(
    message.is_pinned,
  );

  const onEditMessageButtonClicked = () => {
    if (editingMessageId === message.id) {
      setEditingMessageId(null);
    }
    setEditingMessageId(message.id);
  };

  // Message DOES NOT belong to user
  if (!user || message.sender_id != user.id) {
    return (
      <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
        <BaseActionButton
          title={`${isMessagePinned ? "Unpin Message" : "Pin Message"}`}
          onClick={async () => {
            const messagePinned = await pinMessage(message);
            setIsMessagePinned(messagePinned);
          }}
        >
          <PinIcon className="text-text w-[75%] aspect-square" />
        </BaseActionButton>
        <BaseActionButton
          title="Reply to Message"
          onClick={() => setReplyingMessage(message)}
        >
          <ReplyIcon className="text-text w-[75%] aspect-square" />
        </BaseActionButton>
      </div>
    );
  }

  // Message DOES belong to user
  return (
    <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
      <BaseActionButton
        title={`${isMessagePinned ? "Unpin Message" : "Pin Message"}`}
        onClick={async () => {
          const messagePinned = await pinMessage(message);
          setIsMessagePinned(messagePinned);
        }}
      >
        <PinIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
      <BaseActionButton
        title="Reply to Message"
        onClick={() => setReplyingMessage(message)}
      >
        <ReplyIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
      <BaseActionButton
        title="Edit Message"
        onClick={onEditMessageButtonClicked}
      >
        <EditIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
      <BaseActionButton
        title="Delete Message"
        onClick={async () =>
          await deleteMessage({
            messageId: message.id,
          })
        }
        className="hover:bg-red-400"
      >
        <TrashIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
    </div>
  );
}
