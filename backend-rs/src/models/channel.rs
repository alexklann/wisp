use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize)]
pub struct Channel {
    pub id: String,
    pub name: String,
    pub server_id: String,
    pub created_at: DateTime<Utc>,
}
