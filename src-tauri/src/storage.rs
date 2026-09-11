use rusqlite::{
    params,
    Connection,
    OptionalExtension,
};
use tauri::Manager;

use crate::CredentialMetadata;

const CURRENT_SCHEMA_VERSION: i32 = 2;
const DEFAULT_AUTO_LOCK_SECONDS: &str = "600";
const DEFAULT_THEME: &str = "system";

fn open_database(
    app: &tauri::AppHandle,
) -> Result<Connection, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path =
        app_data_dir.join("vault.db");

    Connection::open(database_path)
        .map_err(|error| error.to_string())
}

fn get_schema_version(
    connection: &Connection,
) -> Result<i32, rusqlite::Error> {
    connection.query_row(
        "PRAGMA user_version",
        [],
        |row| row.get(0),
    )
}

fn set_schema_version(
    connection: &Connection,
    version: i32,
) -> Result<(), rusqlite::Error> {
    connection.execute(
        &format!(
            "PRAGMA user_version = {version}"
        ),
        [],
    )?;

    Ok(())
}

fn migrate_to_v1(
    connection: &rusqlite::Transaction<'_>,
) -> Result<(), rusqlite::Error> {
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
            wrapped_vek BLOB NOT NULL,
            recovery_salt BLOB NOT NULL,
            recovery_wrapped_vek BLOB NOT NULL
        )",
        [],
    )?;

    set_schema_version(
        connection,
        1,
    )?;

    Ok(())
}

fn migrate_to_v2(
    connection: &rusqlite::Transaction<'_>,
) -> Result<(), rusqlite::Error> {
    connection.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    connection.execute(
        "INSERT OR IGNORE INTO settings (
            key,
            value
        ) VALUES (
            'auto_lock_seconds',
            ?1
        )",
        params![DEFAULT_AUTO_LOCK_SECONDS],
    )?;

    set_schema_version(
        connection,
        2,
    )?;

    Ok(())
}

fn migrate_database(
    connection: &mut Connection,
    current_version: i32,
) -> Result<(), Box<dyn std::error::Error>> {
    if current_version > CURRENT_SCHEMA_VERSION {
        return Err(
            format!(
                "Database schema version {current_version} is newer than supported version {CURRENT_SCHEMA_VERSION}"
            )
            .into(),
        );
    }

    let transaction =
        connection.transaction()?;

    if current_version < 1 {
        migrate_to_v1(
            &transaction,
        )?;
    }

    if current_version < 2 {
        migrate_to_v2(
            &transaction,
        )?;
    }

    transaction.commit()?;

    Ok(())
}

fn initialize_default_settings(
    connection: &Connection,
) -> Result<(), rusqlite::Error> {
    connection.execute(
        "INSERT OR IGNORE INTO settings (
            key,
            value
        ) VALUES (
            'auto_lock_seconds',
            ?1
        )",
        params![DEFAULT_AUTO_LOCK_SECONDS],
    )?;

    connection.execute(
        "INSERT OR IGNORE INTO settings (
            key,
            value
        ) VALUES (
            'theme',
            ?1
        )",
        params![DEFAULT_THEME],
    )?;

    Ok(())
}

fn is_valid_theme(theme: &str) -> bool {
    matches!(
        theme,
        "system" | "light" | "dark"
    )
}

pub fn initialize_database(
    app: &tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir =
        app.path().app_data_dir()?;

    std::fs::create_dir_all(
        &app_data_dir
    )?;

    let database_path =
        app_data_dir.join("vault.db");

    let mut connection =
        Connection::open(database_path)?;

    let schema_version =
        get_schema_version(&connection)?;

    migrate_database(
        &mut connection,
        schema_version,
    )?;

    initialize_default_settings(
        &connection
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

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)
            .map_err(|error| error.to_string())?;

    let count: i64 = connection
        .query_row(
            "SELECT COUNT(*)
             FROM vault_metadata
             WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    Ok(count > 0)
}

pub fn initialize_vault(
    app: &tauri::AppHandle,
    password: &str,
) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)
            .map_err(|error| error.to_string())?;

    let existing_vault: i64 = connection
        .query_row(
            "SELECT COUNT(*)
             FROM vault_metadata
             WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if existing_vault > 0 {
        return Err(
            "Vault has already been initialized"
                .to_string(),
        );
    }

    let vek =
        crate::crypto::generate_vault_key();

    let salt =
        crate::crypto::generate_salt();

    let kek =
        crate::crypto::derive_kek(
            password,
            &salt,
        )?;

    let wrapped_vek =
        crate::crypto::wrap_vault_key(
            &kek,
            &vek,
        )?;

    let recovery_key =
        crate::crypto::generate_recovery_key();

    let recovery_salt =
        crate::crypto::generate_salt();

    let recovery_kek =
        crate::crypto::derive_recovery_kek(
            &recovery_key,
            &recovery_salt,
        )?;

    let recovery_wrapped_vek =
        crate::crypto::wrap_vault_key(
            &recovery_kek,
            &vek,
        )?;

    connection
        .execute(
            "INSERT INTO vault_metadata (
                id,
                salt,
                wrapped_vek,
                recovery_salt,
                recovery_wrapped_vek
            ) VALUES (1, ?1, ?2, ?3, ?4)",
            params![
                salt.as_slice(),
                wrapped_vek,
                recovery_salt.as_slice(),
                recovery_wrapped_vek,
            ],
        )
        .map_err(|error| error.to_string())?;

    let recovery_key_hex =
        recovery_key
            .iter()
            .map(|byte| {
                format!("{byte:02x}")
            })
            .collect::<String>();

    Ok(recovery_key_hex)
}

