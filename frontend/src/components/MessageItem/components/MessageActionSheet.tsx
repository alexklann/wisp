import EditIcon from "../../../icons/EditIcon";
import PinIcon from "../../../icons/PinIcon";
import ReplyIcon from "../../../icons/ReplyIcon";
import TrashIcon from "../../../icons/TrashIcon";
import BaseActionButton from "../../BaseActionButton";
import { useState } from "react";
import { useMessageActions } from "../hooks/useMessageActions";
import { useUIStore } from "../../../stores/useUIStore";
import { twMerge } from "tailwind-merge";
import { useAuthStore } from "../../../stores/useAuthStore";
import ColorPaletteIcon from "../../../icons/ColorPaletteIcon";
import { useChatStore } from "../../../stores/useChatStore";

export default function MessageActionSheet() {
  const { pinMessage, deleteMessage, setReplyingMessage, setMessageContext } =
    useMessageActions();

  const user = useAuthStore((state) => state.user);

  const displayMessageId = useUIStore(
    (state) => state.messageActionSheetSelectedMessageId,
  );

  const setDisplayMessageId = useUIStore(
    (state) => state.setMessageActionSheetSelectedMessageId,
  );

  const setEditingMessageId = useUIStore((state) => state.setEditingMessageId);

  const show =
    useUIStore((state) => state.messageActionSheetSelectedMessageId) !== null;

  const [renderedMessageId, setRenderedMessageId] = useState<number | null>(null);

  if (displayMessageId !== null && displayMessageId !== renderedMessageId) {
    setRenderedMessageId(displayMessageId);
  }

  const renderedMessage = useChatStore((state) => state.messages.find((m) => m.id === renderedMessageId) ?? null);

  return (
    <div
      inert={!show}
      className="fixed inset-0 z-90"
      onClick={() => setDisplayMessageId(null)}
    >
      <div
        className={twMerge(
          "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
          show ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        onTransitionEnd={() => {
          if (!show) setDisplayMessageId(null);
        }}
        className={twMerge(
          "flex flex-col gap-2 absolute bottom-0 action-sheet w-full max-w-none rounded-t-md bg-surface p-2 transition duration-300 ease-in-out",
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
            {user && renderedMessage.sender_id === user.id && (
              <>
                <div
                  className="flex items-center justify-center h-10 aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg justify-start pl-4 pr-2 gap-4 flex w-full"
                  title="Change Context"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ColorPaletteIcon className="text-text aspect-square" />
                  <span className="text-text text-sm select-none flex-1">
                    Change Context
                  </span>
                  <div className="flex flex-row gap-1">
                    <button
                      onClick={() =>
                        setMessageContext({
                          messageId: renderedMessage.id,
                          contextNumber: (renderedMessage.context ?? 0) - 1, // TODO: Clamp this
                        })
                      }
                      className="text-text font-bold text-trim-both px-2 rounded-md"
                    >
                      -
                    </button>
                    <input
                      className="text-text w-8 text-center border-stroke border outline-none rounded-md px-2"
                      value={renderedMessage.context ?? 0}
                      min={0}
                      max={3}
                    />
                    <button
                      onClick={() =>
                        setMessageContext({
                          messageId: renderedMessage.id,
                          contextNumber: (renderedMessage.context ?? 0) + 1, // TODO: Clamp this
                        })
                      }
                      className="text-text font-bold text-trim-both px-2 rounded-md"
                    >
                      +
                    </button>
                  </div>
                </div>
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
                  className="justify-start px-4 gap-4 flex w-full bg-red-700"
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
          </>
        )}
      </div>
    </div>
  );
}
