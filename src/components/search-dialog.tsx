import * as React from "react"
import { invoke } from "@tauri-apps/api/core"
import { Search, FileText, MessageCircle, User, Calendar, Clock, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { type SearchResult } from "@/services/search-types"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResultSelect?: (conversationId: number) => void
}

export function SearchDialog({ open, onOpenChange, onResultSelect }: SearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTime, setSearchTime] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setSearchTime(null)
    }
  }, [open])

  React.useEffect(() => {
    if (query.trim() && query.length >= 2) {
      handleSearch(query.trim())
    } else {
      setResults([])
      setSearchTime(null)
    }
  }, [query])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return
    
    setLoading(true)
    try {
      const startTime = Date.now()
      const searchResults = await invoke<SearchResult[]>("search_content", { 
        query: searchQuery
      })
      const endTime = Date.now()
      setSearchTime(endTime - startTime)
      setResults(searchResults || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
      setSearchTime(null)
    } finally {
      setLoading(false)
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result.conversation_id)
    onOpenChange(false)
  }

  const getIcon = (contentType: string) => {
    switch (contentType) {
      case "conversation":
        return MessageCircle
      case "summary":
        return FileText
      case "notes":
        return FileText
      case "message_user":
        return User
      case "message_ai":
        return MessageCircle
      default:
        return Search
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">Search Conversations</DialogTitle>
        <DialogDescription className="sr-only">Search through your conversations and messages to find specific content.</DialogDescription>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations and messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="min-h-[200px] max-h-[400px]">
            {loading && (
              <div className="p-6 text-center text-muted-foreground">
                <Zap className="h-5 w-5 animate-spin mx-auto mb-3" />
                <div className="text-sm font-medium">Searching...</div>
              </div>
            )}
            
            {!loading && query.trim() && query.length >= 2 && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found for "{query}".
              </div>
            )}
            
            {!loading && (!query.trim() || query.length < 2) && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search...
              </div>
            )}
            
            {searchTime !== null && results.length > 0 && (
              <div className="px-4 py-3 text-xs text-muted-foreground border-b bg-muted">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                      {searchTime}ms
                    </Badge>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      search time
                    </span>
                  </div>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-[350px] overflow-y-auto">
                <div className="space-y-2 p-2">
                  {results.map((result) => {
                    const Icon = getIcon(result.content_type)
                    return (
                      <div
                        key={`${result.content_type}-${result.id}`}
                        onClick={() => handleResultSelect(result)}
                        className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer border"
                      >
                        <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium truncate">
                              {result.conversation_name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {result.content_type === "message_user" ? "user" : 
                               result.content_type === "message_ai" ? "assistant" : 
                               result.content_type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {Math.round(result.relevance_score)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.snippet}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(result.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}