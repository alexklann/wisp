import { useEffect, useRef, useState } from "react";
import { useTyping } from "../hooks/useTyping";
import { useChatStore } from "../stores/useChatStore";
import type Message from "../types/message";
import ChatInput from "./ChatInput";
import CloseIcon from "../icons/CloseIcon";
import ExternalIcon from "../icons/ExternalIcon";
import DownloadIcon from "../icons/DownloadIcon";
import "../markdown.css";
import MessageItem from "./MessageItem";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useUIStore } from "../stores/useUIStore";
import { useWebsocket } from "../hooks/useWebsocket";
import { useAuthStore } from "../stores/useAuthStore";
import downloadImage from "../lib/downloadImage";
import isMessageConsecutive from "../lib/isMessageConsecutive";
import SidebarIcon from "../icons/SidebarIcon";
import MembersIcon from "../icons/MembersIcon";
import PinIcon from "../icons/PinIcon";
import SpinnerIcon from "../icons/SpinnerIcon";
import { twMerge } from "tailwind-merge";

function ConnectionOverlay() {
  const { socket, attemptCount } = useWebsocket();

  if (socket === null) {
    return (
      <div className="flex justify-center items-center absolute h-screen w-screen inset-0 bg-black/50 z-50">
        {attemptCount <= 10 ? (
          <span className="text-center text-white font-bold text-4xl">
            Connecting to backend...
            <br />
            Attempt: {attemptCount} / 10
          </span>
        ) : (
          <span className="text-white font-bold text-4xl">
            Failed to connect within 10 attempts
          </span>
        )}
      </div>
    );
  }
}

function FullscreenImage() {
  const selectedImageURL = useUIStore((state) => state.selectedImageURL);
  const setSelectedImageURL = useUIStore((state) => state.setSelectedImageURL);

  const selectedImageFilename = useUIStore(
    (state) => state.selectedImageFilename,
  );

  // Allow for escape to close overlay when viewing fullscreen image
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImageURL !== null) {
        setSelectedImageURL(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageURL, setSelectedImageURL]);

  if (selectedImageURL !== null) {
    return (
      <div
        onClick={() => setSelectedImageURL(null)}
        className="flex justify-center items-center fixed inset-0 z-90 bg-black/70 p-12"
      >
        <div
          onClick={(event) => event.stopPropagation()}
          className="flex flex-row gap-2 absolute top-0 right-0 m-4"
        >
          <button
            onClick={() => window.open(selectedImageURL, "_blank")?.focus()}
            title="Open in external tab"
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <ExternalIcon className="text-text" />
          </button>
          <button
            onClick={() =>
              downloadImage(selectedImageURL, selectedImageFilename!)
            }
            disabled={!selectedImageFilename}
            title="Download image"
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <DownloadIcon className="text-text" />
          </button>
          <button
            onClick={() => setSelectedImageURL(null)}
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <CloseIcon className="text-text" />
          </button>
        </div>
        <img
          onClick={(event) => event.stopPropagation()}
          className="max-w-full max-h-full object-contain select-none"
          src={selectedImageURL}
        />
      </div>
    );
  }
}

