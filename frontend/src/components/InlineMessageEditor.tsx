import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Editor, Node, Transforms, createEditor } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { useTyping } from "../hooks/useTyping";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";
import { chatFocus } from "../lib/chatFocus";
import { withHistory } from "slate-history";
import MESSAGE_CONTEXT_COLORS from "../lib/contextColors";

interface Props {
  messageUUID: number;
  initialMessage: string;
  messageContext: number;
}

export default function InlineMessageEditor({
  messageUUID,
  initialMessage,
  messageContext,
}: Props) {
  const [editor] = useState(() => withReact(withHistory(createEditor())));
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
    // Never handle CJK IME input
    // const native = "nativeEvent" in event ? event.nativeEvent : event;
    // if (native.isComposing) return;

    // We have to use event.code because otherwise
    // the option+numbers get interpreted as special chars on macos.
    // const CONTEXT_BY_CODE = new Map([
    //   ["Digit1", 1], ["Digit2", 2], ["Digit3", 3], ["Digit0", 0],
    // ]);

    // If we're pressing 1/2/3/4/5
    // const context = CONTEXT_BY_CODE.get(event.code);
    // if (event.altKey && context !== undefined) {
    //   event.preventDefault();
    //   if (context === currentMessageContext) {
    //     setCurrentMessageContext(0);
    //     return;
    //   }
    //   setCurrentMessageContext(context);
    // }

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
        const response = await fetch(`/api/messages/${messageUUID}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: Node.string(editor),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete message");
        }

        setEditingMessageId(null);
        requestAnimationFrame(() => chatFocus.current?.());
      } catch (error) {
        console.error(error);
      }
    } else if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      editor.insertText("\n");
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditingMessageId(null);
      requestAnimationFrame(() => chatFocus.current?.());
    }
  };

  return (
    <div
      ref={containerRef}
      className="text-text border border-stroke rounded-md"
      style={
        messageContext !== 0
          ? {
              borderColor: MESSAGE_CONTEXT_COLORS[messageContext],
            }
          : undefined
      }
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
