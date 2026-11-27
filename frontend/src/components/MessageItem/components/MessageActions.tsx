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

  const setCurrentMessageContext = useUIStore(
    (state) => state.setCurrentMessageContext,
  );

  const { pinMessage, deleteMessage, setReplyingMessage, setMessageContext } =
    useMessageActions();

  const [isMessagePinned, setIsMessagePinned] = useState<boolean>(
    message.is_pinned,
  );

  const onEditMessageButtonClicked = () => {
    if (editingMessageId === message.id) {
      setEditingMessageId(null);
    }
    setEditingMessageId(message.id);
  };

  const onReplyMessageButtonClicked = () => {
    setReplyingMessage(message);
    setCurrentMessageContext(message.context ?? 0);
  };

  // Message DOES NOT belong to user
  if (!user || message.sender_id != user.id) {
    return (
      <div className="flex-row gap-1 absolute -top-5 right-2 hidden group-hover:flex">
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
          onClick={onReplyMessageButtonClicked}
        >
          <ReplyIcon className="text-text w-[75%] aspect-square" />
        </BaseActionButton>
      </div>
    );
  }

  // Message DOES belong to user
  return (
    <div className="flex-row gap-1 absolute -top-5 right-2 hidden group-hover:flex">
      <div
        className="flex items-center justify-center h-10 bg-surface-base hover:bg-surface border border-stroke rounded-lg px-2 gap-2"
        title="Change Context"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row gap-1">
          <button
            title="Decrease context level"
            onClick={() => {
              console.log(message.context, typeof message.context);
              setMessageContext({
                messageId: message.id,
                contextNumber: Math.min(
                  Math.max((message.context ?? 0) - 1, 0),
                  3,
                ),
              });
            }}
            className="text-text font-bold text-trim-both px-2 rounded-md cursor-pointer"
          >
            -
          </button>
          <span
            title={`Context Level: ${message.context ?? 0}`}
            className="text-text px-2 text-center rounded-md"
          >
            {message.context ?? 0}
          </span>
          <button
            title="Increase context level"
            onClick={() =>
              setMessageContext({
                messageId: message.id,
                contextNumber: Math.min(
                  Math.max((message.context ?? 0) + 1, 0),
                  3,
                ),
              })
            }
            className="text-text font-bold text-trim-both px-2 rounded-md cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
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
        onClick={onReplyMessageButtonClicked}
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
