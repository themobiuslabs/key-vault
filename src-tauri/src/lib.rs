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
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_credential() -> Credential {
    Credential {
        id: String::from("default-id"),
        title: String::from("API Key"),
        provider: String::from("OpenAI"),
        credential_type: String::from("API Key"),
        api_key: String::from("not-displayed"),
        secret_key: None,
        notes: None,
        tags: vec![],
        created_at: String::from("2026-09-01"),
        updated_at: String::from("2026-09-01"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            storage::initialize_database(app.handle())
                .expect("failed to initialize database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![create_credential])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
