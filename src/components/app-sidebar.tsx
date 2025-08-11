import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquare, Home, Search, Settings, MoreHorizontal, HandHelpingIcon, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteConversation, type Conversation, getConversationsPaginated, getConversationsCount } from "../services/database"
import { getConversations, invalidateConversationCache } from "../services/cache"
import { useAlert } from "./alert-dialog"
import { AnalysisDialog } from "./analysis-dialog"
import { VirtualizedConversationList } from "./virtualized-conversation-list"
import { SettingsDialog } from "./settings-dialog"


const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
    onClick: () => {},
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
    onClick: "search",
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    onClick: "settings",
  },
  {
    title: "Help",
    url: "#",
    icon: HandHelpingIcon,
    onClick: () => {},
  },
  {
    title: "Analysis",
    url: "#",
    icon: BarChart3,
    onClick: "analysis",
  },
]

interface AppSidebarProps {
  onConversationSelect?: (conversationId: number | null) => void;
  currentConversationId?: number | null;
  refreshTrigger?: number;
  isDbReady?: boolean;
  onSearchOpen?: () => void;
}

export function AppSidebar({ onConversationSelect, currentConversationId, refreshTrigger, isDbReady, onSearchOpen }: AppSidebarProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [deletingIds, setDeletingIds] = React.useState<Set<number>>(new Set());
  const [analysisOpen, setAnalysisOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0);
  const [useVirtualized, setUseVirtualized] = React.useState(false);
  const { showAlert, AlertComponent } = useAlert();

  const loadConversations = React.useCallback(async () => {
    if (!isDbReady) return;
    
    try {
      const count = await getConversationsCount();
      setTotalCount(count);
      
      if (count > 100) {
        setUseVirtualized(true);
        const convos = await getConversationsPaginated(100, 0);
        setConversations(convos);
      } else {
        setUseVirtualized(false);
        const convos = await getConversations();
        setConversations(convos);
      }
    } catch (error) {
      setConversations([]);
      setTotalCount(0);
    }
  }, [isDbReady]);

  React.useEffect(() => {
    if (isDbReady) {
      loadConversations();
    }
  }, [refreshTrigger, isDbReady, loadConversations]);

  const handleDeleteConversation = React.useCallback(async (conversationId: number) => {
    if (!isDbReady || deletingIds.has(conversationId)) return;
    
    showAlert({
      title: "Delete Conversation",
      description: "Delete this conversation permanently?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        setDeletingIds(prev => new Set(prev).add(conversationId));
        
        try {
          await deleteConversation(conversationId);
          invalidateConversationCache();
          
          setConversations(prev => {
            const updated = prev.filter(conv => conv.id !== conversationId);
            
            if (currentConversationId === conversationId) {
              const nextConversation = updated[0];
              
              setTimeout(() => {
                onConversationSelect?.(nextConversation ? nextConversation.id : null);
              }, 0);
            }
            
            return updated;
          });
        } catch (error) {
          showAlert({
            title: "Error",
            description: "Failed to delete conversation",
            confirmText: "OK"
          });
        } finally {
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(conversationId);
            return newSet;
          });
        }
      }
    });
  }, [isDbReady, deletingIds, currentConversationId, onConversationSelect, showAlert]);
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="text-lg font-semibold">RWE</span>
            <span className="text-sm text-muted-foreground">v1.0</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <button 
                      onClick={() => {
                        if (item.onClick === "search") {
                          onSearchOpen?.()
                        } else if (item.onClick === "analysis") {
                          setAnalysisOpen(true)
                        } else if (item.onClick === "settings") {
                          setSettingsOpen(true)
                        } else if (typeof item.onClick === "function") {
                          item.onClick()
                        }
                      }}
                      className="w-full"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>
            Conversations {totalCount > 0 && `(${totalCount})`}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isDbReady ? (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`skeleton-${index}`}>
                      <div className="flex items-center gap-2 px-2 py-1">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              ) : conversations.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No conversations yet. Create a new topic to get started.
                  </div>
                </SidebarMenuItem>
              ) : useVirtualized ? (
                <VirtualizedConversationList
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onConversationSelect={onConversationSelect}
                  onDeleteConversation={handleDeleteConversation}
                  deletingIds={deletingIds}
                />
              ) : (
                conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={currentConversationId === conversation.id}
                    >
                      <button 
                        onClick={() => onConversationSelect?.(conversation.id)}
                        className="w-full"
                      >
                        <MessageSquare />
                        <span className="truncate">{conversation.name}</span>
                      </button>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <MoreHorizontal />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem>
                          <span>Edit Name</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConversation(conversation.id)}
                          className="text-destructive"
                          disabled={deletingIds.has(conversation.id)}
                        >
                          {deletingIds.has(conversation.id) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              <span>Deleting...</span>
                            </div>
                          ) : (
                            <span>Delete</span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AlertComponent />
      <AnalysisDialog open={analysisOpen} onOpenChange={setAnalysisOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}