use tauri::Manager;

mod logger;
mod storage;

#[derive(serde::Serialize)]
struct Credential {
    id: String,
    title: String,
    provider: String,
    credential_type: String,
    api_key: String,
    secret_key: Option<String>,
    notes: Option<String>,
    tags: Vec<String>,
    created_at: String,
    updated_at: String,
}

#[derive(serde::Deserialize)]
struct CreateCredential {
    title: String,
    provider: String,
    credential_type: String,
    api_key: String,
    secret_key: Option<String>,
    notes: Option<String>,
    tags: Vec<String>,
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
        .invoke_handler(tauri::generate_handler![create_credential])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}