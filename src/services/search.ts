import { fetch } from '@tauri-apps/plugin-http';

export interface SearchResult {
  term: string;
  content: string;
  url?: string;
  source: string;
}

const cache = new Map<string, { data: SearchResult[], timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

export async function performWebSearch(searchTerms: string[]): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  for (const term of searchTerms.slice(0, 3)) {
    const cacheKey = term.toLowerCase();
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      results.push(...cached.data);
      continue;
    }
    
    try {
      const searchResult = await searchWithDuckDuckGo(term);
      if (searchResult) {
        results.push(searchResult);
        cache.set(cacheKey, { data: [searchResult], timestamp: Date.now() });
      }
    } catch (error) {
      console.warn(`Search failed for term: ${term}`, error);
    }
  }
  
  return results;
}

async function searchWithDuckDuckGo(term: string): Promise<SearchResult | null> {
  try {
    const encodedTerm = encodeURIComponent(term);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodedTerm}&format=json&no_redirect=1&no_html=1&skip_disambig=1`, {
        method: 'GET',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json() as any;
    
    if (data.Abstract && data.Abstract.length > 0) {
      return {
        term,
        content: data.Abstract,
        url: data.AbstractURL || undefined,
        source: 'DuckDuckGo'
      };
    }
    
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topic = data.RelatedTopics[0];
      if (topic.Text) {
        return {
          term,
          content: topic.Text,
          url: topic.FirstURL || undefined,
          source: 'DuckDuckGo'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`DuckDuckGo search failed for: ${term}`, error);
    return null;
  }
}

export function clearSearchCache(): void {
  cache.clear();
}
