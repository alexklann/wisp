mod register;

use anyhow::Result;
use axum::{Router, routing::post};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use jsonwebtoken::{EncodingKey, Header, encode};

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

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/register", post(register::register))
}
