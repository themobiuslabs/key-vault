use rusqlite::{params, Connection};
use tauri::Manager;

use crate::{Credential, CreateCredential};

pub fn initialize_database(
    app: &tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;

    std::fs::create_dir_all(&app_data_dir)?;

    let database_path = app_data_dir.join("vault.db");

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

pub fn insert_credential(
    app: &tauri::AppHandle,
    credential: &CreateCredential,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let tags = serde_json::to_string(&credential.tags)?;

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
        params![
            id,
            credential.title,
            credential.provider,
            credential.credential_type,
            credential.api_key,
            credential.secret_key,
            credential.notes,
            tags,
            now,
            now,
        ],
    )?;

    Ok(())
}

pub fn get_credentials(
    app: &tauri::AppHandle,
) -> Result<Vec<Credential>, Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    let mut statement = connection.prepare(
        "SELECT
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
         FROM credentials
         ORDER BY created_at DESC",
    )?;

    let credentials = statement
        .query_map([], |row| {
            let tags_json: String = row.get(7)?;

            let tags: Vec<String> =
                serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(Credential {
                id: row.get(0)?,
                title: row.get(1)?,
                provider: row.get(2)?,
                credential_type: row.get(3)?,
                api_key: row.get(4)?,
                secret_key: row.get(5)?,
                notes: row.get(6)?,
                tags,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<Credential>, rusqlite::Error>>()?;

    Ok(credentials)
}