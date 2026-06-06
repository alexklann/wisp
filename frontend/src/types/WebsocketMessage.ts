export interface WebsocketMessageSender {
  uuid: string;
  username: string;
}

export type WebsocketMessage =
  | {
      type: "sendMessage";
      channel_id: string;
      content: string;
      attachment_ids: string[];
    }
  | {
      type: "typingStart";
      channel_id: string;
      user_id: string;
      display_name: string;
    }
  | {
      type: "joinChannel";
      channel_id: string;
    };
