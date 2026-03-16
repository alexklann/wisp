use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    AppState,
    models::{Channel, Server, ServerMember},
};

#[derive(Deserialize)]
pub struct CreateServerRequestBody {
    name: String,
}

pub async fn create_server(
    State(app_state): State<Arc<AppState>>,
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
        .execute(&app_state.pool)
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
        .fetch_one(&app_state.pool)
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
        .execute(&app_state.pool)
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

pub async fn get_servers(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let servers =
        sqlx::query_as::<_, ServerMember>("SELECT * FROM server_members WHERE user_id = ?")
            .bind(&user_id)
            .fetch_all(&app_state.pool)
            .await
            .map_err(|e| {
                eprintln!("Error selecting server_members: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "internal server error" })),
                )
            })?;

    Ok((StatusCode::CREATED, Json(servers)))
}

pub async fn get_server(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Path(server_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query_as::<_, ServerMember>(
        "SELECT * FROM server_members WHERE user_id = ? AND server_id = ?",
    )
    .bind(&user_id)
    .bind(&server_id)
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

    let server = sqlx::query_as::<_, Server>("SELECT * FROM servers WHERE id = ?")
        .bind(&server_id)
        .fetch_all(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting server: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    Ok((StatusCode::CREATED, Json(server)))
}

#[derive(Deserialize)]
pub struct CreateChannelRequestBody {
    name: String,
}

pub async fn create_channel(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Path(server_id): Path<String>,
    Json(payload): Json<CreateChannelRequestBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if payload.name.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "invalid input" })),
        ));
    }

    eprintln!(
        "Looking for user_id: {} in server_id: {}",
        user_id, server_id
    );

    let server_member = sqlx::query_as::<_, ServerMember>(
        "SELECT * FROM server_members WHERE user_id = ? AND server_id = ?",
    )
    .bind(&user_id)
    .bind(&server_id)
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

    if server_member.role == "member" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "error": "insufficient permissions" })),
        ));
    }

    let channel_id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO channels (id, name, server_id) VALUES (?, ?, ?)")
        .bind(&channel_id)
        .bind(&payload.name)
        .bind(&server_id)
        .execute(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error creating channel: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    let channel = sqlx::query_as::<_, Channel>("SELECT * FROM channels WHERE id = ?")
        .bind(&channel_id)
        .fetch_one(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting channel: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    Ok((StatusCode::CREATED, Json(channel)))
}

pub async fn get_channels(
    State(app_state): State<Arc<AppState>>,
    Extension(user_id): Extension<String>,
    Path(server_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query_as::<_, ServerMember>(
        "SELECT * FROM server_members WHERE user_id = ? AND server_id = ?",
    )
    .bind(&user_id)
    .bind(&server_id)
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

    let channels = sqlx::query_as::<_, Channel>("SELECT * FROM channels WHERE server_id = ?")
        .bind(&server_id)
        .fetch_all(&app_state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error selecting server: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "internal server error" })),
            )
        })?;

    Ok((StatusCode::CREATED, Json(channels)))
}
