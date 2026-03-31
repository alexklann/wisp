use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize)]
pub struct Server {
    pub id: String,
    pub name: String,
    pub owner_id: String,
    pub icon_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct ServerWithMembership {
    pub id: String,
    pub name: String,
    pub icon_url: Option<String>,
    pub role: String,
    pub joined_at: String,
}
