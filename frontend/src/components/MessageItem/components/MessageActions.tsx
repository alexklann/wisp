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
import ColorPaletteIcon from "../../../icons/ColorPaletteIcon";

interface Props {
  message: Message;
}

export default function MessageActions({ message }: Props) {
  const user = useAuthStore((state) => state.user);

  const editingMessageId = useUIStore((state) => state.editingMessageId);
  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const { pinMessage, deleteMessage, setReplyingMessage, setMessageContext } = useMessageActions();

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
    <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-16">
      <div
        className="flex items-center justify-center h-10 aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg justify-start px-2 gap-2 flex w-full"
        title="Change Context"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row gap-1">
          <button
            title="Decrease context level"
            onClick={() =>
              setMessageContext({
                messageId: message.id,
                contextNumber: (message.context ?? 0) - 1, // TODO: Clamp this
              })
            }
            className="text-text font-bold text-trim-both px-2 rounded-md cursor-pointer"
          >
            -
          </button>
          <span title={`Context Level: ${message.context ?? 0}`} className="text-text px-2 text-center rounded-md">
            {message.context ?? 0}
          </span>
          <button
            title="Increase context level"
            onClick={() =>
              setMessageContext({
                messageId: message.id,
                contextNumber: (message.context ?? 0) + 1, // TODO: Clamp this
              })
            }
            className="text-text font-bold text-trim-both px-2 rounded-md cursor-pointer"
          >
            +
          </button>
          {/*
          <input
            className="text-text w-8 text-center border-stroke border outline-none rounded-md px-2"
            value={message.context ?? 0}
            min={0}
            max={3}
            onChange={(e) => {
              if (Number.isNaN(e.currentTarget.value)) {
                e.currentTarget.value = "0";
                return;
              }

              if (Number.parseInt(e.currentTarget.value) < 0) {
                e.currentTarget.value = "0";
              } else if (Number.parseInt(e.currentTarget.value) > 3) {
                e.currentTarget.value = "3";
              }

              setMessageContext({
                messageId: message.id,
                contextNumber: Number.parseInt(e.currentTarget.value)
              })
            }}
            onBlur={(e) => {
              if (!e.currentTarget.value.trim()) {
                e.currentTarget.value = "0";
              }
            }}
          />
          */}
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
