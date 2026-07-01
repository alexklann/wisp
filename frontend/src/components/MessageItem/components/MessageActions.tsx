import EditIcon from "../../../icons/EditIcon";
import ReplyIcon from "../../../icons/ReplyIcon";
import TrashIcon from "../../../icons/TrashIcon";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useChatStore } from "../../../stores/useChatStore";
import { useUIStore } from "../../../stores/useUIStore";
import BaseActionButton from "../../BaseActionButton";

interface Props {
  messageId: number;
  messagePreviewContent: string | null;
  senderUsername: string;
  senderId: string;
}

export default function MessageActions({
  messageId,
  messagePreviewContent,
  senderUsername,
  senderId,
}: Props) {
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

  const deleteMessageStorage = useChatStore((state) => state.deleteMessage);

  const onReplyMessageButtonClicked = () => {
    setReplyingMessageId(messageId);
    setReplyingMessageContent(messagePreviewContent);
    setReplyingMessageUsername(senderUsername);
  };

  const onEditMessageButtonClicked = () => {
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
    }
    setEditingMessageId(messageId);
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
  if (!user || senderId != user.id) {
    return (
      <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
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
        onClick={() => deleteMessage(messageId)}
        className="hover:bg-red-400"
      >
        <TrashIcon className="text-text w-[75%] aspect-square" />
      </BaseActionButton>
    </div>
  );
}
