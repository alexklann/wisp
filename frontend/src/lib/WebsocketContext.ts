import { createContext } from "react";
import type { WebsocketMessage } from "../types/WebsocketMessage";

export interface WebsocketContextType {
  socket: WebSocket | null;
  subscribe: (callback: (msg: WebsocketMessage) => void) => () => void;
}

export const WebsocketContext = createContext<WebsocketContextType>({
  socket: null,
  subscribe: () => () => {},
});
