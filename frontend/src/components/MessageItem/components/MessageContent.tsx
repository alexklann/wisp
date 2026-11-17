import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { useUIStore } from "../../../stores/useUIStore";
import InlineMessageEditor from "../../InlineMessageEditor";
import remarkBreaks from "remark-breaks";
import MESSAGE_CONTEXT_COLORS from "../../../lib/contextColors";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type Message from "../../../types/message";
import { useNow } from "../../../lib/useNow";
import { formatTimestamp } from "./MessageHeader";

interface TimerData {
  end: number;
  [key: string]: unknown;
}

function isTimerData(data: Record<string, unknown> | null): data is TimerData {
  return data !== null && typeof data.end === "number";
}

function TimerDisplay({ end }: { end: number }) {
  const now = useNow();
  const total = Math.max(0, end - now) / 1000;

  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);

  return (
    <div className="flex items-center justify-center w-32 bg-surface border border-stroke p-2 rounded-md">
      <span
        title={formatTimestamp(end)}
        className="font-bold text-xl select-none"
      >{`${pad(h)}:${pad(m)}:${pad(s)}`}</span>
    </div>
  );
}

export default function MessageContent({ message }: { message: Message }) {
  const editingMessageId = useUIStore((state) => state.editingMessageId);

  if (editingMessageId === message.id) {
    return (
      <InlineMessageEditor
        messageUUID={message.id}
        initialMessage={message.content ?? ""}
        messageContext={message.context ?? 0}
      />
    );
  }

  return (
    <div
      className={
        message.context !== 0 && message.context !== null
          ? `border-l-6 pl-2`
          : ""
      }
      style={{
        borderColor: `color-mix(in srgb, ${MESSAGE_CONTEXT_COLORS[message.context ?? 0]} 50%, transparent)`,
      }}
    >
      <Markdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: "_blank", rel: ["noreferrer"] }],
        ]}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                PreTag="div"
                children={String(children).replace(/\n$/, "")}
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
            );
          },
        }}
      >
        {message.content}
      </Markdown>

      {message.message_type === "timer" && isTimerData(message.data) && (
        <TimerDisplay end={message.data.end} />
      )}
    </div>
  );
}
