mod search;
mod database;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

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
    
    // Create tables
    conn.execute("
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            summary TEXT,
            notes TEXT
        )
    ", [])?;
    
    conn.execute("
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            seq INTEGER NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        )
    ", [])?;
    
    conn.execute("
        CREATE TABLE IF NOT EXISTS mindmaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL UNIQUE,
            title TEXT NOT NULL,
            nodes TEXT NOT NULL,
            connections TEXT NOT NULL,
            theme TEXT DEFAULT 'default',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        )
    ", [])?;
    
    // Create indexes for performance
    conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_seq ON messages(seq)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mindmaps_conversation ON mindmaps(conversation_id)", [])?;
    
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
            database::get_conversation,
            database::delete_conversation,
            database::save_message,
            database::get_messages,
            database::update_conversation_notes,
            database::update_conversation_summary,
            database::get_mindmap_data,
            database::save_mindmap_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
