use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize, Clone, Debug)]
pub struct ChatMessage {
    pub id: u64,
    pub channel_id: String,
    pub sender_id: String,
    pub sender_username: String,
    pub sender_display_name: String,
    pub sender_avatar_url: Option<String>,
    pub content: Option<String>,
    pub message_type: String,
    pub edited_at: Option<DateTime<Utc>>,
    pub reply_to_id: Option<String>,
    pub is_deleted: u8,
    pub created_at: DateTime<Utc>,
}
