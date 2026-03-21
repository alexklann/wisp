use std::{collections::HashSet, sync::Arc};

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tokio::{
    self,
    sync::{Mutex, broadcast},
};

use crate::models::ChatMessage;

mod models;
mod routes;

#[derive(Clone, Serialize, Debug)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ServerEvent {
    Message(ChatMessage),
    JoinedChannel {
        channel_id: String,
    },
    TypingStart {
        channel_id: String,
        user_id: String,
        display_name: String,
    },
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ClientEvent {
    Ping,
    SendMessage { channel_id: String, content: String },
    JoinChannel { channel_id: String },
    TypingStart { channel_id: String },
}

struct AppState {
    user_set: Arc<Mutex<HashSet<String>>>,
    pool: SqlitePool,
    tx: broadcast::Sender<ServerEvent>,
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

    let exposed_port = std::env::var("EXPOSED_PORT").expect("EXPOSED_PORT must be set");
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", exposed_port))
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
