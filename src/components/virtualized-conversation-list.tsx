"use client"

import * as React from "react"
import { FixedSizeList as List } from "react-window"
import {
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
import { MessageSquare, MoreHorizontal } from "lucide-react"
import { type Conversation } from "../services/database"

interface VirtualizedConversationListProps {
  conversations: Conversation[]
  currentConversationId?: number | null
  onConversationSelect?: (conversationId: number) => void
  onDeleteConversation: (conversationId: number) => void
  deletingIds: Set<number>
}

interface ItemData {
  conversations: Conversation[]
  currentConversationId?: number | null
  onConversationSelect?: (conversationId: number) => void
  onDeleteConversation: (conversationId: number) => void
  deletingIds: Set<number>
}

const ConversationItem = React.memo(({ index, style, data }: {
  index: number
  style: React.CSSProperties
  data: ItemData
}) => {
  const { conversations, currentConversationId, onConversationSelect, onDeleteConversation, deletingIds } = data
  const conversation = conversations[index]

  if (!conversation) return null

  return (
    <div style={style}>
      <SidebarMenuItem>
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
              onClick={() => onDeleteConversation(conversation.id)}
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
    </div>
  )
})

ConversationItem.displayName = "ConversationItem"

export function VirtualizedConversationList({
  conversations,
  currentConversationId,
  onConversationSelect,
  onDeleteConversation,
  deletingIds
}: VirtualizedConversationListProps) {
  const itemData: ItemData = {
    conversations,
    currentConversationId,
    onConversationSelect,
    onDeleteConversation,
    deletingIds
  }

  const listHeight = Math.min(conversations.length * 44, 400)

  return (
    <List
      height={listHeight}
      width="100%"
      itemCount={conversations.length}
      itemSize={44}
      itemData={itemData}
      overscanCount={5}
    >
      {ConversationItem}
    </List>
  )
}
