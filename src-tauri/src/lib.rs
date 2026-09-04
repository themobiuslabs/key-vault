use tauri::Manager;

mod logger;
mod storage;

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

#[derive(serde::Deserialize)]
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
fn get_credentials(
    app: tauri::AppHandle,
) -> Result<Vec<Credential>, String> {
    storage::get_credentials(&app)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            create_credential,
            get_credentials
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}