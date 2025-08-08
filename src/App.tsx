import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Textarea } from "./components/ui/textarea";
import * as React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";


function App() {
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

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

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
          <div className="flex flex-col h-full min-h-0">
            <Tabs defaultValue="notes" className="flex flex-col h-full min-h-0">
              <div className="h-12 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-2 gap-4">
                <TabsList>
                  <SidebarTrigger/>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="notes" className="flex-1 h-full overflow-hidden p-0">
                <Textarea
                  ref={editorRef}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  spellCheck={true}
                  placeholder="Type your ideas here..."
                  className="w-full h-full min-h-0 resize-none bg-transparent border-none rounded-none p-2 font-mono text-base leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="ai" className="flex-1 h-full overflow-hidden p-0">
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4">
                      
                    </div>
                  </ScrollArea>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                    <Textarea
                      spellCheck={true}
                      placeholder="Type your question here..."
                      className="w-full min-h-[80px] max-h-[200px] resize-none bg-transparent border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 text-base leading-relaxed"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
