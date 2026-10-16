import toast from "react-hot-toast";
import EditIcon from "../../../icons/EditIcon";
import PinIcon from "../../../icons/PinIcon";
import ReplyIcon from "../../../icons/ReplyIcon";
import TrashIcon from "../../../icons/TrashIcon";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useChatStore } from "../../../stores/useChatStore";
import { useUIStore } from "../../../stores/useUIStore";
import BaseActionButton from "../../BaseActionButton";
import { twMerge } from "tailwind-merge";
import type Message from "../../../types/message";
import { useState } from "react";

interface Props {
  message: Message;
}

export default function MessageActions({ message }: Props) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const editingMessageId = useUIStore((state) => state.editingMessageId);
  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const setReplyingMessageId = useUIStore(
    (state) => state.setReplyingMessageId,
  );
  const setReplyingMessageContent = useUIStore(
    (state) => state.setReplyingMessageContent,
  );
  const setReplyingMessageUsername = useUIStore(
    (state) => state.setReplyingMessageUsername,
  );
  const setReplyingMessageHasAttachment = useUIStore(
    (state) => state.setReplyingMessageHasAttachment,
  );

  const deleteMessageStorage = useChatStore((state) => state.deleteMessage);

  const [isMessagePinned, setIsMessagePinned] = useState<boolean>(
    message.is_pinned,
  );

  const onReplyMessageButtonClicked = () => {
    setReplyingMessageId(message.id);
    setReplyingMessageContent(message.content);
    setReplyingMessageUsername(message.sender_username);
    setReplyingMessageHasAttachment(message.attachments.length > 0);
  };

  const onEditMessageButtonClicked = () => {
    if (editingMessageId === message.id) {
      setEditingMessageId(null);
    }
    setEditingMessageId(message.id);
  };

  const pinMessage = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/messages/${message.id}/pin/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: !isMessagePinned,
        }),
      },
    );

    if (response.ok) {
      setIsMessagePinned(!isMessagePinned);
      toast.custom((t) => (
        <div
          className={twMerge(
            "flex flex-col w-72 bg-surface border-stroke border rounded-md text-white p-2",
            t.visible ? "animate-fade-zoom-in" : "animate-fade-zoom-out",
          )}
        >
          <span className="font-bold">Message Pinned</span>
          <span className="text-white/50 text-xs">
            Successfully {isMessagePinned ? "unpinned" : "pinned"} message!
          </span>
        </div>
      ));
    } else {
      toast.custom((t) => (
        <div
          className={twMerge(
            "flex flex-col w-72 bg-surface border-stroke border rounded-md text-white p-2",
            t.visible ? "animate-fade-zoom-in" : "animate-fade-zoom-out",
          )}
        >
          <span className="font-bold">Message Pinned</span>
          <span className="text-white/50 text-xs">
            The message is already pinned
          </span>
        </div>
      ));
    }
  };

  const deleteMessage = async (messageId: number) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/messages/${messageId}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      deleteMessageStorage(messageId);
    } else {
      console.log("Failed to delete message");
    }
  };

  // Message DOES NOT belong to user
  if (!user || message.sender_id != user.id) {
    return (
      <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
        <BaseActionButton
          title={`${isMessagePinned ? "Unpin Message" : "Pin Message"}`}
          onClick={() => pinMessage()}
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
    <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
      <BaseActionButton
        title={`${isMessagePinned ? "Unpin Message" : "Pin Message"}`}
        onClick={() => pinMessage()}
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
        title="Edit Message"
        onClick={() => deleteMessage(message.id)}
        className="hover:bg-red-400"
      >
        <TrashIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
    </div>
  );
}
