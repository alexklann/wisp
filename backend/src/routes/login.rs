use std::sync::Arc;

use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use bcrypt::verify;
use serde::{Deserialize, Serialize};

use crate::{AppState, models::User, routes::generate_token};

#[derive(Deserialize)]
pub struct LoginRequestBody {
    username: String,
    password: String,
}

#[derive(Serialize)]
pub struct LoginResponseBody {
    token: String,
}

pub async fn login(
    State(app_state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequestBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.username.is_empty() || payload.password.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "invalid input" })),
        ));
    }

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ?")
        .bind(&payload.username)
        .fetch_one(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting user: {:?}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(
                    serde_json::json!({ "error": "username does not exist or password is wrong" }),
                ),
            )
        })?;

    let valid = verify(payload.password, &user.password_hash).map_err(|e| {
        eprintln!("Error verifying password: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "internal server error" })),
        )
    })?;

    if !valid {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "username does not exist or password is wrong" })),
        ));
    }

    let token = generate_token(&user).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "internal server error" })),
        )
    })?;

    Ok((StatusCode::OK, Json(LoginResponseBody { token })))
}
