use std::sync::Arc;

use axum::{
    extract::{
        Query, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::StatusCode,
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt, stream::SplitSink};
use jsonwebtoken::{DecodingKey, Validation, decode};
use serde::Deserialize;
use shared::ClientEvent;

use crate::{AppState, ChatMessage, routes::Claims};

#[derive(Deserialize)]
pub struct WsQuery {
    token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(app_state): State<Arc<AppState>>,
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

    ws.on_upgrade(move |socket| handle_socket(socket, app_state, claims.sub))
}

pub async fn handle_event(
    event: ClientEvent,
    sender: &mut SplitSink<WebSocket, Message>,
    user_id: &str,
    app_state: &Arc<AppState>,
) {
    match event {
        ClientEvent::Ping => {
            println!("Received ping from {}", user_id);
            let _ = sender.send(Message::Text("Pong".into())).await;
        }
        ClientEvent::SendMessage {
            channel_id,
            content,
        } => {
            if let Err(e) = sqlx::query(
                "INSERT INTO messages (channel_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)"
            )
            .bind(&channel_id)
            .bind(user_id)
            .bind(&content)
            .bind("text")
            .execute(&app_state.pool)
            .await
            {
                eprintln!("Error creating message: {:?}", e);
                return;
            }

            if let Err(e) = app_state.tx.send(ChatMessage {
                channel_id,
                sender_id: user_id.to_string(),
                content,
            }) {
                eprintln!("Error broadcasting message: {:?}", e);
                return;
            }
        }
        ClientEvent::JoinChannel { channel_id } => {
            println!("User {} joining room: {}", user_id, channel_id);
            todo!()
        }
    }
}

pub async fn handle_socket(socket: WebSocket, app_state: Arc<AppState>, user_id: String) {
    println!("User connected: {}", user_id);

    let (mut sender, mut receiver) = socket.split();
    let mut rx = app_state.tx.subscribe();

    app_state.user_set.lock().await.insert(user_id.clone());

    loop {
        tokio::select! {
            msg = receiver.next() => {
                if let Some(Ok(Message::Text(text))) = msg {
                    match serde_json::from_str::<ClientEvent>(&text) {
                        Ok(event) => handle_event(event, &mut sender, &user_id, &app_state).await,
                        Err(e) => {
                            eprintln!("Invalid JSON: {}", e);
                        }
                    }
                } else {
                    break;
                }
            }

            Ok(chat_msg) = rx.recv() => {
                let json = serde_json::to_string(&chat_msg).unwrap();
                if sender.send(Message::Text(json.into())).await.is_err() {
                    break; // client disconnected
                }
            }
        }
    }

    app_state.user_set.lock().await.remove(&user_id);
    println!("User disconnected: {}", user_id);
}
