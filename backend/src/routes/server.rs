use axum::{Extension, Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::Deserialize;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::models::Server;

#[derive(Deserialize)]
pub struct CreateServerRequestBody {
    name: String,
}

pub async fn create_server(
    State(pool): State<SqlitePool>,
    Extension(user_id): Extension<String>,
    Json(payload): Json<CreateServerRequestBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "invalid input" })),
        ));
    }

    let server_id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO servers (id, name, owner_id) VALUES (?, ?, ?)")
        .bind(&server_id)
        .bind(&payload.name)
        .bind(&user_id)
        .execute(&pool)
        .await
        .map_err(|e| {
            eprintln!("Error creating user: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    let server = sqlx::query_as::<_, Server>("SELECT * FROM servers WHERE id = ?")
        .bind(&server_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting server: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    sqlx::query("INSERT INTO server_members (server_id, user_id, role) VALUES (?, ?, ?)")
        .bind(&server_id)
        .bind(&user_id)
        .bind("owner")
        .execute(&pool)
        .await
        .map_err(|e| {
            eprintln!("Error creating server_member: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    Ok((StatusCode::CREATED, Json(server)))
}