pub fn get_vault_metadata(
    app: &tauri::AppHandle,
) -> Result<
    (
        Vec<u8>,
        Vec<u8>,
        Vec<u8>,
        Vec<u8>,
    ),
    String,
> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)
            .map_err(|error| error.to_string())?;

    connection
        .query_row(
            "SELECT
                salt,
                wrapped_vek,
                recovery_salt,
                recovery_wrapped_vek
             FROM vault_metadata
             WHERE id = 1",
            [],
            |row| {
                let salt: Vec<u8> =
                    row.get(0)?;

                let wrapped_vek: Vec<u8> =
                    row.get(1)?;

                let recovery_salt: Vec<u8> =
                    row.get(2)?;

                let recovery_wrapped_vek:
                    Vec<u8> = row.get(3)?;

                Ok((
                    salt,
                    wrapped_vek,
                    recovery_salt,
                    recovery_wrapped_vek,
                ))
            },
        )
        .map_err(|error| error.to_string())
}

pub fn update_vault_password(
    app: &tauri::AppHandle,
    salt: &[u8; 16],
    wrapped_vek: &[u8],
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

    let updated_rows = connection.execute(
        "UPDATE vault_metadata
         SET
            salt = ?1,
            wrapped_vek = ?2
         WHERE id = 1",
        params![
            salt.as_slice(),
            wrapped_vek,
        ],
    )?;

    if updated_rows != 1 {
        return Err(
            "Failed to update vault password"
                .into()
        );
    }

    Ok(())
}

pub fn update_vault_recovery(
    app: &tauri::AppHandle,
    recovery_salt: &[u8; 16],
    recovery_wrapped_vek: &[u8],
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

    let updated_rows = connection.execute(
        "UPDATE vault_metadata
         SET
            recovery_salt = ?1,
            recovery_wrapped_vek = ?2
         WHERE id = 1",
        params![
            recovery_salt.as_slice(),
            recovery_wrapped_vek,
        ],
    )?;

    if updated_rows != 1 {
        return Err(
            "Failed to update vault recovery key"
                .into()
        );
    }

    Ok(())
}

pub fn get_auto_lock_seconds(
    app: &tauri::AppHandle,
) -> Result<u64, String> {
    let connection =
        open_database(app)?;

    let value: String = connection
        .query_row(
            "SELECT value
             FROM settings
             WHERE key = 'auto_lock_seconds'",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    value
        .parse::<u64>()
        .map_err(|_| {
            "Invalid auto-lock setting"
                .to_string()
        })
}

pub fn set_auto_lock_seconds(
    app: &tauri::AppHandle,
    seconds: u64,
) -> Result<(), String> {
    let connection =
        open_database(app)?;

    connection
        .execute(
            "INSERT INTO settings (
                key,
                value
            ) VALUES (
                'auto_lock_seconds',
                ?1
            )
            ON CONFLICT(key)
            DO UPDATE SET value = excluded.value",
            params![seconds.to_string()],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn get_theme(
    app: &tauri::AppHandle,
) -> Result<String, String> {
    let connection =
        open_database(app)?;

    let theme = connection
        .query_row(
            "SELECT value
             FROM settings
             WHERE key = 'theme'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .unwrap_or_else(|| {
            DEFAULT_THEME.to_string()
        });

    if !is_valid_theme(&theme) {
        return Err(
            "Invalid theme setting".to_string()
        );
    }

    Ok(theme)
}

pub fn set_theme(
    app: &tauri::AppHandle,
    theme: &str,
) -> Result<(), String> {
    if !is_valid_theme(theme) {
        return Err(
            "Invalid theme setting".to_string()
        );
    }

    let connection =
        open_database(app)?;

    connection
        .execute(
            "INSERT INTO settings (
                key,
                value
            ) VALUES (
                'theme',
                ?1
            )
            ON CONFLICT(key)
            DO UPDATE SET value = excluded.value",
            params![theme],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn insert_credential(
    app: &tauri::AppHandle,
    credential: &CredentialMetadata,
    encrypted_data: &[u8],
) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

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
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

    let mut statement =
        connection.prepare(
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
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

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
    let app_data_dir =
        app.path().app_data_dir()?;

    let database_path =
        app_data_dir.join("vault.db");

    let connection =
        Connection::open(database_path)?;

    connection.execute(
        "DELETE FROM credentials
         WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}