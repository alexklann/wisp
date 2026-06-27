import { Node, type BaseEditor } from "slate";
import { Slate, Editable, ReactEditor } from "slate-react";
import {
  useCallback,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import { useTyping } from "../hooks/useTyping";
import { useChatStore } from "../stores/useChatStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";

interface Props {
  editor: BaseEditor & ReactEditor;
  setAttachments: Dispatch<SetStateAction<File[]>>;
  isUploading: boolean;
  sendMessage: () => Promise<void>;
}

export default function SlateEditor({
  editor,
  setAttachments,
  isUploading,
  sendMessage,
}: Props) {
  const user = useAuthStore((state) => state.user);

  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const { notifyTyping } = useTyping();

  const onPaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const { files } = event.clipboardData;

      if (files && files.length > 0) {
        // Stop Slate from trying to render the image as inline text/HTML
        event.preventDefault();

        const pastedFiles = Array.from(files);

        if (pastedFiles.length > 0) {
          setAttachments((prev) => [...prev, ...pastedFiles]);
        }
      }
    },
    [setAttachments],
  );

  const handleKeyDownEvent = async (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    } else if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      editor.insertText("\n");
    }

    if (event.key === "ArrowUp") {
      const text = Node.string(editor);

      if (text.length === 0) {
        event.preventDefault();

        if (!user) return;

        const currentMessages = useChatStore.getState().messages;

        const userMessages = currentMessages.filter(
          (m) => m.sender_id === user.id,
        );
        const lastMessage = userMessages[userMessages.length - 1];

        if (lastMessage) {
          setEditingMessageId(lastMessage.id);
        }
      }
      return;
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 pr-4 w-full max-h-48 overflow-y-auto">
      <div className="flex-1 min-w-0">
        <Slate
          editor={editor}
          onChange={() => {
            const isAstChange = editor.operations.some(
              (op) => op.type !== "set_selection",
            );
            if (isAstChange) {
              notifyTyping();
            }
          }}
          initialValue={[
            {
              type: "paragraph",
              children: [{ text: "" }],
            },
          ]}
        >
          <Editable
            onPaste={onPaste}
            onKeyDown={handleKeyDownEvent}
            className="p-2 outline-none w-full wrap-break-word"
            placeholder={
              isUploading ? "Uploading attachments..." : "Enter a message..."
            }
            readOnly={isUploading}
          />
        </Slate>
      </div>
    </div>
  );
}
