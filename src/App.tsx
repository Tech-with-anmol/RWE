import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Textarea } from "./components/ui/textarea";
import * as React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import 'highlight.js/styles/github-dark.css';
import { Button } from "./components/ui/button";
import { MessageSquarePlus, Globe, Search, Brain } from "lucide-react";
import { TopicDialog } from "./components/topic-dialog";
import { OptimizedMarkdown } from "./components/optimized-markdown";
import { MindMap } from "./components/mind-map";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { 
  initDatabase, 
  createConversation, 
  saveMessage, 
  updateConversationNotes,
  updateConversationSummary,
  type Conversation
} from "./components/load-data";
import { performWebSearch, type SearchResult, clearSearchCache } from "./services/search";
import { 
  getConversation,
  getMessages,
  invalidateConversationCache,
  invalidateMessageCache,
  updateConversationCache
} from "./services/cache";


function App() {
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const chatScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = React.useState("");
  const [conversation, setConversation] = React.useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = React.useState(false);
  const [currentConversationId, setCurrentConversationId] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [isDbInitialized, setIsDbInitialized] = React.useState(false);
  const [refreshSidebar, setRefreshSidebar] = React.useState(0);
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null);
  const [generatingSummary, setGeneratingSummary] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  const [thinkingEnabled, setThinkingEnabled] = React.useState(false);
  const [notesViewMode, setNotesViewMode] = React.useState<'edit' | 'split' | 'preview'>('split');

  React.useEffect(() => {
    if (chatScrollRef.current && conversation.length > 0) {
      const scrollElement = chatScrollRef.current;
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    }
  }, [conversation, isLoading]);

  React.useEffect(() => {
    const initDb = async () => {
      try {
        await initDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        
      }
    };
    initDb();
  }, []);

  React.useEffect(() => {
    if (!isDbInitialized || !currentConversationId || !notes) return;
    
    const saveNotes = async () => {
      try {
        await updateConversationNotes(currentConversationId, notes);
      } catch (error) {
        
      }
    };

    const timeoutId = setTimeout(saveNotes, 1000);
    return () => clearTimeout(timeoutId);
  }, [notes, currentConversationId, isDbInitialized]);

  const createNewConversation = React.useCallback(async (name: string, summary: string) => {
    if (!isDbInitialized) return;
    
    try {
      const conversationId = await createConversation(name, summary);
      
      setCurrentConversationId(conversationId);
      setConversation([]);
      setNotes("");
      setSearchResults([]);
      clearSearchCache(); 
      setRefreshSidebar(prev => prev + 1);
      
      const newConv = await getConversation(conversationId);
      if (newConv) {
        setCurrentConversation(newConv);
        updateConversationCache(newConv);
      }
      invalidateConversationCache();
    } catch (error) {
      
    }
  }, [isDbInitialized]);

  const loadConversationMessages = React.useCallback(async (conversationId: number) => {
    if (!isDbInitialized) {
      return;
    }
    
    if (conversationId === currentConversationId) {
      return;
    }
    
    try {
      setCurrentConversationId(conversationId);
      setConversation([]);
      setSearchResults([]);
      clearSearchCache(); 
      
      const [messages, conv] = await Promise.all([
        getMessages(conversationId),
        getConversation(conversationId)
      ]);
      
      if (conv) {
        setCurrentConversation(conv);
        setNotes(conv.notes || "");
        
        const formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        setConversation(formattedMessages);
        
        requestAnimationFrame(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        });
      }
    } catch (error) {
      setCurrentConversationId(null);
      setCurrentConversation(null);
      setConversation([]);
    }
  }, [isDbInitialized, currentConversationId]);

  const extractSearchTerms = React.useCallback(async (conversationText: string): Promise<string[]> => {
    const cleanText = conversationText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const text = cleanText.trim();
    
    if (text.length < 3) {
      return ['general'];
    }
    
    const lowerText = text.toLowerCase();
    
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'what', 'who', 'which', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'as', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'this', 'that']);
    
    const terms: string[] = [];
    
    const patterns = [
      /([a-zA-Z][a-zA-Z0-9\s]*(?:show|series|movie|film|season|episode|episode?\s*\d+|s\d+|e\d+)[a-zA-Z0-9\s]*)/gi,
      /([a-zA-Z][a-zA-Z\s]+(?:season\s*\d+|episode\s*\d+|s\d+e\d+))/gi,
      /(\b[a-zA-Z][a-zA-Z\s]{2,}(?:\s+(?:news|today|2024|2025|latest|current|update|breaking))\b)/gi,
      /(\b(?:top|best|latest|new|current)\s+[a-zA-Z\s]{3,}\b)/gi,
      /(\b[A-Z][a-zA-Z\s]{2,}\b)/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
          if (cleaned.length > 3 && cleaned.length < 60) {
            terms.push(cleaned);
          }
        });
      }
    });
    
    const words = lowerText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        word.length < 25 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word)
      );
    
    const phrases = [];
    const textWords = text.split(/\s+/);
    for (let i = 0; i < textWords.length - 2; i++) {
      const phrase3 = `${textWords[i]} ${textWords[i + 1]} ${textWords[i + 2]}`.replace(/[^\w\s]/g, ' ').trim();
      const phrase2 = `${textWords[i]} ${textWords[i + 1]}`.replace(/[^\w\s]/g, ' ').trim();
      
      if (phrase3.length > 8 && phrase3.length < 50) {
        phrases.push(phrase3);
      } else if (phrase2.length > 5 && phrase2.length < 40) {
        phrases.push(phrase2);
      }
    }
    
    const importantWords = words.filter(word => 
      word.length > 4 || 
      /^(show|movie|film|news|season|episode|latest|today|current|new|best|top)$/.test(word)
    );
    
    const allTerms = [...new Set([...terms, ...phrases.slice(0, 3), ...importantWords.slice(0, 4)])];
    const finalTerms = allTerms.slice(0, 5);
    
    return finalTerms.length > 0 ? finalTerms : [text.slice(0, 30)];
  }, []);

  const performWebSearchWithLinks = React.useCallback(async (searchTerms: string[]): Promise<SearchResult[]> => {
    try {
      return await performWebSearch(searchTerms);
    } catch (error) {
      return [];
    }
  }, []);

  const performWebSearchLegacy = React.useCallback(async (searchTerms: string[]): Promise<string> => {
    const results = await performWebSearch(searchTerms);
    return results.map(r => `**${r.term}**: ${r.content}`).join('\n\n');
  }, []);

  const generateSummary = React.useCallback(async () => {
    if (!currentConversation) return;
    
    setGeneratingSummary(true);
    try {
      const searchTerms = await extractSearchTerms(currentConversation.name);
      const webContent = await performWebSearchLegacy(searchTerms);
      
      const enhancedPrompt = webContent 
        ? `Create a comprehensive summary about the topic "${currentConversation.name}". Use the web research information to provide detailed insights.

**Web Research:**
${webContent}

Structure your summary with:
1. **Overview & Definition**
2. **Key Concepts & Components**
3. **Technical Details & Methods**
4. **Current Trends & Developments**
5. **Applications & Use Cases**
6. **Resources & Further Learning**

Provide a detailed, informative summary based on the research.`
        : `Create a comprehensive summary about the topic "${currentConversation.name}".

Structure your summary with:
1. **Overview & Definition**
2. **Key Concepts & Components**
3. **Technical Details & Methods**
4. **Current Trends & Developments**
5. **Applications & Use Cases**
6. **Resources & Further Learning**

Provide detailed analysis and insights about this topic.`;
      
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: enhancedPrompt
          }],
          model: "qwen/qwen3-32b",
          temperature: 0.4,
          max_completion_tokens: 1200,
          reasoning_effort: "none",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0].message.content;
      
      if (currentConversationId) {
        await updateConversationSummary(currentConversationId, summary);
      }
      const updatedConv = { ...currentConversation, summary };
      setCurrentConversation(updatedConv);
      updateConversationCache(updatedConv);
    } catch (error) {
      
    } finally {
      setGeneratingSummary(false);
    }
  }, [currentConversation, currentConversationId, extractSearchTerms, performWebSearchLegacy]);

 
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsTopicDialogOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'B' && e.shiftKey) {
        e.preventDefault();
        setThinkingEnabled(!thinkingEnabled);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        setWebSearchEnabled(prev => {
          if (prev) setSearchResults([]);
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [thinkingEnabled, webSearchEnabled]);

  

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const value = el.value ?? "";
      const indent = "\t"; 
      el.value = value.slice(0, start) + indent + value.slice(end);
      const pos = start + indent.length;
      el.selectionStart = el.selectionEnd = pos;
    }
  };

  const sendMessage = React.useCallback(async () => {
    if (!message.trim() || isLoading || !isDbInitialized) return;
    
    const userMessage = { role: "user", content: message };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setMessage("");
    setIsLoading(true);

    if (currentConversationId) {
      try {
        await saveMessage(currentConversationId, 'user', userMessage.content);
        invalidateMessageCache(currentConversationId);
      } catch (error) {
        
      }
    }

    try {
      let enhancedMessages = newConversation;
      let webSearchResults: SearchResult[] = [];

      if (webSearchEnabled) {
        setIsSearching(true);
        const searchTerms = await extractSearchTerms(userMessage.content);
        webSearchResults = await performWebSearchWithLinks(searchTerms);
        setSearchResults(webSearchResults);
        setIsSearching(false);

        if (webSearchResults.length > 0) {
          const webContext = `

**Web Search Results:**
${webSearchResults.map((r, i) => `
${i + 1}. **${r.term}**
   ${r.content}
   ${r.url ? `Source: ${r.url}` : ''}
`).join('\n')}

Based on the above web search results, please provide a comprehensive answer that incorporates this information. Cite sources when relevant.`;

          enhancedMessages = [
            ...newConversation.slice(0, -1),
            { 
              role: "user", 
              content: userMessage.content + webContext 
            }
          ];
        }
      }

      let messagesToSend = enhancedMessages.map(msg => ({
        role: msg.role === "user" ? "user" as const : "assistant" as const,
        content: msg.content
      }));

      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
          model: "qwen/qwen3-32b",
          temperature: 0.7,
          max_completion_tokens: 1000,
          reasoning_effort: thinkingEnabled ? "default" : "none",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices[0].message.content;
      const cleanedContent = aiContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const aiMessage = { role: "assistant", content: cleanedContent };
      setConversation([...newConversation, aiMessage]);

      if (currentConversationId) {
        try {
          await saveMessage(currentConversationId, 'ai', cleanedContent);
          invalidateMessageCache(currentConversationId);
        } catch (error) {
          
        }
      }
    } catch (error) {
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("400")) {
          errorMessage = "Invalid request format. Please try rephrasing your message.";
        } else if (error.message.includes("401")) {
          errorMessage = "Authentication error. Please check your API access.";
        } else if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        }
      }
      
      const errorResponse = { role: "assistant", content: errorMessage };
      setConversation([...newConversation, errorResponse]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [message, isLoading, isDbInitialized, conversation, currentConversationId, webSearchEnabled, extractSearchTerms, performWebSearchWithLinks]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    } 
  }, [sendMessage]);




  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar 
          onConversationSelect={loadConversationMessages}
          currentConversationId={currentConversationId}
          refreshTrigger={refreshSidebar}
          isDbReady={isDbInitialized}
        />
        <SidebarInset>
          <div className="flex flex-col h-screen overflow-hidden">
            <Tabs defaultValue="notes" className="flex flex-col h-full overflow-hidden">
              <div className="h-12 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-2 gap-4 shrink-0">
                <TabsList>
                  <SidebarTrigger/>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                  <TabsTrigger value="graph">Mind Map</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => setIsTopicDialogOpen(true)}>
                  <MessageSquarePlus/> New Topic
                </Button>
              </div>
              <TabsContent value="notes" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="border-b border-neutral-200 dark:border-neutral-700 p-2 flex items-center justify-end">
                  <ToggleGroup type="single" value={notesViewMode} onValueChange={(value) => value && setNotesViewMode(value as 'edit' | 'split' | 'preview')} variant="outline">
                    <ToggleGroupItem value="edit" aria-label="Edit only">
                      Edit
                    </ToggleGroupItem>
                    <ToggleGroupItem value="split" aria-label="Split view">
                      Split
                    </ToggleGroupItem>
                    <ToggleGroupItem
                     value="preview"
                     aria-label="Preview only"
                     className="w-30"
                     >
                      Preview
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  {(notesViewMode === 'edit' || notesViewMode === 'split') && (
                    <div className={`${notesViewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                      <Textarea
                        ref={editorRef}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        spellCheck={true}
                        placeholder="Type your ideas here..."
                        className="w-full h-full min-h-0 resize-none bg-transparent border-none rounded-none p-2 font-mono text-base leading-relaxed"
                      />
                    </div>
                  )}
                  {notesViewMode === 'split' && (
                    <div className="w-px bg-neutral-200 dark:bg-neutral-700"></div>
                  )}
                  {(notesViewMode === 'preview' || notesViewMode === 'split') && (
                    <div className={`${notesViewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto p-4`}>
                      {notes ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <OptimizedMarkdown content={notes} />
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">
                          Start typing to see markdown preview...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="summary" className="flex-1 overflow-hidden p-4 m-0">
                <div className="h-full overflow-y-auto">
                  {currentConversationId && currentConversation ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Conversation Summary</h2>
                        <Button 
                          className="bg-neutral-700 hover:bg-neutral-600"
                          onClick={generateSummary}
                          disabled={generatingSummary || !currentConversation}
                          size="sm"
                        >
                          {generatingSummary ? "Researching..." : "Generate Research Summary"}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Topic: {currentConversation.name}
                      </div>
                      <div className="border rounded-lg p-4">
                        {generatingSummary ? (
                          <div className="text-center text-muted-foreground space-y-2">
                            <div>Analyzing conversation...</div>
                            <div className="text-sm">Searching web for relevant information...</div>
                            <div className="text-sm">Generating comprehensive summary...</div>
                          </div>
                        ) : currentConversation.summary ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <OptimizedMarkdown content={currentConversation.summary} />
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            No summary yet. Click "Generate Summary" to create one with web research integration.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a conversation to view its summary
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="graph" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <MindMap />
              </TabsContent>
              <TabsContent value="ai" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex h-full overflow-hidden">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto" ref={chatScrollRef} style={{scrollBehavior: 'smooth'}}>
                      <div className="p-4 space-y-4">
                        {conversation.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : " text-foreground"
                              }`}
                            >
                              
                              {msg.role === "user" ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                              ) : (
                                <OptimizedMarkdown content={msg.content} />
                              )}
                            </div>
                          </div>
                        ))}
                        {(isLoading || (isSearching && webSearchEnabled)) && (
                          <div className="flex justify-start">
                            <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg p-3">
                              <div className="text-sm font-medium mb-1">AI</div>
                              <div className="text-neutral-500">
                                {isSearching && webSearchEnabled ? "Searching web for current information..." : 
                                 thinkingEnabled ? "Deep thinking..." : "Thinking..."}
                              </div>
                              {webSearchEnabled && searchResults.length > 0 && !isSearching && (
                                <div className="text-xs text-neutral-400 mt-1">
                                  Found {searchResults.length} search result{searchResults.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-600 bg-background">
                      <div className="p-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-600">
                        <Button
                          variant={webSearchEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setWebSearchEnabled(!webSearchEnabled);
                            if (webSearchEnabled) {
                              setSearchResults([]);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Web Search
                        </Button>
                        <Button
                          variant={thinkingEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setThinkingEnabled(!thinkingEnabled)}
                          className="flex items-center gap-2"
                        >
                          <Brain className="w-4 h-4" />
                          Deep Thinking
                        </Button>
                        <div className="text-xs text-muted-foreground ml-auto">
                          {webSearchEnabled && thinkingEnabled && "Deep reasoning + Web search enabled • Ctrl+W/Shift+Ctrl+B"}
                          {webSearchEnabled && !thinkingEnabled && "Web search enabled • Ctrl+W"}
                          {!webSearchEnabled && thinkingEnabled && "Enhanced • Deep reasoning • Shift+Ctrl+B"}
                          {!webSearchEnabled && !thinkingEnabled && "Standard mode • Ctrl+W/Shift+Ctrl+B"}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex gap-2">
                          <Textarea
                            spellCheck={true}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything... (Ctrl+Enter to send)"
                            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!message.trim() || isLoading}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-600 min-w-[60px] flex items-center justify-center text-sm"
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Send"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {webSearchEnabled && searchResults.length > 0 && (
                    <div className="w-80 border-l border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Search Results
                        </h3>
                      </div>
                      <div className="overflow-y-auto h-full p-4 space-y-3">
                        {searchResults.map((result, index) => (
                          <div key={index} className="bg-white dark:bg-neutral-700 rounded-lg p-3 border">
                            <h4 className="text-sm font-medium mb-2">{result.term}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-3">
                              {result.content}
                            </p>
                            {result.url && (
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-700 underline"
                              >
                                Read more
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
        <TopicDialog 
          open={isTopicDialogOpen} 
          onOpenChange={setIsTopicDialogOpen}
          onCreateConversation={createNewConversation}
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
