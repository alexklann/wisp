import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import { useWebsocket } from "./useWebsocket";
import type { WebsocketMessage } from "../types/WebsocketMessage";
import { useChatStore } from "../stores/useChatStore";

const HEARTBEAT_INTERVAL = 2000;
const TYPING_TIMEOUT = HEARTBEAT_INTERVAL + 500;

export function useTyping() {
  const { socket, subscribe } = useWebsocket();
  const user = useAuthStore((state) => state.user);

  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const lastTypingSent = useRef<number>(0);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (socket && user && now - lastTypingSent.current > HEARTBEAT_INTERVAL) {
      socket.send(
        JSON.stringify({
          type: "typingStart",
          channel_id: activeChannelId,
        }),
      );
      lastTypingSent.current = now;
    }
  }, [socket, user, activeChannelId]);

  useEffect(() => {
    if (!socket || !user) return;

    const unsubscribe = subscribe((message: WebsocketMessage) => {
      if (message.type === "typingStart" && message.user_id) {
        if (message.display_name && message.user_id !== user.id) {
          setTypingUsers((prev) => ({
            ...prev,
            [message.display_name]: Date.now(),
          }));
        }
      }
    });
    return unsubscribe;
  }, [socket, user, subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };

        for (const [username, timestamp] of Object.entries(next)) {
          if (now - timestamp > TYPING_TIMEOUT) {
            delete next[username];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const typingUsernames = Object.keys(typingUsers);

  return { typingUsernames, notifyTyping };
}
