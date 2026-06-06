import { useCallback, useState } from "react";
import { Editor, Node, Transforms, createEditor } from "slate";
import { withReact, ReactEditor } from "slate-react";
import { useWebsocket } from "./useWebsocket";
import { useAuthStore } from "../stores/useAuthStore";
import { uploadFileWithProgress } from "../lib/UploadFileWithProgress";
import { useChatStore } from "../stores/useChatStore";

export function useChatInput() {
  const { socket } = useWebsocket();
  const [editor] = useState(() => withReact(createEditor()));

  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const sendMessage = async () => {
    const text = Node.string(editor);
    if (text.trim().length === 0 && attachments.length === 0) return;
    if (!socket || !user || isUploading) return;

    setIsUploading(true);

    try {
      let attachmentIds: string[] = [];

      if (attachments.length > 0 && token) {
        const uploadPromises = attachments.map((file) =>
          uploadFileWithProgress(file, token, (percent) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
          }),
        );

        const uploadResults = await Promise.all(uploadPromises);
        attachmentIds = uploadResults.map((res) => res.id);
      }

      socket.send(
        JSON.stringify({
          type: "sendMessage",
          channel_id: activeChannelId,
          content: text,
          attachment_ids: attachmentIds,
        }),
      );

      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
      setAttachments([]);
      setUploadProgress({});
    } catch (error) {
      console.error("Failed to upload attachments:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const insertEmoji = useCallback(
    (emojiId: string) => {
      Transforms.insertText(editor, `:emoji_${emojiId}: `);
      ReactEditor.focus(editor);
    },
    [editor],
  );

  const removeAttachment = (fileNameToRemove: string) => {
    setAttachments((prev) => prev.filter((f) => f.name !== fileNameToRemove));
  };

  return {
    editor,
    attachments,
    setAttachments,
    removeAttachment,
    insertEmoji,
    sendMessage,
    isUploading,
    uploadProgress,
  };
}
