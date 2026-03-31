use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

use crate::{AppState, models::ChatMessage};

pub async fn delete_message(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Path(message_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let message = sqlx::query_as::<_, ChatMessage>("SELECT * FROM messages WHERE id = ?")
        .bind(&message_id)
        .fetch_one(&app_state.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "error": "row not found" })),
            ),
            _ => {
                eprintln!("Error selecting channel: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "internal server error" })),
                )
            }
        })?;

    if &user_id != &message.sender_id {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "insufficient permissions" })),
        ));
    }

    Ok((StatusCode::OK, Json(message)))
}
