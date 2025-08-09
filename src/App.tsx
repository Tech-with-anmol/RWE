import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Textarea } from "./components/ui/textarea";
import * as React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Button } from "./components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { TopicDialog } from "./components/topic-dialog";


function App() {
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [message, setMessage] = React.useState("");
  const [conversation, setConversation] = React.useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = React.useState(false);

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

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: message };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newConversation,
          model: "qwen/qwen3-32b",
          temperature: 0.7,
          max_completion_tokens: 1000,
          reasoning_effort: "none",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { role: "assistant", content: data.choices[0].message.content };
      setConversation([...newConversation, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
      setConversation([...newConversation, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    } 
  };

  


  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
          <div className="flex flex-col h-screen overflow-hidden">
            <Tabs defaultValue="notes" className="flex flex-col h-full overflow-hidden">
              <div className="h-12 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-2 gap-4 shrink-0">
                <TabsList>
                  <SidebarTrigger/>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => setIsTopicDialogOpen(true)}>
                  <MessageSquarePlus/> New Topic
                </Button>
              </div>
              <TabsContent value="notes" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Textarea
                  ref={editorRef}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  spellCheck={true}
                  placeholder="Type your ideas here..."
                  className="w-full h-full min-h-0 resize-none bg-transparent border-none rounded-none p-2 font-mono text-base leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="ai" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
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
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  code: ({ children, className, ...props }: any) => {
                                    const isInline = !className?.includes('language-');
                                    if (isInline) {
                                      return (
                                        <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 border rounded text-sm" {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                    return (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  pre: ({ children, ...props }: any) => (
                                    <pre className="bg-neutral-800 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4" {...props}>
                                      {children}
                                    </pre>
                                  ),
                                  p: ({ children, ...props }: any) => (
                                    <p className="mb-2 last:mb-0" {...props}>
                                      {children}
                                    </p>
                                  ),
                                  h1: ({ children, ...props }: any) => (
                                    <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props}>
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children, ...props }: any) => (
                                    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children, ...props }: any) => (
                                    <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0" {...props}>
                                      {children}
                                    </h3>
                                  ),
                                  ul: ({ children, ...props }: any) => (
                                    <ul className="list-disc list-inside mb-2 space-y-1" {...props}>
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children, ...props }: any) => (
                                    <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>
                                      {children}
                                    </ol>
                                  ),
                                  blockquote: ({ children, ...props }: any) => (
                                    <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 my-2 italic" {...props}>
                                      {children}
                                    </blockquote>
                                  ),
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-3">
                            <div className="text-sm font-medium mb-1">AI</div>
                            <div className="text-neutral-500">Thinking...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-700 p-4 bg-background">
                    <div className="flex gap-2">
                      <Textarea
                        spellCheck={true}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your question here... (Ctrl+Enter to send)"
                        className="flex-1 min-h-[80px] max-h-[200px] resize-none bg-transparent border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 text-base leading-relaxed"
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!message.trim() || isLoading}
                        className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
        <TopicDialog 
          open={isTopicDialogOpen} 
          onOpenChange={setIsTopicDialogOpen}
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
