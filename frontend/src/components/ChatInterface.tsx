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
import HamburgerIcon from "../icons/HamburgerIcon";
import { useWebsocket } from "../hooks/useWebsocket";
import { useAuthStore } from "../stores/useAuthStore";

const START_INDEX = 1_000_000;

export default function ChatInterface() {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const channels = useChatStore((state) => state.channels);
  const prependMessages = useChatStore((state) => state.prependMessages);

  const token = useAuthStore((state) => state.token);

  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const isLoadingMessages = useRef(false);
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);

  const activeChannel = channels.find((ch) => ch.id === activeChannelId);

  const { socket, attemptCount } = useWebsocket();

  const setIsSidebarOpen = useUIStore((state) => state.setIsSidebarOpen);

  const selectedImageURL = useUIStore((state) => state.selectedImageURL);
  const setSelectedImageURL = useUIStore((state) => state.setSelectedImageURL);

  const selectedImageFilename = useUIStore(
    (state) => state.selectedImageFilename,
  );

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const { typingUsernames } = useTyping();

  const downloadImage = async () => {
    try {
      if (!selectedImageURL || !selectedImageFilename) return;
      const response = await fetch(selectedImageURL);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = localUrl;
      link.download = selectedImageFilename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleLoadOlderMessages = async () => {
    if (isLoadingMessages.current || !hasMoreMessages || messages.length === 0) {
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
        }
      );

      if (response.ok) {
        const olderMessages: Message[] = await response.json();
        if (olderMessages.length > 0) {
          setFirstItemIndex((prev) => prev - olderMessages.length);
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
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedImageURL === null) return;
      if (event.key !== "Escape") return;

      setSelectedImageURL(null);
    };

    window.addEventListener("keypress", (event) => {
      handleKeyPress(event);
    });
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [selectedImageURL, setSelectedImageURL]);

  useEffect(() => {
    setFirstItemIndex(START_INDEX);
    isLoadingMessages.current = false;
    setHasMoreMessages(true);
  }, [activeChannelId]);

  function isMessageConsecutive(current: Message, prev?: Message): boolean {
    if (!prev) return false;
    const isTimeExceeded =
      new Date(current.created_at).getTime() - new Date(prev.created_at).getTime() >=
      5 * 60 * 1000;
    const isDifferentSender = current.sender_id !== prev.sender_id;
    return !isTimeExceeded && !isDifferentSender;
  }

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

  return (
    <>
      {socket === null && (
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
      )}
      {selectedImageURL !== null && (
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
              onClick={() => downloadImage()}
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
      )}
      <main
        key={activeChannelId}
        className="flex flex-col gap-1 bg-surface-base text-text h-full w-full border p-3 border-stroke rounded-xl"
      >
        <div className="md:hidden flex flex-row items-center p-2 gap-4 bg-surface w-full rounded-lg border-stroke border-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Open in external tab"
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <HamburgerIcon className="text-text" />
          </button>
          <span className="text-lg font-bold">{activeChannel && activeChannel.name}</span>
        </div>
        <div className="flex flex-col h-full flex-1">
          {/*
          **A quick side-note about this:**
          As far as I'm concerned, building a scrollable message list is super hard.
          I think using Virtuoso is the best I can do right now. It's still super jittery, but whatever.
          If anyone reading this has an idea on how to fix this, then please open an issue and let me know!
          */}
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            firstItemIndex={firstItemIndex}
            alignToBottom={true}
            computeItemKey={(_index, message) => message.id}
            followOutput="auto"
            initialTopMostItemIndex={messages.length - 1}
            startReached={handleLoadOlderMessages}
            itemContent={(index, message) => {
              const arrayIndex = index - firstItemIndex;
              const prevMessage = messages[arrayIndex - 1];

              console.log(message.replied_message);

              return (
                <MessageItem
                  key={`message_${message.id}`}
                  message={message}
                  isConsecutive={isMessageConsecutive(message, prevMessage)}
                />
              );
            }
            }
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
        <ChatInput />
      </main>
    </>
  );
}
