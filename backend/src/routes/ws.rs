use axum::{
    extract::{
        Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::StatusCode,
    response::IntoResponse,
};
use jsonwebtoken::{DecodingKey, Validation, decode};
use serde::Deserialize;
use shared::ClientEvent;
use sqlx::SqlitePool;

use crate::routes::Claims;

#[derive(Deserialize)]
pub struct WsQuery {
    token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(pool): State<SqlitePool>,
    Query(query): Query<WsQuery>,
) -> impl IntoResponse {
    let decoded = decode::<Claims>(
        &query.token,
        &DecodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
        &Validation::default(),
    );

    let claims = match decoded {
        Ok(token_data) => token_data.claims,
        Err(e) => {
            eprintln!("Invalid token: {:?}", e);
            return (StatusCode::UNAUTHORIZED, "invalid token").into_response();
        }
    };

    ws.on_upgrade(move |socket| handle_socket(socket, pool, claims.sub))
}

pub async fn handle_socket(mut socket: WebSocket, _pool: SqlitePool, user_id: String) {
    println!("User connected: {}", user_id);

    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            match serde_json::from_str::<ClientEvent>(&text) {
                Ok(event) => match event {
                    ClientEvent::Ping { content } => {
                        println!("Received ping with: {}", content);
                        let _ = socket.send(Message::Text("Pong".into())).await;
                    }
                    ClientEvent::SendMessage { room_id, content } => {
                        println!("User: {} | Msg for {}: {}", user_id, room_id, content);
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

    println!("User disconnected: {}", user_id);
}
