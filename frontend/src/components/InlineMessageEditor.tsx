import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Editor, Node, Transforms, createEditor } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { useTyping } from "../hooks/useTyping";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";

interface Props {
  messageUUID: number;
  initialMessage: string;
}

export default function InlineMessageEditor({
  messageUUID,
  initialMessage,
}: Props) {
  const [editor] = useState(() => withReact(createEditor()));
  const { notifyTyping } = useTyping();
  const token = useAuthStore((state) => state.token);

  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ReactEditor.focus(editor);
    const endPoint = Editor.end(editor, []);
    Transforms.select(editor, endPoint);

    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [editor]);

  const handleKeyDownEvent = async (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (
        Node.string(editor).trim().length === 0 ||
        Node.string(editor) === initialMessage
      ) {
        setEditingMessageId(null);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/messages/${messageUUID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content: Node.string(editor),
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete message");
        }

        setEditingMessageId(null);
      } catch (error) {
        console.error(error);
      }
    } else if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      editor.insertText("\n");
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditingMessageId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="text-text border-2 border-stroke rounded-md"
    >
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
            children: [{ text: initialMessage }],
          },
        ]}
      >
        <Editable onKeyDown={handleKeyDownEvent} className="p-2 outline-none" />
      </Slate>
    </div>
  );
}
