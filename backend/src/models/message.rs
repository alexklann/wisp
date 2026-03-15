use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize)]
pub struct Message {
    pub id: String,
    pub channel_id: String,
    pub sender_id: String,
    pub content: Option<String>,
    pub message_type: String,
    pub edited_at: DateTime<Utc>,
    pub reply_to_id: String,
    pub is_deleted: u8,
    pub created_at: DateTime<Utc>,
}
