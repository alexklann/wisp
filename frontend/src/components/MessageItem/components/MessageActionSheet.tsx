import EditIcon from "../../../icons/EditIcon";
import PinIcon from "../../../icons/PinIcon";
import ReplyIcon from "../../../icons/ReplyIcon";
import TrashIcon from "../../../icons/TrashIcon";
import BaseActionButton from "../../BaseActionButton";
import { useState } from "react";
import { useMessageActions } from "../hooks/useMessageActions";
import { useUIStore } from "../../../stores/useUIStore";
import { twMerge } from "tailwind-merge";
import type Message from "../../../types/message";

export default function MessageActionSheet() {
  const { pinMessage, deleteMessage, setReplyingMessage } = useMessageActions();

  const displayMessage = useUIStore(
    (state) => state.messageActionSheetSelectedMessage,
  );

  const setDisplayMessage = useUIStore(
    (state) => state.setMessageActionSheetSelectedMessage,
  );

  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const show =
    useUIStore((state) => state.messageActionSheetSelectedMessage) !== null;

  const [renderedMessage, setRenderedMessage] = useState<Message | null>(null);

  if (displayMessage !== null && displayMessage !== renderedMessage) {
    setRenderedMessage(displayMessage);
  }

  return (
    <div
      inert={!show}
      className="fixed inset-0 z-90"
      onClick={() => setDisplayMessage(null)}
    >
      <div
        className={twMerge(
          "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
          show ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        onTransitionEnd={() => {
          if (!show) setDisplayMessage(null);
        }}
        className={twMerge(
          "flex flex-col gap-2 absolute bottom-0 action-sheet w-full max-w-none rounded-t-2xl bg-surface p-2 transition duration-300 ease-in-out min-h-32",
          show ? "translate-y-0" : "translate-y-full",
        )}
      >
        {renderedMessage && (
          <>
            <BaseActionButton
              className="justify-start px-4 gap-4 flex w-full"
              title={`${renderedMessage.is_pinned ? "Unpin Message" : "Pin Message"}`}
              onClick={async () => {
                await pinMessage(renderedMessage);
              }}
            >
              <PinIcon className="text-text aspect-square" />
              <span className="text-text text-sm select-none">Pin Message</span>
            </BaseActionButton>
            <BaseActionButton
              className="justify-start px-4 gap-4 flex w-full"
              title="Reply to Message"
              onClick={() => setReplyingMessage(renderedMessage)}
            >
              <ReplyIcon className="text-text aspect-square" />
              <span className="text-text text-sm select-none">
                Reply to Message
              </span>
            </BaseActionButton>
            <BaseActionButton
              className="justify-start px-4 gap-4 flex w-full"
              title="Edit Message"
              onClick={() => setEditingMessageId(renderedMessage.id)}
            >
              <EditIcon className="text-text aspect-square" />
              <span className="text-text text-sm select-none">
                Edit Message
              </span>
            </BaseActionButton>
            <BaseActionButton
              className="justify-start px-4 gap-4 flex w-full"
              title="Delete Message"
              onClick={() =>
                deleteMessage({
                  messageId: renderedMessage.id,
                })
              }
            >
              <TrashIcon className="text-text aspect-square" />
              <span className="text-text text-sm select-none">
                Delete Message
              </span>
            </BaseActionButton>
          </>
        )}
      </div>
    </div>
  );
}
