use rusqlite::{params, Connection};
use tauri::Manager;

use crate::CredentialMetadata;

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
            encrypted_data BLOB NOT NULL,
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
        return Err(
            "Vault has already been initialized".to_string()
        );
    }

    let vek = crate::crypto::generate_vault_key();
    let salt = crate::crypto::generate_salt();

    let kek = crate::crypto::derive_kek(
        password,
        &salt,
    )?;

    let wrapped_vek =
        crate::crypto::wrap_vault_key(&kek, &vek)?;

    connection
        .execute(
            "INSERT INTO vault_metadata (
                id,
                salt,
                wrapped_vek
            ) VALUES (1, ?1, ?2)",
            params![
                salt.as_slice(),
                wrapped_vek,
            ],
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
            "SELECT
                salt,
                wrapped_vek
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

pub fn insert_credential(
    app: &tauri::AppHandle,
    credential: &CredentialMetadata,
    encrypted_data: &[u8],
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
            encrypted_data,
            created_at,
            updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            credential.id,
            credential.title,
            credential.provider,
            credential.credential_type,
            encrypted_data,
            credential.created_at,
            credential.updated_at,
        ],
    )?;

    Ok(())
}

pub fn get_credentials(
    app: &tauri::AppHandle,
) -> Result<
    Vec<(
        String,
        String,
        String,
        String,
        String,
        String,
        Vec<u8>,
    )>,
    Box<dyn std::error::Error>,
> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    let mut statement = connection.prepare(
        "SELECT
            id,
            title,
            provider,
            credential_type,
            created_at,
            updated_at,
            encrypted_data
         FROM credentials
         ORDER BY created_at DESC",
    )?;

    let credentials = statement
        .query_map([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        })?
        .collect::<Result<
            Vec<(
                String,
                String,
                String,
                String,
                String,
                String,
                Vec<u8>,
            )>,
            rusqlite::Error,
        >>()?;

    Ok(credentials)
}

pub fn update_credential(
    app: &tauri::AppHandle,
    credential: &CredentialMetadata,
    encrypted_data: &[u8],
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    let database_path = app_data_dir.join("vault.db");

    let connection = Connection::open(database_path)?;

    connection.execute(
        "UPDATE credentials
         SET
            title = ?1,
            provider = ?2,
            credential_type = ?3,
            encrypted_data = ?4,
            updated_at = ?5
         WHERE id = ?6",
        params![
            credential.title,
            credential.provider,
            credential.credential_type,
            encrypted_data,
            credential.updated_at,
            credential.id,
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