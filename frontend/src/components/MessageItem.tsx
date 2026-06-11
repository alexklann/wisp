import Markdown from "react-markdown";
import EditIcon from "../icons/EditIcon";
import TrashIcon from "../icons/TrashIcon";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";
import type Message from "../types/message";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import InlineMessageEditor from "./InlineMessageEditor";
import type { Attachment } from "../types/message";
import type { Dispatch, SetStateAction } from "react";
import FileIcon from "../icons/FileIcon";
import { useChatStore } from "../stores/useChatStore";

interface Props {
  message: Message;
  setSelectedImageURL: Dispatch<SetStateAction<string | null>>;
  setSelectedImageFilename: Dispatch<SetStateAction<string | null>>;
  isConsecutive: boolean;
}

export default function MessageItem({
  message,
  setSelectedImageURL,
  setSelectedImageFilename,
  isConsecutive,
}: Props) {
  const token = useAuthStore((store) => store.token);
  const user = useAuthStore((state) => state.user);

  const editingMessageId = useUIStore((state) => state.editingMessageId);
  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const deleteMessageStorage = useChatStore((state) => state.deleteMessage);

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

  return (
    <div
      className={`group relative flex flex-row gap-4 rounded-lg border-2 border-transparent hover:border-brand-pink hover:bg-surface ${!isConsecutive && "p-2 py-0"}`}
      key={`message_${message.id}`}
    >
      <div className="flex-row gap-1 absolute top-0 right-0 hidden group-hover:flex -translate-y-5 -translate-x-2">
        {user && message.sender_id == user.id && (
          <>
            <button
              title="Edit Message"
              className="flex items-center justify-center h-10 aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
              onClick={() =>
                editingMessageId === message.id
                  ? setEditingMessageId(null)
                  : setEditingMessageId(message.id)
              }
            >
              <EditIcon className="text-text w-[75%] aspect-square" />
            </button>
            <button
              title="Delete Message"
              className="flex items-center justify-center h-10 aspect-square bg-surface-base hover:bg-red-400 border border-stroke rounded-lg cursor-pointer"
              onClick={() => deleteMessage(message.id)}
            >
              <TrashIcon className="text-text w-[75%] aspect-square" />
            </button>
          </>
        )}
      </div>
      {!isConsecutive && (
        <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
          {message.sender_avatar_url && <img src={message.sender_avatar_url} />}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          {!isConsecutive && (
            <div className="flex flex-row items-center gap-2">
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
          )}
          {editingMessageId !== message.id ? (
            <div className={isConsecutive ? "ml-16" : ""}>
              <Markdown
                rehypePlugins={[
                  [
                    rehypeExternalLinks,
                    { target: "_blank", rel: ["noreferrer"] },
                  ],
                ]}
                remarkPlugins={[remarkGfm]}
              >
                {message.content}
              </Markdown>
            </div>
          ) : (
            <InlineMessageEditor
              messageUUID={message.id}
              initialMessage={message.content ?? ""}
            />
          )}
        </div>
        {message.attachments.length > 0 && (
          <div className={isConsecutive ? "ml-18" : ""}>
            {message.attachments.map((attachment: Attachment) =>
              attachment.file_type.startsWith("image/") ? (
                <img
                  onSelect={(event) => event.preventDefault()}
                  key={`image_${attachment.id}`}
                  onClick={() => {
                    setSelectedImageURL(
                      `${import.meta.env.VITE_BACKEND_URL}${attachment.url}`,
                    );
                    setSelectedImageFilename(attachment.id);
                  }}
                  className="max-w-48 cursor-pointer rounded-lg"
                  src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url}`}
                />
              ) : (
                <a
                  href={`${import.meta.env.VITE_BACKEND_URL}/download/${attachment.id}`}
                  download
                  target="_blank"
                  title="Download file"
                  className="flex flex-row w-96 gap-1 bg-surface hover:bg-white/5 border-2 border-stroke rounded-lg pl-1 pr-4 py-2 cursor-pointer"
                  key={`file_${attachment.id}`}
                >
                  <FileIcon className="text-text h-12 w-12 object-contain" />
                  <div className="flex flex-col w-full">
                    <span className="text-brand-pink truncate w-full decoration-0">
                      {attachment.file_name}
                    </span>
                    <span className="decoration-0 text-text font-normal text-sm">
                      {(attachment.file_size / 1000 / 1000).toFixed(2)}
                      MB
                    </span>
                  </div>
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
