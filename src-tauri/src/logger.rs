use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;

pub fn log(
    log_directory: &Path,
    level: &str,
    message: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_path = log_directory.join("keyvault.log");

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)?;

    let timestamp = chrono::Utc::now().to_rfc3339();

    writeln!(file, "{} [{}] {}", timestamp, level, message)?;

    Ok(())
}