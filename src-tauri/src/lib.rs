use tauri::Manager;

mod crypto;
mod logger;
mod storage;
mod vault;

#[derive(serde::Serialize)]
pub struct Credential {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub credential_type: String,
    pub api_key: String,
    pub secret_key: Option<String>,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct CreateCredential {
    pub title: String,
    pub provider: String,
    pub credential_type: String,
    pub api_key: String,
    pub secret_key: Option<String>,
    pub notes: Option<String>,
    pub tags: Vec<String>,
}

pub struct CredentialMetadata {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub credential_type: String,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
fn initialize_vault(
    app: tauri::AppHandle,
    password: String,
) -> Result<String, String> {
    storage::initialize_vault(&app, &password)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn is_vault_initialized(
    app: tauri::AppHandle,
) -> Result<bool, String> {
    storage::is_vault_initialized(&app)
}

#[tauri::command]
fn get_auto_lock_seconds(
    app: tauri::AppHandle,
) -> Result<u64, String> {
    storage::get_auto_lock_seconds(&app)
}

#[tauri::command]
fn set_auto_lock_seconds(
    app: tauri::AppHandle,
    seconds: u64,
) -> Result<(), String> {
    storage::set_auto_lock_seconds(
        &app,
        seconds,
    )
}

#[tauri::command]
fn get_theme(
    app: tauri::AppHandle,
) -> Result<String, String> {
    storage::get_theme(&app)
}

#[tauri::command]
fn set_theme(
    app: tauri::AppHandle,
    theme: String,
) -> Result<(), String> {
    storage::set_theme(
        &app,
        &theme,
    )
}

#[tauri::command]
fn unlock_vault(
    app: tauri::AppHandle,
    password: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    let (
        salt,
        wrapped_vek,
        _recovery_salt,
        _recovery_wrapped_vek,
    ) = storage::get_vault_metadata(&app)?;

    let salt: [u8; 16] = salt
        .try_into()
        .map_err(|_| "Invalid vault salt".to_string())?;

    let kek = crypto::derive_kek(
        &password,
        &salt,
    )?;

    let vek = crypto::unwrap_vault_key(
        &kek,
        &wrapped_vek,
    )?;

    state.unlock(vek)?;

    Ok(())
}

#[tauri::command]
fn change_master_password(
    app: tauri::AppHandle,
    current_password: String,
    new_password: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    state.get_vek()?;

    if new_password.len() < 8 {
        return Err(
            "Master password must be at least 8 characters."
                .to_string(),
        );
    }

    let (
        salt,
        wrapped_vek,
        _recovery_salt,
        _recovery_wrapped_vek,
    ) = storage::get_vault_metadata(&app)?;

    let salt: [u8; 16] = salt
        .try_into()
        .map_err(|_| {
            "Invalid vault salt".to_string()
        })?;

    let current_kek =
        crypto::derive_kek(
            &current_password,
            &salt,
        )?;

    let vek =
        crypto::unwrap_vault_key(
            &current_kek,
            &wrapped_vek,
        )
        .map_err(|_| {
            "Current master password is incorrect."
                .to_string()
        })?;

    let new_salt =
        crypto::generate_salt();

    let new_kek =
        crypto::derive_kek(
            &new_password,
            &new_salt,
        )?;

    let new_wrapped_vek =
        crypto::wrap_vault_key(
            &new_kek,
            &vek,
        )?;

    storage::update_vault_password(
        &app,
        &new_salt,
        &new_wrapped_vek,
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn reset_master_password_with_recovery(
    app: tauri::AppHandle,
    recovery_key: String,
    new_password: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    if new_password.len() < 8 {
        return Err(
            "Master password must be at least 8 characters."
                .to_string(),
        );
    }

    let (
        _salt,
        _wrapped_vek,
        recovery_salt,
        recovery_wrapped_vek,
    ) = storage::get_vault_metadata(&app)?;

    let recovery_key_bytes =
        hex_to_bytes(&recovery_key)?;

    if recovery_key_bytes.len() != 32 {
        return Err(
            "Invalid recovery key".to_string()
        );
    }

    let recovery_key: [u8; 32] =
        recovery_key_bytes
            .try_into()
            .map_err(|_| {
                "Invalid recovery key".to_string()
            })?;

    let recovery_salt: [u8; 16] =
        recovery_salt
            .try_into()
            .map_err(|_| {
                "Invalid recovery salt".to_string()
            })?;

    let recovery_kek =
        crypto::derive_recovery_kek(
            &recovery_key,
            &recovery_salt,
        )?;

    let vek =
        crypto::unwrap_vault_key(
            &recovery_kek,
            &recovery_wrapped_vek,
        )
        .map_err(|_| {
            "Invalid recovery key".to_string()
        })?;

    let new_salt =
        crypto::generate_salt();

    let new_kek =
        crypto::derive_kek(
            &new_password,
            &new_salt,
        )?;

    let new_wrapped_vek =
        crypto::wrap_vault_key(
            &new_kek,
            &vek,
        )?;

    storage::update_vault_password(
        &app,
        &new_salt,
        &new_wrapped_vek,
    )
    .map_err(|error| error.to_string())?;

    state.unlock(vek)?;

    Ok(())
}

#[tauri::command]
fn recover_vault(
    app: tauri::AppHandle,
    recovery_key: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    let (
        _salt,
        _wrapped_vek,
        recovery_salt,
        recovery_wrapped_vek,
    ) = storage::get_vault_metadata(&app)?;

    let recovery_key_bytes =
        hex_to_bytes(&recovery_key)?;

    if recovery_key_bytes.len() != 32 {
        return Err(
            "Invalid recovery key".to_string()
        );
    }

    let recovery_key: [u8; 32] =
        recovery_key_bytes
            .try_into()
            .map_err(|_| {
                "Invalid recovery key".to_string()
            })?;

    let recovery_salt: [u8; 16] =
        recovery_salt
            .try_into()
            .map_err(|_| {
                "Invalid recovery salt".to_string()
            })?;

    let recovery_kek =
        crypto::derive_recovery_kek(
            &recovery_key,
            &recovery_salt,
        )?;

    let vek =
        crypto::unwrap_vault_key(
            &recovery_kek,
            &recovery_wrapped_vek,
        )?;

    state.unlock(vek)?;

    Ok(())
}

fn hex_to_bytes(value: &str) -> Result<Vec<u8>, String> {
    if value.len() % 2 != 0 {
        return Err(
            "Invalid recovery key".to_string()
        );
    }

    let mut bytes = Vec::with_capacity(
        value.len() / 2
    );

    let characters: Vec<char> =
        value.chars().collect();

    for index in (0..characters.len()).step_by(2) {
        let high = characters[index]
            .to_digit(16)
            .ok_or_else(|| {
                "Invalid recovery key".to_string()
            })?;

        let low = characters[index + 1]
            .to_digit(16)
            .ok_or_else(|| {
                "Invalid recovery key".to_string()
            })?;

        bytes.push(
            ((high << 4) | low) as u8
        );
    }

    Ok(bytes)
}

#[tauri::command]
fn lock_vault(
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    state.lock()
}

#[tauri::command]
fn is_vault_unlocked(
    state: tauri::State<'_, vault::VaultState>,
) -> Result<bool, String> {
    state.is_unlocked()
}

#[tauri::command]
fn create_credential(
    app: tauri::AppHandle,
    credential: CreateCredential,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    let vek = state.get_vek()?;

    let id = uuid::Uuid::new_v4().to_string();

    let encrypted_data =
        crypto::encrypt_credential(
            &vek,
            &id,
            &credential,
        )?;

    let now = chrono::Utc::now().to_rfc3339();

    let metadata = CredentialMetadata {
        id,
        title: credential.title.clone(),
        provider: credential.provider.clone(),
        credential_type: credential.credential_type.clone(),
        created_at: now.clone(),
        updated_at: now,
    };

    storage::insert_credential(
        &app,
        &metadata,
        &encrypted_data,
    )
    .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!(
            "Credential saved: {}",
            metadata.title
        ),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_credentials(
    app: tauri::AppHandle,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<Vec<Credential>, String> {
    let vek = state.get_vek()?;

    let stored_credentials =
        storage::get_credentials(&app)
            .map_err(|error| error.to_string())?;

    let mut credentials = Vec::new();

    for (
        id,
        title,
        provider,
        credential_type,
        created_at,
        updated_at,
        encrypted_data,
    ) in stored_credentials
    {
        let decrypted =
            crypto::decrypt_credential(
                &vek,
                &id,
                &encrypted_data,
            )
            .map_err(|error| {
                format!(
                    "Failed to decrypt credential {id}: {error}"
                )
            })?;

        credentials.push(Credential {
            id,
            title,
            provider,
            credential_type,
            api_key: decrypted.api_key,
            secret_key: decrypted.secret_key,
            notes: decrypted.notes,
            tags: decrypted.tags,
            created_at,
            updated_at,
        });
    }

    Ok(credentials)
}

#[tauri::command]
fn update_credential(
    app: tauri::AppHandle,
    id: String,
    credential: CreateCredential,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    let vek = state.get_vek()?;

    let encrypted_data =
        crypto::encrypt_credential(
            &vek,
            &id,
            &credential,
        )?;

    let now = chrono::Utc::now().to_rfc3339();

    let metadata = CredentialMetadata {
        id,
        title: credential.title.clone(),
        provider: credential.provider.clone(),
        credential_type: credential.credential_type.clone(),
        created_at: String::new(),
        updated_at: now,
    };

    storage::update_credential(
        &app,
        &metadata,
        &encrypted_data,
    )
    .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!(
            "Credential updated: {}",
            metadata.title
        ),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_credential(
    app: tauri::AppHandle,
    id: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    state.get_vek()?;

    storage::delete_credential(&app, &id)
        .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!(
            "Credential deleted: {}",
            id
        ),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn generate_new_recovery_key(
    app: tauri::AppHandle,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<String, String> {
    let vek = state.get_vek()?;

    let recovery_key =
        crypto::generate_recovery_key();

    let recovery_salt =
        crypto::generate_salt();

    let recovery_kek =
        crypto::derive_recovery_kek(
            &recovery_key,
            &recovery_salt,
        )?;

    let recovery_wrapped_vek =
        crypto::wrap_vault_key(
            &recovery_kek,
            &vek,
        )?;

    storage::update_vault_recovery(
        &app,
        &recovery_salt,
        &recovery_wrapped_vek,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(vault::VaultState::new())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect(
                    "failed to get app data directory"
                );

            std::fs::create_dir_all(&app_data_dir)
                .expect(
                    "failed to create app data directory"
                );

            logger::log(
                &app_data_dir,
                "INFO",
                "KeyVault started",
            )
            .expect(
                "failed to write startup log"
            );

            storage::initialize_database(
                app.handle()
            )
            .expect(
                "failed to initialize database"
            );

            logger::log(
                &app_data_dir,
                "INFO",
                "Database initialized",
            )
            .expect(
                "failed to write database log"
            );

            Ok(())
        })
        .invoke_handler(
            tauri::generate_handler![
                initialize_vault,
                is_vault_initialized,
                unlock_vault,
                change_master_password,
                reset_master_password_with_recovery,
                recover_vault,
                get_auto_lock_seconds,
                set_auto_lock_seconds,
                get_theme,
                set_theme,
                lock_vault,
                is_vault_unlocked,
                create_credential,
                update_credential,
                delete_credential,
                get_credentials,
                generate_new_recovery_key
            ]
        )
        .run(
            tauri::generate_context!()
        )
        .expect(
            "error while running tauri application"
        );
}
