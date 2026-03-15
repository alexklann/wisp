mod login;
mod register;
mod server;
mod ws;

use anyhow::Result;
use axum::{
    Router,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
    routing::{get, post},
};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::models::User;

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

pub fn router() -> Router<SqlitePool> {
    let public = Router::new()
        .route("/register", post(register::register))
        .route("/login", post(login::login))
        .route("/ws", get(ws::ws_handler));

    let protected = Router::new()
        .route("/server", post(server::create_server))
        .route_layer(axum::middleware::from_fn(auth_middleware));

    Router::new().merge(public).merge(protected)
}
