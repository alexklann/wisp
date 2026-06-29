import { useEffect, useMemo, useRef, useState } from "react";
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

const START_INDEX = 1_000_000;

export default function ChatInterface() {
  const messages = useChatStore((state) => state.messages);
  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const { socket, attemptCount } = useWebsocket();

  const setIsSidebarOpen = useUIStore((state) => state.setIsSidebarOpen);

  const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null);
  const [selectedImageFilename, setSelectedImageFilename] = useState<
    string | null
  >(null);

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

  const groupedMessages = useMemo(() => {
    const groups: Message[][] = [];
    let currentGroup: Message[] = [];

    for (const msg of messages) {
      if (currentGroup.length === 0) {
        currentGroup.push(msg);
        continue;
      }
      const lastMsg = currentGroup[currentGroup.length - 1];

      const isTimeExceeded =
        new Date(msg.created_at).getTime() -
          new Date(lastMsg.created_at).getTime() >=
        5 * 60 * 1000;
      const isDifferentSender = msg.sender_id !== lastMsg.sender_id;

      if (isTimeExceeded || currentGroup.length >= 10 || isDifferentSender) {
        groups.push(currentGroup);
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }, [messages]);

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
  }, [selectedImageURL]);

  return (
    <>
      {socket === null && (
        <div className="flex justify-center items-center absolute h-screen w-screen inset-0 bg-black/50 z-50">
          {attemptCount <= 10 ? (
            <span className="text-center text-white font-bold text-4xl">
              Connection lost, reconnecting...
              <br />
              Attempt: {attemptCount} / 10
            </span>
          ) : (
            <span className="text-white font-bold text-4xl">
              Failed to reconnect within 10 attempts
            </span>
          )}
        </div>
      )}
      {selectedImageURL !== null && (
        <div
          onClick={() => setSelectedImageURL(null)}
          className="flex justify-center items-center absolute inset-0 z-90 bg-black/70 p-12"
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
            className="max-w-full max-h-full object-contain"
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
          <span className="text-lg font-bold">Channel Name</span>
        </div>
        <div className="flex flex-col h-full overflow-y-auto">
          <Virtuoso
            ref={virtuosoRef}
            data={groupedMessages}
            firstItemIndex={START_INDEX}
            followOutput={"smooth"}
            initialTopMostItemIndex={START_INDEX - 1}
            alignToBottom={true}
            startReached={() =>
              console.log("Start reached; implement loading later!")
            }
            itemContent={(_index, group) =>
              group.map((message: Message, idx: number) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  setSelectedImageURL={setSelectedImageURL}
                  setSelectedImageFilename={setSelectedImageFilename}
                  isConsecutive={idx > 0}
                />
              ))
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
