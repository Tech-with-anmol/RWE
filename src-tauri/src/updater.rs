use tauri::command;
use std::path::PathBuf;

fn get_app_data_dir() -> String {
    std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string())
}

fn get_rwe_data_dir() -> PathBuf {
    std::path::Path::new(&get_app_data_dir()).join("rwe_data")
}

#[command]
pub async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[command] 
pub async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    
    Ok(())
}

#[command]
pub async fn get_data_directory() -> Result<String, String> {
    let data_path = get_rwe_data_dir();
    Ok(data_path.to_string_lossy().to_string())
}

#[command]
pub async fn export_user_data() -> Result<String, String> {
    let source_dir = get_rwe_data_dir();
    let desktop_dir = std::path::Path::new(&get_app_data_dir()).join("Desktop");
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let export_path = desktop_dir.join(format!("RWE_Export_{}.db", timestamp));
    
    if !source_dir.exists() {
        return Err("No data directory found".to_string());
    }
    
    let db_path = source_dir.join("main.db");
    if !db_path.exists() {
        return Err("No database found".to_string());
    }
    
    std::fs::copy(&db_path, &export_path)
        .map_err(|e| format!("Failed to export data: {}", e))?;
    
    Ok(export_path.to_string_lossy().to_string())
}

#[command]
pub async fn import_user_data(import_path: String) -> Result<bool, String> {
    let data_dir = get_rwe_data_dir();
    let target_path = data_dir.join("main.db");
    
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;
    
    let backup_path = data_dir.join("backups").join(format!("pre_import_backup_{}.db", 
        chrono::Utc::now().format("%Y%m%d_%H%M%S")));
    
    if target_path.exists() {
        std::fs::create_dir_all(backup_path.parent().unwrap())
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
        std::fs::copy(&target_path, &backup_path)
            .map_err(|e| format!("Failed to backup existing data: {}", e))?;
    }
    
    std::fs::copy(&import_path, &target_path)
        .map_err(|e| format!("Failed to import data: {}", e))?;
    
    Ok(true)
}

#[command]
pub async fn prepare_for_update() -> Result<String, String> {
    let data_dir = get_rwe_data_dir();
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_path = data_dir.join("backups").join(format!("pre_update_backup_{}.db", timestamp));
    let source_path = data_dir.join("main.db");
    
    if !source_path.exists() {
        return Err("No database found to backup".to_string());
    }
    
    std::fs::create_dir_all(backup_path.parent().unwrap())
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    
    std::fs::copy(&source_path, &backup_path)
        .map_err(|e| format!("Failed to create pre-update backup: {}", e))?;
    
    Ok(backup_path.to_string_lossy().to_string())
}
