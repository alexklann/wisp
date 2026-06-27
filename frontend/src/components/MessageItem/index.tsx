import type Message from "../../types/message";
import type { Attachment } from "../../types/message";
import type { Dispatch, SetStateAction } from "react";
import AudioAttachment from "../AudioAttachment";
import MessageActions from "./components/MessageActions";
import MessageHeader from "./components/MessageHeader";
import { useUIStore } from "../../stores/useUIStore";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import InlineMessageEditor from "../InlineMessageEditor";

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
  const editingMessageId = useUIStore((state) => state.editingMessageId);

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-lg border-2 border-transparent hover:border-brand-pink hover:bg-surface`}
      key={`message_${message.id}`}
    >
      <MessageActions message={message} />

      <MessageHeader message={message} isConsecutive={isConsecutive} />
      {editingMessageId !== message.id ? (
        <div>
          <Markdown
            rehypePlugins={[
              [rehypeExternalLinks, { target: "_blank", rel: ["noreferrer"] }],
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

      {message.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <div>
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
              ) : attachment.file_type.startsWith("audio/") ? (
                <AudioAttachment attachment={attachment} />
              ) : attachment.file_type.startsWith("video/") ? (
                <video
                  key={`video_${attachment.id}`}
                  controls
                  className="max-w-full w-full md:w-2xl"
                  src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url}`}
                />
              ) : (
                // <a
                //   href={`${import.meta.env.VITE_BACKEND_URL}/download/${attachment.id}`}
                //   download
                //   target="_blank"
                //   title="Download file"
                //   className="flex flex-row w-full md:w-96 gap-1 bg-surface hover:bg-white/5 border-2 border-stroke rounded-lg pl-1 pr-4 py-2 cursor-pointer overflow-hidden"
                //   key={`file_${attachment.id}`}
                // >
                //   <FileIcon className="text-text h-12 w-12 object-contain shrink-0" />
                //   <div className="flex flex-col w-full min-w-0 flex-1">
                //     <span className="block text-brand-pink truncate w-full decoration-0">
                //       {attachment.file_name}
                //     </span>
                //     <span className="decoration-0 text-text font-normal text-sm">
                //       {(attachment.file_size / 1000 / 1000).toFixed(2)}
                //       MB
                //     </span>
                //   </div>
                // </a>
                <div>
                  <span>
                    There is supposed to be a file here but I disabled it
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
