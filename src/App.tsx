import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Textarea } from "./components/ui/textarea";
import { Skeleton } from "./components/ui/skeleton";
import * as React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import 'highlight.js/styles/github-dark.css';
import { Button } from "./components/ui/button";
import { MessageSquarePlus, Key } from "lucide-react";
import { TopicDialog } from "./components/topic-dialog";
import { SearchDialog } from "./components/search-dialog";
import { ApiKeyDialog } from "./components/api-key-dialog";
import { OptimizedMarkdown } from "./components/optimized-markdown";
import { MindMap } from "./components/mind-map";
import { Whiteboard } from "./components/whiteboard";
import { CommandPalette } from "./components/command-palette";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { ModeToggle } from "./components/mode-toggle";
import { 
  initDatabase, 
  createConversation, 
  saveMessage, 
  updateConversationNotes,
  updateConversationSummary,
  getApiKey,
  type Conversation
} from "./services/database";
import { sendToGemini, convertToGeminiFormat } from "./services/gemini";
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
  const [isSearchDialogOpen, setIsSearchDialogOpen] = React.useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = React.useState(false);
  const [currentConversationId, setCurrentConversationId] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [isDbInitialized, setIsDbInitialized] = React.useState(false);
  const [refreshSidebar, setRefreshSidebar] = React.useState(0);
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null);
  const [generatingSummary, setGeneratingSummary] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState(false);
  const [notesViewMode, setNotesViewMode] = React.useState<'edit' | 'split' | 'preview'>('split');
  const [summaryUpdate, setSummaryUpdate] = React.useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("notes");

  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('ai');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('notes');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('summary');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('graph');
            break;
          case '5':
            e.preventDefault();
            setActiveTab('whiteboard');
            break;
          case 'n':
            e.preventDefault();
            setIsTopicDialogOpen(true);
            break;
          case 'k':
            e.preventDefault();
            setIsSearchDialogOpen(true);
            break;
          case 'p':
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        checkApiKey();
      } catch (error) {
        setTimeout(() => {
          initDb();
        }, 2000);
      }
    };
    if (!isDbInitialized) {
      initDb();
    }
  }, [isDbInitialized]);

  const checkApiKey = async () => {
    try {
      const apiKey = await getApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      setHasApiKey(false);
    }
  };

  const saveCurrentNotes = React.useCallback(async () => {
    if (!isDbInitialized || !currentConversationId) return;
    
    try {
      await updateConversationNotes(currentConversationId, notes);
      if (currentConversation) {
        const updatedConv = { ...currentConversation, notes };
        setCurrentConversation(updatedConv);
        updateConversationCache(updatedConv);
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  }, [isDbInitialized, currentConversationId, notes, currentConversation]);

  React.useEffect(() => {
    if (!isDbInitialized || !currentConversationId) return;
    
    const timeoutId = setTimeout(saveCurrentNotes, 1000);
    return () => clearTimeout(timeoutId);
  }, [notes, currentConversationId, isDbInitialized, saveCurrentNotes]);

  const createNewConversation = React.useCallback(async (name: string, summary: string) => {
    if (!isDbInitialized) return;
    
    try {
      const conversationId = await createConversation(name, summary);
      
      setCurrentConversationId(conversationId);
      setConversation([]);
      setNotes("");
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

  const loadConversationMessages = React.useCallback(async (conversationId: number | null) => {
    if (!isDbInitialized || !conversationId) {
      return;
    }
    
    if (conversationId === currentConversationId) {
      return;
    }
    
    try {
      if (currentConversationId && notes) {
        await saveCurrentNotes();
      }
      
      setCurrentConversationId(conversationId);
      setConversation([]);
      setSummaryUpdate(0);
      
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
  }, [isDbInitialized, currentConversationId, notes, saveCurrentNotes]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsTopicDialogOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  

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
    if (!message.trim() || isLoading || !isDbInitialized || !hasApiKey) {
      if (!hasApiKey) {
        setIsApiKeyDialogOpen(true);
      }
      return;
    }
    
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
        console.error("Failed to save user message:", error);
      }
    }

    try {
      const geminiMessages = convertToGeminiFormat(newConversation);
      const aiContent = await sendToGemini(geminiMessages);
      const aiMessage = { role: "assistant", content: aiContent };
      setConversation([...newConversation, aiMessage]);

      if (currentConversationId) {
        try {
          await saveMessage(currentConversationId, 'ai', aiContent);
          invalidateMessageCache(currentConversationId);
        } catch (error) {
          console.error("Failed to save AI message:", error);
        }
      }
    } catch (error) {
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("API key not configured")) {
          errorMessage = "Please configure your Gemini API key first.";
          setIsApiKeyDialogOpen(true);
        } else if (error.message.includes("401")) {
          errorMessage = "Invalid API key. Please check your Gemini API key.";
        } else if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        }
      }
      
      const errorResponse = { role: "assistant", content: errorMessage };
      setConversation([...newConversation, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, isDbInitialized, conversation, currentConversationId, hasApiKey]);

  const generateSummary = React.useCallback(async () => {
    if (!currentConversation || !hasApiKey) return;
    
    setGeneratingSummary(true);
    try {
      const prompt = `Create a comprehensive summary about the topic "${currentConversation.name}".
Structure your summary with:
1. **Overview & Definition**
2. **Key Concepts & Components**
3. **Technical Details & Methods**
4. **Current Trends & Developments**
5. **Applications & Use Cases**
6. **Resources & Further Learning**

Provide a detailed, informative summary.`;
      
      const geminiMessages = convertToGeminiFormat([{role: "user", content: prompt}]);
      const summary = await sendToGemini(geminiMessages);
      
      if (currentConversationId) {
        await updateConversationSummary(currentConversationId, summary);
        const updatedConv = { ...currentConversation, summary };
        setCurrentConversation(updatedConv);
        updateConversationCache(updatedConv);
        invalidateConversationCache();
        setSummaryUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setGeneratingSummary(false);
    }
  }, [currentConversation, currentConversationId, hasApiKey]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentConversationId && notes) {
        saveCurrentNotes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentConversationId, notes, saveCurrentNotes]);

  React.useEffect(() => {
    return () => {
      if (currentConversationId && notes) {
        updateConversationNotes(currentConversationId, notes).catch(() => {});
      }
    };
  }, [currentConversationId, notes]);

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
          onSearchOpen={() => setIsSearchDialogOpen(true)}
        />
        <SidebarInset>
          {!isDbInitialized ? (
            <div className="flex flex-col h-screen overflow-hidden">
              <div className="h-12 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-2 gap-4 shrink-0">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-24 ml-auto" />
              </div>
              <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-screen overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
              <div className="h-12 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-2 gap-4 shrink-0">
                <TabsList>
                  <SidebarTrigger/>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                  <TabsTrigger value="graph">Mind Map</TabsTrigger>
                  <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <ModeToggle />
                  <Button variant="outline" size="sm" onClick={() => setIsTopicDialogOpen(true)}>
                    <MessageSquarePlus/> New Topic
                  </Button>
                </div>
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
              <TabsContent value="summary" className="flex-1 overflow-hidden p-4 m-0" key={`summary-${currentConversationId}-${summaryUpdate}`}>
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
                <MindMap currentConversationId={currentConversationId} />
              </TabsContent>
              <TabsContent value="whiteboard" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Whiteboard conversationId={currentConversationId} />
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
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg p-3">
                              <div className="text-sm font-medium mb-1">AI</div>
                              <div className="text-neutral-500">Thinking...</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-600 bg-background">
                      <div className="p-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-600">
                        <Button
                          variant={hasApiKey ? "outline" : "default"}
                          size="sm"
                          onClick={() => setIsApiKeyDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" />
                          {hasApiKey ? "Update API Key" : "Set API Key"}
                        </Button>
                        <div className="text-xs text-muted-foreground ml-auto">
                          {hasApiKey ? "Gemini API configured" : "Configure Gemini API key to start chatting"}
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
          )}
        </SidebarInset>
        <TopicDialog 
          open={isTopicDialogOpen} 
          onOpenChange={setIsTopicDialogOpen}
          onCreateConversation={createNewConversation}
        />
        <SearchDialog 
          open={isSearchDialogOpen} 
          onOpenChange={setIsSearchDialogOpen}
          onResultSelect={loadConversationMessages}
        />
        <ApiKeyDialog 
          open={isApiKeyDialogOpen} 
          onOpenChange={setIsApiKeyDialogOpen}
          onApiKeySet={() => {
            checkApiKey();
            setHasApiKey(true);
          }}
        />
        <CommandPalette 
          open={isCommandPaletteOpen} 
          onOpenChange={setIsCommandPaletteOpen}
          onCommand={(command) => {
            switch (command) {
              case 'new-topic':
                setIsTopicDialogOpen(true);
                break;
              case 'search':
                setIsSearchDialogOpen(true);
                break;
              case 'tab-ai':
                setActiveTab('ai');
                break;
              case 'tab-notes':
                setActiveTab('notes');
                break;
              case 'tab-summary':
                setActiveTab('summary');
                break;
              case 'tab-mindmap':
                setActiveTab('graph');
                break;
              case 'tab-whiteboard':
                setActiveTab('whiteboard');
                break;
            }
          }}
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
