use serde::{Deserialize, Serialize};
use tauri::{command, State};
use rusqlite::Connection;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: i64,
    pub conversation_id: i64,
    pub conversation_name: String,
    pub content_type: String,
    pub content: String,
    pub snippet: String,
    pub relevance_score: f64,
    pub created_at: String,
}

type DbConnection = Mutex<Connection>;

#[command]
pub async fn search_content(
    query: String,
    db: State<'_, DbConnection>,
) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let query_terms: Vec<&str> = query.split_whitespace().collect();
    let search_pattern = format!("%{}%", query.to_lowercase());
    
    let mut results = Vec::new();
    
    let mut stmt = conn.prepare("
        SELECT 
            m.id,
            m.conversation_id,
            c.name as conversation_name,
            m.content,
            m.role,
            c.created_at
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE LOWER(m.content) LIKE ?1
        ORDER BY c.created_at DESC, m.seq ASC
        LIMIT 50
    ").map_err(|e| format!("Prepare messages error: {}", e))?;
    
    let message_iter = stmt.query_map([&search_pattern], |row| {
        let content: String = row.get(3)?;
        let role: String = row.get(4)?;
        let snippet = create_snippet(&content, &query_terms, 200);
        let relevance_score = calculate_relevance_score(&content, &query_terms);
        
        Ok(SearchResult {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            conversation_name: row.get(2)?,
            content_type: format!("message_{}", role),
            content,
            snippet,
            relevance_score,
            created_at: row.get(5)?,
        })
    }).map_err(|e| format!("Query messages error: {}", e))?;
    
    for result in message_iter {
        results.push(result.map_err(|e| format!("Row error: {}", e))?);
    }
    
    let mut stmt = conn.prepare("
        SELECT 
            id,
            id as conversation_id,
            name as conversation_name,
            COALESCE(summary, '') as content,
            created_at
        FROM conversations
        WHERE (LOWER(name) LIKE ?1 OR LOWER(summary) LIKE ?1)
            AND (summary IS NOT NULL OR summary != '')
        ORDER BY created_at DESC
        LIMIT 30
    ").map_err(|e| format!("Prepare conversations error: {}", e))?;
    
    let conv_iter = stmt.query_map([&search_pattern], |row| {
        let content: String = row.get(3)?;
        let snippet = create_snippet(&content, &query_terms, 200);
        let relevance_score = calculate_relevance_score(&content, &query_terms);
        
        Ok(SearchResult {
            id: row.get(0)?,
            conversation_id: row.get(1)?,
            conversation_name: row.get(2)?,
            content_type: "conversation".to_string(),
            content,
            snippet,
            relevance_score,
            created_at: row.get(4)?,
        })
    }).map_err(|e| format!("Query conversations error: {}", e))?;
    
    for result in conv_iter {
        results.push(result.map_err(|e| format!("Row error: {}", e))?);
    }
    
    results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(results.into_iter().take(50).collect())
}

fn calculate_relevance_score(content: &str, query_terms: &[&str]) -> f64 {
    let content_lower = content.to_lowercase();
    let mut score = 0.0;
    
    for term in query_terms {
        let term_lower = term.to_lowercase();
        let occurrences = content_lower.matches(&term_lower).count();
        score += occurrences as f64 * 2.0;
        
        if content_lower.starts_with(&term_lower) {
            score += 5.0;
        }
        
        if content_lower.contains(&format!(" {}", term_lower)) {
            score += 3.0;
        }
    }
    
    let length_factor = (content.len() as f64).log10().max(1.0);
    score / length_factor
}

fn create_snippet(content: &str, query_terms: &[&str], max_length: usize) -> String {
    let content_lower = content.to_lowercase();
    
    for term in query_terms {
        let term_lower = term.to_lowercase();
        if let Some(pos) = content_lower.find(&term_lower) {
            let start = pos.saturating_sub(80);
            let end = (pos + term.len() + 80).min(content.len());
            let mut snippet = &content[start..end];
            
            while !snippet.is_char_boundary(snippet.len()) && snippet.len() > 0 {
                snippet = &snippet[..snippet.len() - 1];
            }
            
            let mut final_snippet = String::new();
            if start > 0 {
                final_snippet.push_str("...");
            }
            final_snippet.push_str(snippet);
            if end < content.len() {
                final_snippet.push_str("...");
            }
            
            if final_snippet.len() > max_length {
                let truncated = &final_snippet[..max_length.saturating_sub(3)];
                return format!("{}...", truncated);
            }
            
            return final_snippet;
        }
    }
    
    if content.len() > max_length {
        format!("{}...", &content[..max_length.saturating_sub(3)])
    } else {
        content.to_string()
    }
}
