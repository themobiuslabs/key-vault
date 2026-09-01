use rusqlite::Connection;
use tauri::Manager;

pub fn initialize_database(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;

    std::fs::create_dir_all(&app_data_dir)?;

    let database_path = app_data_dir.join("vault.db");

    println!("Database path: {:?}", database_path);

    let connection = Connection::open(database_path)?;

    connection.execute(
        "CREATE TABLE IF NOT EXISTS credentials (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            provider TEXT NOT NULL,
            credential_type TEXT NOT NULL,
            api_key TEXT NOT NULL,
            secret_key TEXT,
            notes TEXT,
            tags TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    Ok(())
}

pub fn insert_test_credential(
    app: &tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    connection.execute(
        "INSERT INTO credentials (
            id,
            title,
            provider,
            credential_type,
            api_key,
            secret_key,
            notes,
            tags,
            created_at,
            updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            "test-id-1",
            "My OpenAI Key",
            "OpenAI",
            "API Key",
            "test-api-key",
            Option::<String>::None,
            "Test credential",
            "[\"development\", \"test\"]",
            "2026-09-01",
            "2026-09-01",
        ],
    )?;

    Ok(())
}

pub fn insert_credential(
    app: &tauri::AppHandle,
    credential: &crate::CreateCredential,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    connection.execute(
        "INSERT INTO credentials (
            id,
            title,
            provider,
            credential_type,
            api_key,
            secret_key,
            notes,
            tags,
            created_at,
            updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            uuid::Uuid::new_v4().to_string(),
            credential.title,
            credential.provider,
            credential.credential_type,
            credential.api_key,
            credential.secret_key,
            credential.notes,
            serde_json::to_string(&credential.tags)?,
            chrono::Utc::now().to_rfc3339(),
            chrono::Utc::now().to_rfc3339(),
        ],
    )?;

    Ok(())
}