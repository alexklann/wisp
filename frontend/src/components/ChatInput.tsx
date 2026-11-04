import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import SlateEditor from "./SlateEditor";
import AttachmentDrawer from "./AttachmentDrawer";
import { useChatInput } from "../hooks/useChatInput";
import PaperclipIcon from "../icons/PaperclipIcon";
import { useUIStore } from "../stores/useUIStore";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Editor, Transforms } from "slate";
import PaperplaneIcon from "../icons/PaperplaneIcon";
import MESSAGE_CONTEXT_COLORS from "../lib/contextColors";
import { chatFocus } from "../lib/chatFocus";
import { ReactEditor } from "slate-react";

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

export default function ChatInput({ chatInputHook }: { chatInputHook: ReturnType<typeof useChatInput> }) {
  const {
    editor,
    attachments,
    setAttachments,
    removeAttachment,
    sendMessage,
    isUploading,
    uploadProgress,
    currentMessageContext,
    setCurrentMessageContext,
    focusEditor
  } = chatInputHook;

  chatFocus.current = focusEditor;

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [emojiButtonIndex, setEmojiButtonIndex] = useState<number>(0);

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

  const lastSelectionRef = useRef(editor.selection);

  const onEmojiButtonClick = () => {
    lastSelectionRef.current = editor.selection;
    setShowEmojiPicker((v) => !v);
  }

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
    const emoji: string = e.native;

    ReactEditor.focus(editor);

    if (editor.selection == null) {
      Transforms.select(editor, lastSelectionRef.current ?? Editor.end(editor, []));
    }

    Transforms.insertText(editor, emoji);

    const caret = editor.selection?.anchor;

    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      ReactEditor.focus(editor);
      if (caret) Transforms.select(editor, caret);
    });
  };

  const removeReply = () => {
    setReplyingMessageContent(null);
    setReplyingMessageHasAttachment(false);
    setReplyingMessageId(null);
    setReplyingMessageUsername(null);
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
        style={
          currentMessageContext > 0
            ? { borderColor: MESSAGE_CONTEXT_COLORS[currentMessageContext] }
            : undefined
        }
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
          <div
            onClick={() => {
              removeReply();
              focusEditor();
            }}
            title="Stop replying"
            className="flex flex-row gap-2 items-center text-sm px-2 py-1 border-b border-stroke hover:line-through cursor-pointer"
          >
            <span className="shrink-0">Replying to:</span>
            <div className="flex flex-row gap-1 px-2 py-1 border border-stroke rounded-lg min-w-0">
              <span className="font-bold shrink-0">{replyingMessageUsername}:</span>
              <span className="flex-1 truncate">
                {replyingMessageContent && replyingMessageContent.length > 0
                  ? replyingMessageContent
                  : replyingMessageHasAttachment
                    ? "[Attachment]"
                    : "Message not found"}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-row items-center p-2 gap-2">
          <button
            className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer"
            onClick={() => open()}
          >
            <PaperclipIcon className="text-white w-[75%] aspect-square" />
          </button>
          <SlateEditor
            editor={editor}
            setAttachments={setAttachments}
            isUploading={isUploading}
            sendMessage={sendMessage}
            currentMessageContext={currentMessageContext}
            setCurrentMessageContext={setCurrentMessageContext}
          />
          {currentMessageContext > 0 && (
            <span className="hidden md:block h-fit text-xs text-text/50">{currentMessageContext}</span>
          )}
          <button
            ref={emojiButtonRef}
            className="group flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer"
            onClick={onEmojiButtonClick}
            onMouseLeave={() =>
              setEmojiButtonIndex((emojiButtonIndex + 1) % EMOJI_LIST.length)
            }
          >
            <span className="grayscale transition-transform duration-100 ease-in-out">
              {EMOJI_LIST[emojiButtonIndex]}
            </span>
          </button>
          <button
            className="flex items-center justify-center h-8 aspect-square hover:bg-white/5 rounded-lg cursor-pointer"
            onClick={async () => {
              await sendMessage();
              focusEditor();
            }}
          >
            <PaperplaneIcon className="text-white w-[75%] aspect-square" />
          </button>
        </div>
      </div>
    </div>
  );
}
