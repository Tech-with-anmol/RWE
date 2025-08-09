import { HandHelpingIcon, HelpCircle, Home, Search, Settings, MoreHorizontal, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { deleteConversation, type Conversation } from "./load-data"
import { getConversations, invalidateConversationCache } from "../services/cache"
import * as React from "react"


const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
  {
    title: "Help",
    url: "#",
    icon: HandHelpingIcon, 
  },
  {
    title: "About",
    url: "#",
    icon: HelpCircle,
  },
]

interface AppSidebarProps {
  onConversationSelect?: (conversationId: number) => void;
  currentConversationId?: number | null;
  refreshTrigger?: number;
  isDbReady?: boolean;
}

export function AppSidebar({ onConversationSelect, currentConversationId, refreshTrigger, isDbReady }: AppSidebarProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);

  const loadConversations = React.useCallback(async () => {
    if (!isDbReady) return;
    
    try {
      const convos = await getConversations();
      setConversations(convos);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [isDbReady]);

  React.useEffect(() => {
    if (isDbReady) {
      loadConversations();
    }
  }, [loadConversations, refreshTrigger, isDbReady]);

  React.useEffect(() => {
    if (!isDbReady) return;
    
    const interval = setInterval(loadConversations, 2000);
    return () => clearInterval(interval);
  }, [loadConversations, isDbReady]);

  const handleDeleteConversation = React.useCallback(async (conversationId: number) => {
    try {
      await deleteConversation(conversationId);
      invalidateConversationCache();
      await loadConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }, [loadConversations]);
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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
              {conversations.map((conversation) => (
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
                      >
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}