import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { useUIStore } from "../../../stores/useUIStore";
import InlineMessageEditor from "../../InlineMessageEditor";
import remarkBreaks from "remark-breaks";

export default function MessageContent({
  messageId,
  messageContent,
}: {
  messageId: number;
  messageContent: string | null;
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
    <div>
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
