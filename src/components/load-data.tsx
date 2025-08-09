import Database from "@tauri-apps/plugin-sql";

export interface Conversation {
    id: number;
    name: string;
    created_at: string;
    summary: string;
    notes?: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'ai';
    content: string;
    seq: number;
}

let conversationDb: Database | null = null;
let messageDb: Database | null = null;

export async function initDatabase() {
    try {
        const mainDb = await Database.load("sqlite:main.db");
        conversationDb = mainDb;
        messageDb = mainDb;

        await conversationDb.execute(`CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            summary TEXT NOT NULL DEFAULT '',
            notes TEXT DEFAULT ''
        );`);
        
        await messageDb.execute(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
            content TEXT NOT NULL,
            seq INTEGER NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
        );`);

        await messageDb.execute(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq 
                                ON messages(conversation_id, seq);`);

        const convCheck = await conversationDb.select("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'") as any[];
        const msgCheck = await messageDb.select("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'") as any[];
        
        if (convCheck.length === 0 || msgCheck.length === 0) {
            throw new Error("Failed to create database tables");
        }
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
    }
}

export async function createConversation(name: string, summary: string, notes?: string): Promise<number> {
    if (!conversationDb) throw new Error("Database not initialized");
    
    const result = await conversationDb.execute(
        "INSERT INTO conversations (name, summary, notes) VALUES (?, ?, ?)",
        [name, summary, notes || ""]
    );
    if (result.lastInsertId === undefined) {
        throw new Error("Failed to create conversation");
    }
    return result.lastInsertId;
}

export async function getConversations(): Promise<Conversation[]> {
    if (!conversationDb) throw new Error("Conversation database not initialized");
    
    try {
        const result = await conversationDb.select<Conversation[]>(
            "SELECT * FROM conversations ORDER BY created_at DESC"
        );
        return result;
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export async function getConversation(conversationId: number): Promise<Conversation | null> {
    if (!conversationDb) throw new Error("Conversation database not initialized");
    
    try {
        const result = await conversationDb.select<Conversation[]>(
            "SELECT * FROM conversations WHERE id = ?",
            [conversationId]
        );
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return null;
    }
}

export async function saveMessage(conversationId: number, role: 'user' | 'ai', content: string): Promise<void> {
    if (!messageDb) throw new Error("Message database not initialized");
    
    const timestamp = Date.now();
    
    try {
        await messageDb.execute(
            "INSERT INTO messages (conversation_id, role, content, seq) VALUES (?, ?, ?, ?)",
            [conversationId, role, content, timestamp]
        );
    } catch (error) {
        console.error("Error saving message:", error);
        throw error;
    }
}

export async function getMessages(conversationId: number): Promise<Message[]> {
    if (!messageDb) throw new Error("Message database not initialized");
    
    try {
        const result = await messageDb.select<Message[]>(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY seq ASC",
            [conversationId]
        );
        
        return result;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

export async function updateConversationNotes(conversationId: number, notes: string): Promise<void> {
    if (!conversationDb) throw new Error("Database not initialized");
    
    await conversationDb.execute(
        "UPDATE conversations SET notes = ? WHERE id = ?",
        [notes, conversationId]
    );
}

export async function updateConversationSummary(conversationId: number, summary: string): Promise<void> {
    if (!conversationDb) throw new Error("Database not initialized");
    
    await conversationDb.execute(
        "UPDATE conversations SET summary = ? WHERE id = ?",
        [summary, conversationId]
    );
}

export async function deleteConversation(conversationId: number): Promise<void> {
    if (!conversationDb || !messageDb) throw new Error("Database not initialized");
    
    await messageDb.execute("DELETE FROM messages WHERE conversation_id = ?", [conversationId]);
    await conversationDb.execute("DELETE FROM conversations WHERE id = ?", [conversationId]);
}

export async function loadData() {
    return initDatabase();
}
