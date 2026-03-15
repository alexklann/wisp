use axum::{
    extract::{
        Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use serde::Deserialize;
use shared::ClientEvent;
use sqlx::SqlitePool;

#[derive(Deserialize)]
pub struct WsQuery {
    token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(pool): State<SqlitePool>,
    Query(query): Query<WsQuery>,
) -> impl IntoResponse {
    // TODO: Validate token
    ws.on_upgrade(move |socket| handle_socket(socket, pool))
}

pub async fn handle_socket(mut socket: WebSocket, pool: SqlitePool) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            match serde_json::from_str::<ClientEvent>(&text) {
                Ok(event) => match event {
                    ClientEvent::Ping { content } => {
                        println!("Received ping with: {}", content);
                        let _ = socket.send(Message::Text("Pong".into())).await;
                    }
                    ClientEvent::SendMessage { room_id, content } => {
                        println!("Msg for {}: {}", room_id, content);
                    }
                    ClientEvent::JoinRoom { room_id } => {
                        println!("User joining room: {}", room_id);
                    }
                },
                Err(err) => {
                    eprintln!("Invalid JSON format: {}", err);
                    let _ = socket
                        .send(Message::Text(format!("Error: {}", err).into()))
                        .await;
                }
            }
        }
    }
}
