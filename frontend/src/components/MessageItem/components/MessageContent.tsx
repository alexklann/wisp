import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { useUIStore } from "../../../stores/useUIStore";
import InlineMessageEditor from "../../InlineMessageEditor";
import remarkBreaks from "remark-breaks";
import MESSAGE_CONTEXT_COLORS from "../../../lib/contextColors";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        messageContext={messageContext ?? 0}
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
        components={{
          code(props) {
            const { children, className, node, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <SyntaxHighlighter
                PreTag="div"
                children={String(children).replace(/\n$/, '')}
                language={match[1]}
                style={dark}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: "transparent",
                  border: 0,
                  boxShadow: "none",
                  textShadow: "none",
                }}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            )
          }
        }}
      >
        {messageContent}
      </Markdown>
    </div>
  );
}
