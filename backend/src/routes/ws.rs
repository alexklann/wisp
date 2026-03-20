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

use crate::{
    AppState, ServerEvent,
    models::{Channel, MessageWithSender, ServerMember},
    routes::Claims,
};

// Required parameters on WS instatiation
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
    current_channel: &mut Option<String>,
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
            let result = sqlx::query(
                "INSERT INTO messages (channel_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)"
            )
            .bind(&channel_id)
            .bind(user_id)
            .bind(&content)
            .bind("text")
            .execute(&app_state.pool)
            .await;

            let last_insert_id = match result {
                Ok(r) => r.last_insert_rowid(),
                Err(e) => {
                    eprintln!("Error creating message: {:?}", e);
                    return;
                }
            };

            // JOIN statement to populate MessageWithSender
            let message = match sqlx::query_as::<_, MessageWithSender>(
                "SELECT m.*, u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar_url
                 FROM messages m JOIN users u ON m.sender_id = u.id
                 WHERE m.id = ?"
            )
            .bind(last_insert_id)
            .fetch_one(&app_state.pool)
            .await {
                Ok(m) => m,
                Err(e) => {
                    eprintln!("Error fetching message: {:?}", e);
                    return;
                }
            };

            if let Err(e) = app_state.tx.send(ServerEvent::Message(message)) {
                eprintln!("Error broadcasting message: {:?}", e);
                return;
            }
        }
        ClientEvent::JoinChannel { channel_id } => {
            // Check if the channel exists
            let channel = match sqlx::query_as::<_, Channel>("SELECT * FROM channels WHERE id = ?")
                .bind(&channel_id)
                .fetch_one(&app_state.pool)
                .await
            {
                Ok(channel) => channel,
                Err(sqlx::Error::RowNotFound) => {
                    eprintln!("Channel {} not found", channel_id);
                    return;
                }
                Err(e) => {
                    eprintln!("DB error: {:?}", e);
                    return;
                }
            };

            // Check if user is part of the server
            match sqlx::query_as::<_, ServerMember>(
                "SELECT * FROM server_members WHERE user_id = ? AND server_id = ?",
            )
            .bind(user_id)
            .bind(&channel.server_id)
            .fetch_one(&app_state.pool)
            .await
            {
                Ok(_) => {}
                Err(sqlx::Error::RowNotFound) => {
                    eprintln!(
                        "User {} is not a member of server {}",
                        user_id, channel.server_id
                    );
                    return;
                }
                Err(e) => {
                    eprintln!("DB error: {:?}", e);
                    return;
                }
            }

            println!("User {} joining room: {}", user_id, &channel_id);

            // Reply to joinChannel request to let the User know that it worked
            let _ = sender
                .send(Message::Text(
                    serde_json::to_string(&ServerEvent::JoinedChannel {
                        channel_id: channel_id.clone(),
                    })
                    .unwrap()
                    .into(),
                ))
                .await;

            *current_channel = Some(channel_id);
        }
    }
}

pub async fn handle_socket(socket: WebSocket, app_state: Arc<AppState>, user_id: String) {
    println!("User connected: {}", user_id);

    let (mut sender, mut receiver) = socket.split();
    let mut rx = app_state.tx.subscribe();

    app_state.user_set.lock().await.insert(user_id.clone());

    let mut current_channel: Option<String> = None;

    loop {
        tokio::select! {
            // Outgoing client event from this cliet
            msg = receiver.next() => {
                if let Some(Ok(Message::Text(text))) = msg {
                    match serde_json::from_str::<ClientEvent>(&text) {
                        Ok(event) => handle_event(event, &mut sender, &user_id, &app_state, &mut current_channel).await,
                        Err(e) => {
                            eprintln!("Invalid JSON: {}", e);
                        }
                    }
                } else {
                    break;
                }
            }

            // Incoming server event from any client
            Ok(event) = rx.recv() => {
                match &event {
                    ServerEvent::Message(msg) => {
                        if Some(&msg.channel_id) == current_channel.as_ref() {
                            let json = serde_json::to_string(&event).unwrap();
                            if sender.send(Message::Text(json.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    app_state.user_set.lock().await.remove(&user_id);
    println!("User disconnected: {}", user_id);
}
