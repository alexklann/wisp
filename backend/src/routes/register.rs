use crate::{models::User, routes::generate_token};
use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use bcrypt::{DEFAULT_COST, hash};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RegisterRequestBody {
    username: String,
    display_name: String,
    password: String,
}

#[derive(Serialize)]
pub struct RegisterResponseBody {
    id: String,
    username: String,
    display_name: String,
    bio: Option<String>,
    avatar_url: Option<String>,
    created_at: DateTime<Utc>,
    token: String,
}

pub async fn register(
    State(pool): State<SqlitePool>,
    Json(payload): Json<RegisterRequestBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.username.is_empty() || payload.display_name.is_empty() || payload.password.len() < 8
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "invalid input" })),
        ));
    }

    let user_id = Uuid::new_v4().to_string();
    let hashed = hash(payload.password, DEFAULT_COST).map_err(|e| {
        eprintln!("Error hashing password: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "internal server error" })),
        )
    })?;

    sqlx::query(
        "INSERT INTO users (id, username, display_name, password_hash) VALUES (?, ?, ?, ?)",
    )
    .bind(&user_id)
    .bind(&payload.username)
    .bind(&payload.display_name)
    .bind(&hashed)
    .execute(&pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.is_unique_violation() {
                return (
                    StatusCode::CONFLICT,
                    Json(serde_json::json!({ "error": "username already exists" })),
                );
            }
        }
        eprintln!("Error creating user: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "internal server error" })),
        )
    })?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting user: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    let token = generate_token(&user).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "internal server error" })),
        )
    })?;

    Ok((
        StatusCode::CREATED,
        Json(RegisterResponseBody {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            token,
        }),
    ))
}
