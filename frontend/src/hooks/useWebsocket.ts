import { useContext } from "react";
import { WebsocketContext } from "../lib/WebsocketContext";

export const useWebsocket = () => {
  const context = useContext(WebsocketContext);
  return context;
};
