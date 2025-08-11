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
import { MessageSquare, Home, Search, Settings, HelpCircle, MoreHorizontal, HandHelpingIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteConversation, type Conversation } from "../services/database"
import { getConversations, invalidateConversationCache } from "../services/cache"


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
    onClick: () => {},
  },
  {
    title: "Help",
    url: "#",
    icon: HandHelpingIcon,
    onClick: () => {},
  },
  {
    title: "About",
    url: "#",
    icon: HelpCircle,
    onClick: () => {},
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

  const loadConversations = React.useCallback(async () => {
    if (!isDbReady) return;
    
    try {
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      setConversations([]);
    }
  }, [isDbReady]);

  React.useEffect(() => {
    if (isDbReady) {
      loadConversations();
    }
  }, [refreshTrigger, isDbReady, loadConversations]);

  const handleDeleteConversation = React.useCallback(async (conversationId: number) => {
    if (!isDbReady || deletingIds.has(conversationId)) return;
    
    if (!confirm("Delete this conversation permanently?")) return;
    
    setDeletingIds(prev => new Set(prev).add(conversationId));
    
    try {
      await deleteConversation(conversationId);
      invalidateConversationCache();
      
      
      setConversations(prev => {
        const updated = prev.filter(conv => conv.id !== conversationId);
        
        
        if (currentConversationId === conversationId) {
          const nextConversation = updated[0];
          onConversationSelect?.(nextConversation ? nextConversation.id : null);
        }
        
        return updated;
      });
    } catch (error) {
      alert("Failed to delete conversation");
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    }
  }, [isDbReady, deletingIds, currentConversationId, onConversationSelect, conversations]);
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
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
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
    </Sidebar>
  )
}