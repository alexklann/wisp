use axum::{
    Json,
    extract::{Multipart, State},
    http::StatusCode,
    response::IntoResponse,
};
use std::path::Path;
use std::sync::Arc;
use tokio::fs;
use tokio::io::AsyncWriteExt;

use crate::AppState;

pub async fn upload_chunk(
    State(app_state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let mut upload_id = String::new();
    let mut chunk_number: i32 = 0;
    let mut total_chunks: i32 = 0;
    let mut chunk_data = Vec::new();
    let mut file_name = String::new();

    while let Some(field) = multipart.next_field().await.map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Invalid multipart data"})),
        )
    })? {
        let name = field.name().unwrap_or_default().to_string();
        match name.as_str() {
            "uploadId" => upload_id = field.text().await.unwrap_or_default(),
            "fileName" => file_name = field.text().await.unwrap_or_default(),
            "chunkNumber" => {
                chunk_number = field.text().await.unwrap_or_default().parse().unwrap_or(0)
            }
            "totalChunks" => {
                total_chunks = field.text().await.unwrap_or_default().parse().unwrap_or(0)
            }
            "chunk" => chunk_data = field.bytes().await.unwrap_or_default().to_vec(),
            _ => {}
        }
    }

    if upload_id.is_empty() || chunk_data.is_empty() || total_chunks == 0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Missing required fields"})),
        ));
    }

    let temp_dir = Path::new("uploads/tmp").join(&upload_id);
    fs::create_dir_all(&temp_dir).await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to create temp dir"})),
        )
    })?;

    let chunk_path = temp_dir.join(format!("{}.part", chunk_number));

    fs::write(&chunk_path, chunk_data).await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to save chunk"})),
        )
    })?;

    if is_upload_complete(&temp_dir, total_chunks).await {
        assemble_file(&temp_dir, &file_name, total_chunks)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Assembly failed"})),
                )
            })?;

        return Ok((
            StatusCode::OK,
            Json(serde_json::json!({"status": "complete"})),
        ));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({"status": "chunk_received", "chunk": chunk_number})),
    ))
}

async fn is_upload_complete(temp_dir: &Path, total_chunks: i32) -> bool {
    for i in 1..=total_chunks {
        if !temp_dir.join(format!("{}.part", i)).exists() {
            return false;
        }
    }
    true
}

async fn assemble_file(
    temp_dir: &Path,
    file_name: &str,
    total_chunks: i32,
) -> tokio::io::Result<()> {
    let final_path = Path::new("uploads/files").join(file_name);

    let mut final_file = fs::File::create(final_path).await?;

    for i in 1..=total_chunks {
        let chunk_path = temp_dir.join(format!("{}.part", i));
        let chunk_content = fs::read(&chunk_path).await?;
        final_file.write_all(&chunk_content).await?;
    }

    fs::remove_dir_all(temp_dir).await?;
    Ok(())
}
