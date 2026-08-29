import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WebsocketContext } from "./WebsocketContext";
import type { WebsocketMessage } from "../types/WebsocketMessage";
import { useAuthStore } from "../stores/useAuthStore";
import type Message from "../types/message";
import { useChatStore } from "../stores/useChatStore";
import NotificationSound from "../notification.mp3";
import useSound from "use-sound";

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [playNotification] = useSound(NotificationSound);

  const user = useAuthStore((state) => state.user);

  const addMessage = useChatStore((state) => state.addMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const editMessage = useChatStore((state) => state.editMessage);

  const attempts = useRef(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const reconnectTimeout = useRef<number | null>(null);

  const token = useAuthStore((store) => store.token);

  const subscribers = useRef<Set<(msg: WebsocketMessage) => void>>(new Set());

  const subscribe = useCallback((callback: (msg: WebsocketMessage) => void) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  }, []);

  const getNotificationBody = (message: Message): string => {
    if (message.content && message.content.trim().length > 0) {
      return message.content;
    }

    if (message.attachments && message.attachments.length > 0) {
      return "Sent an attachment"
    }

    return "Sent a message";
  };

  useEffect(() => {
    const connect = () => {
      console.log(
        `Attempting to connect WebSocket to backend server; attempt: [${attempts.current}] / delay: [${Math.min(1000 * 2 ** attempts.current, 10000)}]`,
      );
      const ws = new WebSocket(
        `${import.meta.env.VITE_BACKEND_URL}/ws?token=${token}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Successfully connected WebSocket to backend server");
        setSocket(ws);
        attempts.current = 0;
        setAttemptCount(0);

        const { activeChannelId, setMessages } = useChatStore.getState();
        if (activeChannelId) {
          ws.send(
            JSON.stringify({
              type: "joinChannel",
              channel_id: activeChannelId,
            }),
          );

          if (token) {
            fetch(
              `${import.meta.env.VITE_BACKEND_URL}/channels/${activeChannelId}/messages/?offset=0&limit=150`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            )
              .then((response) => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error("Could not fetch messages");
              })
              .then((messages) => {
                setMessages(messages);
              })
              .catch((err) => {
                console.error("Failed to refetch messages on reconnect:", err);
              });
          }
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        subscribers.current.forEach((callback) => callback(data));
        switch (data.type) {
          case "message": {
            const messageData = data as Message;

            if (!document.hasFocus() && messageData.sender_id !== user?.id) {
              playNotification();
              Notification.requestPermission().then((perm: string) => {
                if (perm === "granted") {
                  const notification = new Notification(
                    messageData.sender_display_name,
                    {
                      body: getNotificationBody(messageData),
                    },
                  );

                  setTimeout(() => {
                    notification.close();
                  }, 4000);
                }
              });
            }

            addMessage(messageData);
            break;
          }
          case "message_deleted": {
            deleteMessage(data.message_id);
            break;
          }
          case "message_edited": {
            editMessage(data.message_id, data.message_content);
            break;
          }
        }
      };

      ws.onclose = () => {
        setSocket(null);

        const delay = Math.min(1000 * 2 ** attempts.current, 10000);
        attempts.current += 1;
        setAttemptCount(attempts.current);

        if (attempts.current > 10) {
          return;
        }

        console.log("WebSocket connection closed. Trying to reconnect...");

        reconnectTimeout.current = setTimeout(connect, delay);
      };

      ws.onerror = (err: Event) => {
        console.log(`WS Error: ${err}`);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [
    token,
    addMessage,
    deleteMessage,
    editMessage,
    playNotification,
    user?.id,
  ]);

  return (
    <WebsocketContext.Provider value={{ socket, subscribe, attemptCount }}>
      {children}
    </WebsocketContext.Provider>
  );
}
