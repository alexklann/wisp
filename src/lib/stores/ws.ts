import { get } from "svelte/store";
import { writable } from "svelte/store";
import { AuthStore } from "./auth";

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
  | { type: "joinedChannel"; channel_id: string };

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

function createWsStore() {
  let socket: WebSocket | null = null;
  const connected = writable(false);
  const messages = writable<any[]>([]);

  function connect() {
    const token = get(AuthStore.token);
    socket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

    socket.onopen = () => connected.set(true);
    socket.onclose = () => connected.set(false);
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

  return {
    connected,
    messages,
    connect,
    disconnect,
    send,
    sendMessage,
    joinChannel,
    on,
  };
}

export const WsStore = createWsStore();
