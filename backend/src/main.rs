use sqlx::SqlitePool;
use tokio;

mod models;
mod routes;

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = SqlitePool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let app = routes::router().with_state(pool);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
