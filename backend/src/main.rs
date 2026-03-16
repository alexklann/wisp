use std::{collections::HashSet, sync::Arc};

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tokio::{
    self,
    sync::{Mutex, broadcast},
};

mod models;
mod routes;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ChatMessage {
    pub channel_id: String,
    pub sender_id: String,
    pub content: String,
}

struct AppState {
    user_set: Arc<Mutex<HashSet<String>>>,
    pool: SqlitePool,
    tx: broadcast::Sender<ChatMessage>,
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = SqlitePool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let user_set = Arc::new(Mutex::new(HashSet::new()));
    let (tx, _rx) = broadcast::channel(100);

    let app_state = Arc::new(AppState { user_set, pool, tx });

    let app = routes::router().with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
