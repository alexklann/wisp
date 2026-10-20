import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import SlateEditor from "./SlateEditor";
import AttachmentDrawer from "./AttachmentDrawer";
import { useChatInput } from "../hooks/useChatInput";
import PaperclipIcon from "../icons/PaperclipIcon";
import { useUIStore } from "../stores/useUIStore";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Transforms } from "slate";

const EMOJI_LIST = [
  "😀",
  "😁",
  "🫢",
  "😱",
  "🫪",
  "😼",
  "😺",
  "💩",
  "🦊",
  "🐻",
  "🐨",
  "💡",
  "💹",
  "🔍",
  "🧸",
];

export default function ChatInput() {
  const {
    editor,
    attachments,
    setAttachments,
    removeAttachment,
    sendMessage,
    isUploading,
    uploadProgress,
  } = useChatInput();

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [emojiButtonIndex, setEmojiButtonIndex] = useState<number>(0);

  const replyingMessageId = useUIStore((state) => state.replyingMessageId);
  const replyingMessageContent = useUIStore(
    (state) => state.replyingMessageContent,
  );
  const replyingMessageUsername = useUIStore(
    (state) => state.replyingMessageUsername,
  );
  const replyingMessageHasAttachment = useUIStore(
    (state) => state.replyingMessageHasAttachment,
  );

  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (emojiButtonRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
    };

    const id = requestAnimationFrame(() =>
      document.addEventListener("mousedown", onPointerDown),
    );

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [showEmojiPicker]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setAttachments((prev) => [...prev, ...acceptedFiles]);
    },
    [setAttachments],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
  });

  const onEmojiSelect = (e: any) => {
    Transforms.insertText(editor, e["native"]);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative flex flex-col gap-2">
      {showEmojiPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-0 -translate-y-16 right-0"
        >
          <Picker data={data} onEmojiSelect={onEmojiSelect} />
        </div>
      )}

      <div
        {...getRootProps()}
        className="relative bg-surface text-white border border-stroke rounded-lg"
      >
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-subtitle font-bold font-sans-code">
            Drop files to attach...
          </div>
        )}
        <AttachmentDrawer
          attachments={attachments}
          removeAttachment={removeAttachment}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
        {replyingMessageId && (
          <div className="flex flex-row gap-2 items-center text-sm px-2 py-1 border-b border-stroke">
            <span>Replying to:</span>
            <div className="flex flex-row gap-1 px-2 py-1 border border-stroke rounded-lg">
              <span className="font-bold">{replyingMessageUsername}:</span>
              <span>
                {replyingMessageContent && replyingMessageContent.length > 0
                  ? replyingMessageContent
                  : replyingMessageHasAttachment
                    ? "[Attachment]"
                    : "Message not found"}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-row gap-2 p-2">
          <button
            className="flex items-center justify-center h-10 aspect-square hover:bg-white/5 border border-stroke rounded-lg cursor-pointer"
            onClick={() => open()}
          >
            <PaperclipIcon className="text-white w-[75%] aspect-square" />
          </button>
          <SlateEditor
            editor={editor}
            setAttachments={setAttachments}
            isUploading={isUploading}
            sendMessage={sendMessage}
          />
          <button
            ref={emojiButtonRef}
            className="group flex items-center justify-center h-10 aspect-square hover:bg-white/5 border border-stroke rounded-lg cursor-pointer"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            onMouseLeave={() =>
              setEmojiButtonIndex((emojiButtonIndex + 1) % EMOJI_LIST.length)
            }
          >
            <span className="grayscale transition-transform duration-100 ease-in-out group-hover:scale-125">
              {EMOJI_LIST[emojiButtonIndex]}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
