import { get } from "svelte/store";
import { writable } from "svelte/store";
import { AuthStore } from "./auth";
import { ConfigStore } from "./config";
import { goto } from "$app/navigation";

type ServerEvent =
  | {
      type: "message";
      id: number;
      channel_id: string;
      sender_id: string;
      sender_username: string;
      sender_display_name: string;
      sender_avatar_url: string | null;
      content: string | null;
      message_type: string;
      edited_at: string | null;
      reply_to_id: string | null;
      is_deleted: number;
      created_at: string;
    }
  | { type: "joinedChannel"; channel_id: string }
  | {
      type: "typingStart";
      channel_id: string;
      user_id: string;
      display_name: string;
    };

const handlers: {
  [K in ServerEvent["type"]]?: (
    event: Extract<ServerEvent, { type: K }>,
  ) => void;
} = {};

function on<K extends ServerEvent["type"]>(
  type: K,
  handler: (event: Extract<ServerEvent, { type: K }>) => void,
) {
  handlers[type] = handler as any;
}

function off<K extends ServerEvent["type"]>(
  type: K,
  handler: (event: Extract<ServerEvent, { type: K }>) => void,
) {
  if (handlers[type] === (handler as any)) {
    delete handlers[type];
  }
}

function createWsStore() {
  let socket: WebSocket | null = null;
  const connected = writable(false);
  const messages = writable<any[]>([]);

  async function connect() {
    const baseUrl = await ConfigStore.getApiUrl();
    const protocol = await ConfigStore.getApiProtocol("ws");
    const token = get(AuthStore.token);
    socket = new WebSocket(`${protocol}://${baseUrl}/ws?token=${token}`);

    socket.onopen = () => connected.set(true);
    socket.onclose = async (event) => {
      connected.set(false);
      if (event.code === 1008) {
        console.error(
          "WebSocket connection closed due to policy violation (invalid token)",
        );

        await AuthStore.clear();
        await goto("/settings");
      } else {
        console.error("WebSocket connection closed", event.reason);
      }
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as ServerEvent;
      const handler = handlers[data.type];
      if (handler) handler(data as any);
    };
  }

  function disconnect() {
    socket?.close();
    socket = null;
  }

  function send(data: object) {
    socket?.send(JSON.stringify(data));
  }

  function sendMessage(channelId: string, content: string) {
    send({
      type: "sendMessage",
      channel_id: channelId,
      content: content,
    });
  }

  function joinChannel(channelId: string) {
    send({
      type: "joinChannel",
      channel_id: channelId,
    });
  }

  function sendTyping(channelId: string) {
    send({
      type: "typingStart",
      channel_id: channelId,
    });
  }

  return {
    connected,
    messages,
    connect,
    disconnect,
    send,
    sendMessage,
    joinChannel,
    sendTyping,
    on,
    off,
  };
}

export const WsStore = createWsStore();
