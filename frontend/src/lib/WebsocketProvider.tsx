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

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addMessage = useChatStore((state) => state.addMessage);

  const token = useAuthStore((store) => store.token);

  const subscribers = useRef<Set<(msg: WebsocketMessage) => void>>(new Set());

  const subscribe = useCallback((callback: (msg: WebsocketMessage) => void) => {
    subscribers.current.add(callback);
    return () => subscribers.current.delete(callback);
  }, []);

  useEffect(() => {
    const connect = () => {
      console.log("Connecting to Server with Websocket");
      const ws = new WebSocket(
        `${import.meta.env.VITE_BACKEND_URL}/ws?token=${token}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Successfully connected to server");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        console.log("Received websocket message from server");
        const data = JSON.parse(event.data);
        console.log(data);
        subscribers.current.forEach((callback) => callback(data));
        switch (data.type) {
          case "message": {
            const messageData = data as Message;
            addMessage(messageData);
          }
        }
      };

      ws.onclose = () => {
        console.log("Closing websocket connection");
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
