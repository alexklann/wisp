import { useTyping } from "../hooks/useTyping";
import { useChatStore } from "../stores/useChatStore";
import type { Attachment } from "../types/message";
import type Message from "../types/message";
import ChatInput from "./ChatInput";

export default function ChatInterface() {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const { typingUsernames } = useTyping();

  return (
    <main
      key={activeChannelId}
      className="flex flex-col gap-1 bg-surface-base text-text h-full w-full border p-3 border-stroke rounded-xl"
    >
      <div className="flex flex-col-reverse h-full overflow-y-auto">
        {messages && messages.length > 0 ? (
          [...messages].reverse().map((message: Message) => (
            <div
              className="flex flex-row gap-4 p-2 rounded-lg border-2 border-transparent hover:border-brand-pink hover:bg-surface"
              key={`message_${message.id}`}
            >
              <div className="w-12 h-12 bg-white rounded-full overflow-hidden">
                <img src="https://cdn.discordapp.com/avatars/261820434528468992/ca7d07dd134188b2031332e63626353a.webp?size=256" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <div className="flex flex-row items-center gap-2">
                    <span className="font-bold">
                      {message.sender_display_name}
                    </span>
                    <span className="text-xs">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span>{message.content}</span>
                </div>
                {message.attachments.length > 0 &&
                  message.attachments.map((attachment: Attachment) => (
                    <img
                      className="max-w-48 cursor-pointer rounded-lg"
                      src={`${import.meta.env.VITE_BACKEND_URL}${attachment.url}`}
                    />
                  ))}
              </div>
            </div>
          ))
        ) : (
          <div>This channel has no messages yet</div>
        )}
      </div>
      <div className="min-h-4 px-2">
        {typingUsernames.length > 0 && (
          <span className="text-xs font-medium text-white/60 animate-pulse">
            {typingUsernames.join(", ")}{" "}
            {typingUsernames.length === 1 ? "is" : "are"} typing...
          </span>
        )}
      </div>
      <ChatInput />
    </main>
  );
}
