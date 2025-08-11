export interface SearchResult {
    id: number;
    conversation_id: number;
    conversation_name: string;
    content_type: string;
    content: string;
    snippet: string;
    relevance_score: number;
    created_at: string;
}

export async function searchContent(query: string): Promise<SearchResult[]> {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("search_content", { query });
}
