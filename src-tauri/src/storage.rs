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

    connection.execute(
        "CREATE TABLE IF NOT EXISTS vault_metadata (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            salt BLOB NOT NULL,
            wrapped_vek BLOB NOT NULL
        )",
        [],
    )?;

    Ok(())
}

pub fn initialize_vault(
    app: &tauri::AppHandle,
    password: &str,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)
        .map_err(|error| error.to_string())?;

    let existing_vault: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM vault_metadata WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if existing_vault > 0 {
        return Err("Vault has already been initialized".to_string());
    }

    let vek = crate::crypto::generate_vault_key();
    let salt = crate::crypto::generate_salt();

    let kek = crate::crypto::derive_kek(password, &salt)?;

    let wrapped_vek =
        crate::crypto::wrap_vault_key(&kek, &vek)?;

    connection
        .execute(
            "INSERT INTO vault_metadata (
                id,
                salt,
                wrapped_vek
            ) VALUES (1, ?1, ?2)",
            params![salt.as_slice(), wrapped_vek],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn get_vault_metadata(
    app: &tauri::AppHandle,
) -> Result<(Vec<u8>, Vec<u8>), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)
        .map_err(|error| error.to_string())?;

    connection
        .query_row(
            "SELECT salt, wrapped_vek
             FROM vault_metadata
             WHERE id = 1",
            [],
            |row| {
                let salt: Vec<u8> = row.get(0)?;
                let wrapped_vek: Vec<u8> = row.get(1)?;

                Ok((salt, wrapped_vek))
            },
        )
        .map_err(|error| error.to_string())
}

pub fn is_vault_initialized(
    app: &tauri::AppHandle,
) -> Result<bool, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)
        .map_err(|error| error.to_string())?;

    let count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM vault_metadata WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    Ok(count > 0)
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

pub fn update_credential(
    app: &tauri::AppHandle,
    id: &str,
    credential: &CreateCredential,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    let now = chrono::Utc::now().to_rfc3339();
    let tags = serde_json::to_string(&credential.tags)?;

    connection.execute(
        "UPDATE credentials
         SET
            title = ?1,
            provider = ?2,
            credential_type = ?3,
            api_key = ?4,
            secret_key = ?5,
            notes = ?6,
            tags = ?7,
            updated_at = ?8
         WHERE id = ?9",
        params![
            credential.title,
            credential.provider,
            credential.credential_type,
            credential.api_key,
            credential.secret_key,
            credential.notes,
            tags,
            now,
            id,
        ],
    )?;

    Ok(())
}

pub fn delete_credential(
    app: &tauri::AppHandle,
    id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    connection.execute(
        "DELETE FROM credentials WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}