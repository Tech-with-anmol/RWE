mod search;
mod database;
mod migrations;
mod updater;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;
use migrations::MigrationRunner;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn create_database_connection() -> Result<Connection, rusqlite::Error> {
    let app_data_dir = std::env::var("APPDATA")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    
    let db_path = std::path::Path::new(&app_data_dir).join("rwe_data").join("main.db");
    
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    
    let conn = Connection::open(db_path)?;
    
    let migration_runner = MigrationRunner::new();
    migration_runner.run_migrations(&conn)
        .expect("Failed to run database migrations");
    
    Ok(conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let conn = create_database_connection()
                .expect("Failed to create database connection");
            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            search::search_content,
            database::init_database,
            database::create_conversation,
            database::get_conversations,
            database::get_conversations_paginated,
            database::get_conversations_count,
            database::get_conversation,
            database::delete_conversation,
            database::save_message,
            database::get_messages,
            database::update_conversation_notes,
            database::update_conversation_summary,
            database::get_mindmap_data,
            database::save_mindmap_data,
            database::get_conversation_analytics,
            database::backup_database,
            database::get_database_info,
            updater::get_app_version,
            updater::open_url,
            updater::get_data_directory,
            updater::export_user_data,
            updater::import_user_data,
            updater::prepare_for_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
