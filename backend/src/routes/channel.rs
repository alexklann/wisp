use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

use crate::{
    AppState,
    models::{Channel, Message, ServerMember},
};

pub async fn get_messages(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Path(channel_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let channel = sqlx::query_as::<_, Channel>("SELECT * FROM channels WHERE id = ?")
        .bind(&channel_id)
        .fetch_one(&app_state.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "insufficient permissions" })),
            ),
            _ => {
                eprintln!("Error selecting channel: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "internal server error" })),
                )
            }
        })?;

    sqlx::query_as::<_, ServerMember>(
        "SELECT * FROM server_members WHERE user_id = ? AND server_id = ?",
    )
    .bind(&user_id)
    .bind(&channel.server_id)
    .fetch_one(&app_state.pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "error": "insufficient permissions" })),
        ),
        _ => {
            eprintln!("Error selecting server_member: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        }
    })?;

    let messages = sqlx::query_as::<_, Message>("SELECT * FROM messages WHERE channel_id = ?")
        .bind(&channel_id)
        .fetch_all(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting server: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    Ok((StatusCode::OK, Json(messages)))
}
