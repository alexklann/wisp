export default interface Message {
  id: number;
  channel_id: string;
  sender_id: string;
  sender_username: string;
  sender_display_name: string;
  content: string | null;
  message_type: string;
  edited_at: string;
  reply_to_id: string | null;
  is_deleted: number;
  created_at: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
