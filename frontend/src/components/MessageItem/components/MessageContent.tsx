import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { useUIStore } from "../../../stores/useUIStore";
import InlineMessageEditor from "../../InlineMessageEditor";
import remarkBreaks from "remark-breaks";
import MESSAGE_CONTEXT_COLORS from "../../../lib/contextColors";

export default function MessageContent({
  messageId,
  messageContent,
  messageContext,
}: {
  messageId: number;
  messageContent: string | null;
  messageContext: number | null;
}) {
  const editingMessageId = useUIStore((state) => state.editingMessageId);

  if (editingMessageId === messageId) {
    return (
      <InlineMessageEditor
        messageUUID={messageId}
        initialMessage={messageContent ?? ""}
      />
    );
  }

  return (
    <div
      className={messageContext !== 0 && messageContext !== null ? `border-l-6 pl-2` : ""}
      style={{
        borderColor: `color-mix(in srgb, ${MESSAGE_CONTEXT_COLORS[messageContext ?? 0]} 50%, transparent)`,
      }}>
      <Markdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: "_blank", rel: ["noreferrer"] }],
        ]}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {messageContent}
      </Markdown>
    </div>
  );
}