export default function ChatInterface() {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const channels = useChatStore((state) => state.channels);
  const prependMessages = useChatStore((state) => state.prependMessages);
  const firstItemIndex = useChatStore((state) => state.firstItemIndex);

  const token = useAuthStore((state) => state.token);

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const isLoadingMessages = useRef(false);

  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  const setIsServerSidebarOpen = useUIStore(
    (state) => state.setIsServerSidebarOpen,
  );
  const setIsMemberSidebarOpen = useUIStore(
    (state) => state.setIsMemberSidebarOpen,
  );

  const [pinnedMessagesLoadingState, setPinnedMessagesLoadingState] = useState<
    "idle" | "loading" | "error"
  >("loading");
  const [showPinnedMessagesOverlay, setShowPinnedMessagesOverlay] =
    useState<boolean>(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const { typingUsernames } = useTyping();

  const scrollToBottom = () =>
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      align: "end",
      behavior: "smooth",
    });

  const handleLoadOlderMessages = async () => {
    if (
      isLoadingMessages.current ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    const oldestMessageId = messages[0].id;
    isLoadingMessages.current = true;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/channels/${activeChannelId}/messages/?before=${oldestMessageId}&limit=150`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const olderMessages: Message[] = await response.json();
        if (olderMessages.length > 0) {
          prependMessages(olderMessages);
        } else {
          setHasMoreMessages(false);
        }
      }
    } catch (err) {
      console.error("Failed to load older messages: ", err);
    } finally {
      isLoadingMessages.current = false;
    }
  };

  const fetchPinnedMessages = async () => {
    setPinnedMessagesLoadingState("loading");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/channels/${activeChannelId}/messages/pinned/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const pinned: Message[] = await response.json();
        setPinnedMessages(pinned);
        setPinnedMessagesLoadingState("idle");
      }
    } catch (err) {
      setPinnedMessagesLoadingState("error");
      console.error("Failed to load pinned messages: ", err);
    }
  };

  useEffect(() => {
    isLoadingMessages.current = false;
    setHasMoreMessages(true);
  }, [activeChannelId]);

  return (
    <>
      <ConnectionOverlay />
      <FullscreenImage />

      <main className="relative flex flex-col gap-1 bg-surface-base text-text h-full w-full border p-3 border-stroke rounded-xl">
        <div className="flex flex-row items-center p-2 gap-4 bg-surface w-full rounded-lg border-stroke border">
          <button
            onClick={() => setIsServerSidebarOpen(true)}
            title="Toggle sidebar"
            className="min-w-10 md:hidden flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <SidebarIcon className="text-text" />
          </button>
          <span className="md:ml-2 text-lg font-bold flex-1">
            {activeChannel && activeChannel.name}
          </span>
          <div className="flex flex-row gap-2">
            <div className="relative">
              <button
                onClick={async () => {
                  setShowPinnedMessagesOverlay(!showPinnedMessagesOverlay);
                  if (!showPinnedMessagesOverlay) await fetchPinnedMessages();
                }}
                title="Show pinned messages"
                className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
              >
                <PinIcon className="text-text" />
              </button>
              {showPinnedMessagesOverlay && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowPinnedMessagesOverlay(false)}
                  />
                  <div className="z-40 top-0 right-0 w-96 h-96 translate-y-12 shadow-md z-10 absolute flex flex-col bg-surface border border-stroke rounded-md p-4">
                    <span className="font-bold mb-4">Pinned Messages</span>
                    <div className="flex flex-col overflow-y-scroll h-full">
                      {pinnedMessagesLoadingState === "error" && (
                        <div className="flex flex-col items-center justify-center py-8 h-full">
                          <span className="font-bold text-center w-[75%]">
                            An error occured while loading the pinned messages
                          </span>
                        </div>
                      )}

                      {pinnedMessagesLoadingState === "loading" && (
                        <div className="flex flex-col items-center justify-center py-8 h-full">
                          <SpinnerIcon className="text-white animate-spin h-10 w-10" />
                          <span className="font-bold text-lg">Loading</span>
                        </div>
                      )}

                      {pinnedMessagesLoadingState === "idle" &&
                        pinnedMessages.length > 0 &&
                        pinnedMessages.map((message) => (
                          <MessageItem
                            key={`pinned_msg_${message.id}`}
                            message={message}
                            isConsecutive={false}
                            showActions={false}
                          />
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setIsMemberSidebarOpen(true)}
              title="Toggle members panel"
              className="min-w-10 md:hidden flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
            >
              <MembersIcon className="text-text" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full flex-1">
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            firstItemIndex={firstItemIndex}
            increaseViewportBy={500}
            minOverscanItemCount={20}
            computeItemKey={(_index, message) => message.id}
            followOutput="auto"
            initialTopMostItemIndex={
              messages.length > 0
                ? { index: firstItemIndex + messages.length - 1, align: "end" }
                : undefined
            }
            startReached={handleLoadOlderMessages}
            atBottomStateChange={(s) => setIsAtBottom(s)}
            components={{
              ScrollSeekPlaceholder: ({ height }) => (
                <div
                  className="p-2 box-border overflow-hidden"
                  style={{ height }}
                >
                  <div
                    className="bg-stroke animate-pulse rounded-md"
                    style={{
                      height,
                    }}
                  ></div>
                </div>
              ),
            }}
            scrollSeekConfiguration={{
              enter: (velocity) => Math.abs(velocity) > 1000,
              exit: (velocity) => Math.abs(velocity) < 150,
            }}
            itemContent={(index, message) => {
              const arrayIndex = index - firstItemIndex;
              const prevMessage = messages[arrayIndex - 1];

              // Check if the previous message is from a different day
              // Also show the header if it's the first message of a channel
              const newDay =
                !prevMessage ||
                new Date(message.created_at).toDateString() !==
                  new Date(prevMessage.created_at).toDateString();

              // Should change this to show Year instead of weekday
              return (
                <>
                  {newDay && (
                    <div className="flex items-center gap-4 px-4 py-2 text-xs font-bold text-white/50">
                      <span className="h-px flex-1 bg-stroke" />
                      {new Date(message.created_at).toLocaleDateString(
                        undefined, // Might replace with locale later
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                      <span className="h-px flex-1 bg-stroke" />
                    </div>
                  )}
                  <MessageItem
                    key={`message_${message.id}`}
                    message={message}
                    isConsecutive={
                      !newDay && isMessageConsecutive(message, prevMessage)
                    }
                  />
                </>
              );
            }}
          />
          {messages && messages.length == 0 && (
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

        <button
          onClick={scrollToBottom}
          inert={isAtBottom}
          className={twMerge(
            "transition-all ease-in-out duration-200 absolute bottom-0 left-[50%] -translate-x-1/2 mb-20 cursor-pointer bg-surface-base hover:bg-surface border border-stroke px-32 py-1 rounded-md z-10",
            isAtBottom
              ? "opacity-0 pointer-events-none translate-y-2"
              : "opacity-100 pointer-events-auto translate-y-0",
          )}
        >
          <span>Back to bottom</span>
        </button>

        <ChatInput />
      </main>
    </>
  );
}
