use serde::{Deserialize, Serialize};
use tauri::{command, State};
use rusqlite::{Connection};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct Conversation {
    pub id: i64,
    pub name: String,
    pub created_at: String,
    pub summary: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub conversation_id: i64,
    pub role: String,
    pub content: String,
    pub seq: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MindMapData {
    pub id: i64,
    pub conversation_id: i64,
    pub title: String,
    pub nodes: String,
    pub connections: String,
    pub theme: String,
    pub created_at: String,
    pub updated_at: String,
}

type DbConnection = Mutex<Connection>;

#[command]
pub async fn init_database(db: State<'_, DbConnection>) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    match conn.query_row("SELECT 1", [], |_row| Ok(())) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Database check failed: {}", e)),
    }
}

#[command]
pub async fn create_conversation(
    name: String,
    summary: String,
    db: State<'_, DbConnection>,
) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    match conn.execute(
        "INSERT INTO conversations (name, summary) VALUES (?1, ?2)",
        [&name, &summary],
    ) {
        Ok(_) => Ok(conn.last_insert_rowid()),
        Err(e) => Err(format!("Insert conversation error: {}", e)),
    }
}

#[command]
pub async fn get_conversations(db: State<'_, DbConnection>) -> Result<Vec<Conversation>, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut stmt = conn.prepare("SELECT id, name, created_at, summary, notes FROM conversations ORDER BY created_at DESC")
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    let conversation_iter = stmt.query_map([], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            summary: row.get(3)?,
            notes: row.get(4)?,
        })
    }).map_err(|e| format!("Query error: {}", e))?;
    
    let mut conversations = Vec::new();
    for conversation in conversation_iter {
        conversations.push(conversation.map_err(|e| format!("Row error: {}", e))?);
    }
    
    Ok(conversations)
}

#[command]
pub async fn get_conversation(
    conversation_id: i64,
    db: State<'_, DbConnection>,
) -> Result<Option<Conversation>, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut stmt = conn.prepare("SELECT id, name, created_at, summary, notes FROM conversations WHERE id = ?1")
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    match stmt.query_row([conversation_id], |row| {
        Ok(Conversation {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            summary: row.get(3)?,
            notes: row.get(4)?,
        })
    }) {
        Ok(conversation) => Ok(Some(conversation)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Query error: {}", e)),
    }
}

#[command]
pub async fn delete_conversation(
    conversation_id: i64,
    db: State<'_, DbConnection>,
) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    conn.execute("DELETE FROM messages WHERE conversation_id = ?1", [conversation_id])
        .map_err(|e| format!("Delete messages error: {}", e))?;
    
    conn.execute("DELETE FROM mindmaps WHERE conversation_id = ?1", [conversation_id])
        .map_err(|e| format!("Delete mindmaps error: {}", e))?;
    
    let affected = conn.execute("DELETE FROM conversations WHERE id = ?1", [conversation_id])
        .map_err(|e| format!("Delete conversation error: {}", e))?;
    
    Ok(affected > 0)
}

#[command]
pub async fn save_message(
    conversation_id: i64,
    role: String,
    content: String,
    db: State<'_, DbConnection>,
) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let seq = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    
    match conn.execute(
        "INSERT INTO messages (conversation_id, role, content, seq) VALUES (?1, ?2, ?3, ?4)",
        [&conversation_id.to_string(), &role, &content, &seq.to_string()],
    ) {
        Ok(_) => Ok(conn.last_insert_rowid()),
        Err(e) => Err(format!("Insert message error: {}", e)),
    }
}

#[command]
pub async fn get_messages(
    conversation_id: i64,
    db: State<'_, DbConnection>,
) -> Result<Vec<Message>, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut stmt = conn.prepare("SELECT id, conversation_id, role, content, seq FROM messages WHERE conversation_id = ?1 ORDER BY seq ASC")
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    let message_iter = stmt.query_map([conversation_id], |row| {
        Ok(Message {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            seq: row.get(4)?,
        })
    }).map_err(|e| format!("Query error: {}", e))?;
    
    let mut messages = Vec::new();
    for message in message_iter {
        messages.push(message.map_err(|e| format!("Row error: {}", e))?);
    }
    
    Ok(messages)
}

#[command]
pub async fn update_conversation_notes(
    conversation_id: i64,
    notes: String,
    db: State<'_, DbConnection>,
) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affected = conn.execute(
        "UPDATE conversations SET notes = ?1 WHERE id = ?2",
        [&notes, &conversation_id.to_string()],
    ).map_err(|e| format!("Update notes error: {}", e))?;
    
    Ok(affected > 0)
}

#[command]
pub async fn update_conversation_summary(
    conversation_id: i64,
    summary: String,
    db: State<'_, DbConnection>,
) -> Result<bool, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affected = conn.execute(
        "UPDATE conversations SET summary = ?1 WHERE id = ?2",
        [&summary, &conversation_id.to_string()],
    ).map_err(|e| format!("Update summary error: {}", e))?;
    
    Ok(affected > 0)
}

#[command]
pub async fn get_mindmap_data(
    conversation_id: i64,
    db: State<'_, DbConnection>,
) -> Result<Option<MindMapData>, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut stmt = conn.prepare("SELECT id, conversation_id, title, nodes, connections, theme, created_at, updated_at FROM mindmaps WHERE conversation_id = ?1")
        .map_err(|e| format!("Prepare error: {}", e))?;
    
    match stmt.query_row([conversation_id], |row| {
        Ok(MindMapData {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            title: row.get(2)?,
            nodes: row.get(3)?,
            connections: row.get(4)?,
            theme: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }) {
        Ok(mindmap) => Ok(Some(mindmap)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Query error: {}", e)),
    }
}

#[command]
pub async fn save_mindmap_data(
    conversation_id: i64,
    title: String,
    nodes: String,
    connections: String,
    theme: String,
    db: State<'_, DbConnection>,
) -> Result<i64, String> {
    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let existing: Result<i64, rusqlite::Error> = conn.query_row(
        "SELECT id FROM mindmaps WHERE conversation_id = ?1",
        [conversation_id],
        |row| row.get(0),
    );
    
    match existing {
        Ok(mindmap_id) => {
            conn.execute(
                "UPDATE mindmaps SET title = ?1, nodes = ?2, connections = ?3, theme = ?4, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?5",
                [&title, &nodes, &connections, &theme, &conversation_id.to_string()],
            ).map_err(|e| format!("Update mindmap error: {}", e))?;
            Ok(mindmap_id)
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            conn.execute(
                "INSERT INTO mindmaps (conversation_id, title, nodes, connections, theme) VALUES (?1, ?2, ?3, ?4, ?5)",
                [&conversation_id.to_string(), &title, &nodes, &connections, &theme],
            ).map_err(|e| format!("Insert mindmap error: {}", e))?;
            Ok(conn.last_insert_rowid())
        }
        Err(e) => Err(format!("Query error: {}", e)),
    }
}
