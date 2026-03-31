mod channel;
mod login;
mod message;
mod register;
mod server;
mod upload;
mod ws;

use std::sync::Arc;

use crate::{AppState, models::User};
use anyhow::Result;
use axum::{
    Router,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{delete, get, post},
};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize, Deserialize)]
pub struct Claims {
    sub: String,
    exp: usize,
}

pub fn generate_token(user: &User) -> Result<String> {
    let claims = Claims {
        sub: user.id.clone(),
        exp: (chrono::Utc::now() + chrono::Duration::days(90)).timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
    )
    .map_err(|e| anyhow::anyhow!(e))
}

pub async fn auth_middleware(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let decoded = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
        &Validation::default(),
    );

    let claims = match decoded {
        Ok(token_data) => token_data.claims,
        Err(e) => {
            eprintln!("Invalid token: {:?}", e);
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    req.extensions_mut().insert(claims.sub);
    Ok(next.run(req).await)
}

pub async fn health() -> impl IntoResponse {
    StatusCode::OK
}

pub fn router() -> Router<Arc<AppState>> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let public = Router::new()
        .route("/register", post(register::register))
        .route("/login", post(login::login))
        .route("/ws", get(ws::ws_handler))
        .route("/health", get(health));

    let protected = Router::new()
        .route("/servers", post(server::create_server))
        .route("/servers", get(server::get_servers))
        .route("/servers/{server_id}", get(server::get_server))
        .route("/servers/{server_id}/join", get(server::join_server))
        .route("/servers/{server_id}/members", get(server::get_members))
        .route(
            "/servers/{server_id}/channels",
            post(server::create_channel),
        )
        .route("/servers/{server_id}/channels", get(server::get_channels))
        .route(
            "/channels/{channel_id}/messages",
            get(channel::get_messages),
        )
        .route("/messages/{message_id}", delete(message::delete_message))
        .route("/upload", post(upload::upload_chunk))
        .route_layer(axum::middleware::from_fn(auth_middleware));

    Router::new().merge(public).merge(protected).layer(cors)
}
