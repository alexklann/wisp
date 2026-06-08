import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import SlateEditor from "./SlateEditor";
import AttachmentDrawer from "./AttachmentDrawer";
import { useChatInput } from "../hooks/useChatInput";
import PaperclipIcon from "../icons/PaperclipIcon";

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

  return (
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
      </div>
    </div>
  );
}
