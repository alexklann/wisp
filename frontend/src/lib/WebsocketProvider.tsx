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

  const token = useAuthStore((store) => store.token);

  const subscribers = useRef<Set<(msg: WebsocketMessage) => void>>(new Set());

  const subscribe = useCallback((callback: (msg: WebsocketMessage) => void) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  }, []);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(
        `${import.meta.env.VITE_BACKEND_URL}/ws?token=${token}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setSocket(ws);
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
                      body: messageData.content ?? "No content",
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
      };

      ws.onerror = (err) => {
        console.log(`WS Error: ${err}`);
        ws.close();
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [token]);

  return (
    <WebsocketContext.Provider value={{ socket, subscribe }}>
      {children}
    </WebsocketContext.Provider>
  );
}
