import { invoke } from "@tauri-apps/api/core";

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

export interface MindMapData {
    id: number;
    conversation_id: number;
    title: string;
    nodes: string;
    connections: string;
    theme: string;
    created_at: string;
    updated_at: string;
}

export async function initDatabase(): Promise<boolean> {
    return await invoke("init_database");
}

export async function createConversation(name: string, summary: string): Promise<number> {
    return await invoke("create_conversation", { name, summary });
}

export async function getConversations(): Promise<Conversation[]> {
    return await invoke("get_conversations");
}

export async function getConversationsPaginated(limit: number, offset: number): Promise<Conversation[]> {
    return await invoke("get_conversations_paginated", { limit, offset });
}

export async function getConversationsCount(): Promise<number> {
    return await invoke("get_conversations_count");
}

export async function getConversation(conversationId: number): Promise<Conversation | null> {
    return await invoke("get_conversation", { conversationId });
}

export async function deleteConversation(conversationId: number): Promise<boolean> {
    return await invoke("delete_conversation", { conversationId });
}

export async function saveMessage(conversationId: number, role: string, content: string): Promise<number> {
    return await invoke("save_message", { conversationId, role, content });
}

export async function getMessages(conversationId: number): Promise<Message[]> {
    return await invoke("get_messages", { conversationId });
}

export async function updateConversationNotes(conversationId: number, notes: string): Promise<boolean> {
    return await invoke("update_conversation_notes", { conversationId, notes });
}

export async function updateConversationSummary(conversationId: number, summary: string): Promise<boolean> {
    return await invoke("update_conversation_summary", { conversationId, summary });
}

export async function getMindMapData(conversationId: number): Promise<MindMapData | null> {
    return await invoke("get_mindmap_data", { conversationId });
}

export async function saveMindMapData(
    conversationId: number, 
    title: string, 
    nodes: string, 
    connections: string, 
    theme: string
): Promise<number> {
    return await invoke("save_mindmap_data", { conversationId, title, nodes, connections, theme });
}

export async function backupDatabase(): Promise<string> {
    return await invoke("backup_database");
}

export async function getDatabaseInfo(): Promise<any> {
    return await invoke("get_database_info");
}

export async function getApiKey(): Promise<string | null> {
    return await invoke("get_api_key");
}

export async function setApiKey(apiKey: string): Promise<void> {
    return await invoke("set_api_key", { apiKey });
}
