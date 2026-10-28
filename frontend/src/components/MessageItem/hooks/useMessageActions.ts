import { showGenericToast } from "../../../lib/customToast";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useChatStore } from "../../../stores/useChatStore";
import { useUIStore } from "../../../stores/useUIStore";
import type Message from "../../../types/message";

export function useMessageActions() {
  const token = useAuthStore((state) => state.token);

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

  async function pinMessage(message: Message) {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/messages/${message.id}/pin/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: !message.is_pinned,
        }),
      },
    );

    if (response.ok) {
      showGenericToast({
        title: "Message Pinned",
        description: `Successfully ${!message.is_pinned ? "unpinned" : "pinned"} message!`,
      });

      return !message.is_pinned;
    } else {
      showGenericToast({
        title: "Message Pinned",
        description: `The message is already pinned`,
      });

      return message.is_pinned;
    }
  }

  async function deleteMessage({ messageId }: { messageId: number }) {
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
      showGenericToast({
        title: "Message Deletion",
        description: `Failed to delete message`,
      });
    }
  }

  function setReplyingMessage(message: Message) {
    setReplyingMessageId(message.id);
    setReplyingMessageContent(message.content);
    setReplyingMessageUsername(message.sender_username);
    setReplyingMessageHasAttachment(message.attachments.length > 0);
  }

  return {
    pinMessage,
    deleteMessage,
    setReplyingMessage,
  };
}
