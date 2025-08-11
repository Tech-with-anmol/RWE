import { fetch } from '@tauri-apps/plugin-http';

export interface WebSearchResult {
  term: string;
  content: string;
  url?: string;
  source: string;
}

export async function performWebSearch(searchTerms: string[]): Promise<WebSearchResult[]> {
  const results: WebSearchResult[] = [];
  
  for (const term of searchTerms.slice(0, 3)) {
    try {
      const searchResult = await searchWithDuckDuckGo(term);
      if (searchResult) {
        results.push(searchResult);
      }
    } catch (error) {
      console.error(`Error searching for term "${term}":`, error);
    }
  }
  
  return results;
}

async function searchWithDuckDuckGo(term: string): Promise<WebSearchResult | null> {
  try {
  
    const ddgResult = await tryDuckDuckGoSearch(term);
    if (ddgResult) return ddgResult;
    
    
    const wikiResult = await tryWikipediaSearch(term);
    if (wikiResult) return wikiResult;
    
    
    const newsResult = await tryNewsSearch(term);
    if (newsResult) return newsResult;
    
    
    return {
      term,
      content: `I searched for "${term}" but couldn't find detailed current information. This might be a very recent topic or require a more specific search term.`,
      url: undefined,
      source: 'Search Services'
    };
  } catch (error) {
    return null;
  }
}

async function tryDuckDuckGoSearch(term: string): Promise<WebSearchResult | null> {
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
    
    if (data.Definition && data.Definition.length > 0) {
      return {
        term,
        content: data.Definition,
        url: data.DefinitionURL || undefined,
        source: 'DuckDuckGo'
      };
    }
    
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.Text.length > 50) {
          return {
            term,
            content: topic.Text,
            url: topic.FirstURL || undefined,
            source: 'DuckDuckGo'
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function tryWikipediaSearch(term: string): Promise<WebSearchResult | null> {
  try {
    const encodedTerm = encodeURIComponent(term);
    
  
    const searchResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTerm}`, {
      method: 'GET',
    });
    
    if (searchResponse.ok) {
      const data = await searchResponse.json() as any;
      if (data.extract && data.extract.length > 50) {
        return {
          term,
          content: data.extract,
          url: data.content_urls?.desktop?.page || undefined,
          source: 'Wikipedia'
        };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function tryNewsSearch(term: string): Promise<WebSearchResult | null> {
  try {
  
    const lowerTerm = term.toLowerCase();
    
    const newsKeywords = ['news', 'breaking', 'update'];
    const timeKeywords = ['today', 'current', 'recent', '2024', '2025'];
    const globalKeywords = ['global', 'world', 'international'];
    
    const hasNewsKeyword = newsKeywords.some(keyword => lowerTerm.includes(keyword));
    const hasTimeKeyword = timeKeywords.some(keyword => lowerTerm.includes(keyword));
    const hasGlobalKeyword = globalKeywords.some(keyword => lowerTerm.includes(keyword));
    const hasLatestNews = lowerTerm.includes('latest') && lowerTerm.includes('news');
    
    const isNewsQuery = hasNewsKeyword || hasLatestNews || (hasGlobalKeyword && hasTimeKeyword);
    
    if (!isNewsQuery) return null;
    
    
    const rssResponse = await fetch(`https://feeds.bbci.co.uk/news/rss.xml`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (rssResponse.ok) {
      const rssText = await rssResponse.text();
      
      
      const titleMatches = rssText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
      const descMatches = rssText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g);
      
      if (titleMatches && descMatches && titleMatches.length > 1) {
      
        const newsTitle = titleMatches[1].replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '');
        const newsDesc = descMatches[1].replace(/<description><!\[CDATA\[/, '').replace(/\]\]><\/description>/, '');
        
        return {
          term,
          content: `${newsTitle}\n\n${newsDesc}`,
          url: 'https://www.bbc.com/news',
          source: 'BBC News'
        };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export function clearSearchCache(): void {
  
}
