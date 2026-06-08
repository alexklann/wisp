import { useEffect, useState } from "react";
import { useTyping } from "../hooks/useTyping";
import { useChatStore } from "../stores/useChatStore";
import type { Attachment } from "../types/message";
import type Message from "../types/message";
import ChatInput from "./ChatInput";
import CloseIcon from "../icons/CloseIcon";
import ExternalIcon from "../icons/ExternalIcon";
import DownloadIcon from "../icons/DownloadIcon";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import "../markdown.css";
import FileIcon from "../icons/FileIcon";

export default function ChatInterface() {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null);
  const [selectedImageFilename, setSelectedImageFilename] = useState<
    string | null
  >(null);

  const { typingUsernames } = useTyping();

  const downloadImage = async () => {
    try {
      if (!selectedImageURL || !selectedImageFilename) return;
      const response = await fetch(selectedImageURL);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = localUrl;
      link.download = selectedImageFilename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedImageURL === null) return;
      if (event.key !== "Escape") return;

      setSelectedImageURL(null);
    };

    window.addEventListener("keypress", (event) => {
      handleKeyPress(event);
    });
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [selectedImageURL]);

  return (
    <>
      {selectedImageURL !== null && (
        <div
          onClick={() => setSelectedImageURL(null)}
          className="flex justify-center items-center absolute inset-0 z-90 bg-black/70 p-12"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex flex-row gap-2 absolute top-0 right-0 m-4"
          >
            <button
              onClick={() => window.open(selectedImageURL, "_blank")?.focus()}
              title="Open in external tab"
              className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
            >
              <ExternalIcon className="text-text" />
            </button>
            <button
              onClick={() => downloadImage()}
              title="Download image"
              className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
            >
              <DownloadIcon className="text-text" />
            </button>
            <button
              onClick={() => setSelectedImageURL(null)}
              className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
            >
              <CloseIcon className="text-text" />
            </button>
          </div>
          <img
            onClick={(event) => event.stopPropagation()}
            className="max-w-full max-h-full object-contain"
            src={selectedImageURL}
          />
        </div>
      )}
      <main
        key={activeChannelId}
        className="flex flex-col gap-1 bg-surface-base text-text h-full w-full border p-3 border-stroke rounded-xl"
      >
        <div className="flex flex-col-reverse h-full overflow-y-auto">
          {messages && messages.length > 0 ? (
            [...messages].reverse().map((message: Message) => (
              <div
                className="flex flex-row gap-4 p-2 rounded-lg border-2 border-transparent hover:border-brand-pink hover:bg-surface"
                key={`message_${message.id}`}
              >
                <div className="w-12 h-12 bg-white rounded-full overflow-hidden">
                  {message.sender_avatar_url && (
                    <img src={message.sender_avatar_url} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <div className="flex flex-row items-center gap-2">
                      <span className="font-bold">
                        {message.sender_display_name}
                      </span>
                      <span className="text-xs">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
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
                  {message.attachments.length > 0 &&
                    message.attachments.map((attachment: Attachment) =>
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
              </div>
            ))
          ) : (
            <div>This channel has no messages yet</div>
          )}
        </div>
        <div className="min-h-4 px-2">
          {typingUsernames.length > 0 && (
            <span className="text-xs font-medium text-white/60 animate-pulse">
              {typingUsernames.join(", ")}{" "}
              {typingUsernames.length === 1 ? "is" : "are"} typing...
            </span>
          )}
        </div>
        <ChatInput />
      </main>
    </>
  );
}
