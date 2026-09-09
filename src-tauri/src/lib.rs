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

#[tauri::command]
fn initialize_vault(
    app: tauri::AppHandle,
    password: String,
) -> Result<(), String> {
    storage::initialize_vault(&app, &password)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn unlock_vault(
    app: tauri::AppHandle,
    password: String,
    state: tauri::State<'_, vault::VaultState>,
) -> Result<(), String> {
    let (salt, wrapped_vek) =
        storage::get_vault_metadata(&app)?;

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
fn is_vault_initialized(
    app: tauri::AppHandle,
) -> Result<bool, String> {
    storage::is_vault_initialized(&app)
}

#[tauri::command]
fn create_credential(
    app: tauri::AppHandle,
    credential: CreateCredential,
) -> Result<(), String> {
    storage::insert_credential(&app, &credential)
        .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!("Credential saved: {}", credential.title),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
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
fn update_credential(
    app: tauri::AppHandle,
    id: String,
    credential: CreateCredential,
) -> Result<(), String> {
    storage::update_credential(&app, &id, &credential)
        .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!("Credential updated: {}", credential.title),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_credential(
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    storage::delete_credential(&app, &id)
        .map_err(|error| error.to_string())?;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    logger::log(
        &app_data_dir,
        "INFO",
        &format!("Credential deleted: {}", id),
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_credentials(
    app: tauri::AppHandle,
) -> Result<Vec<Credential>, String> {
    storage::get_credentials(&app)
        .map_err(|error| error.to_string())
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
                .expect("failed to get app data directory");

            std::fs::create_dir_all(&app_data_dir)
                .expect("failed to create app data directory");

            logger::log(&app_data_dir, "INFO", "KeyVault started")
                .expect("failed to write startup log");

            storage::initialize_database(app.handle())
                .expect("failed to initialize database");

            logger::log(&app_data_dir, "INFO", "Database initialized")
                .expect("failed to write database log");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            initialize_vault,
            is_vault_initialized,
            unlock_vault,
            lock_vault,
            is_vault_unlocked,
            create_credential,
            update_credential,
            delete_credential,
            get_credentials
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}