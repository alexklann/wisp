use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize)]
pub struct ServerMember {
    pub id: String,
    pub server_id: String,
    pub user_id: String,
    pub role: String,
    pub joined_at: DateTime<Utc>,
}
