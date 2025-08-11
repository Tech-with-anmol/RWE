import * as React from "react"
import { invoke } from "@tauri-apps/api/core"
import { Search, FileText, MessageCircle, User, Calendar, Clock, Zap, Filter } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const [searchNotes, setSearchNotes] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setSearchTime(null)
      setSearchNotes(false)
    }
  }, [open])

  React.useEffect(() => {
    if (query.trim() && query.length >= 2) {
      handleSearch(query.trim())
    } else {
      setResults([])
      setSearchTime(null)
    }
  }, [query, searchNotes])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return
    
    setLoading(true)
    try {
      const startTime = Date.now()
      const searchResults = await invoke<SearchResult[]>("search_content", { 
        query: searchQuery,
        search_notes: searchNotes
      })
      const endTime = Date.now()
      setSearchTime(endTime - startTime)
      setResults(searchResults || [])
    } catch (error) {
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
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3 py-2">
        <CommandInput
          placeholder="Search conversations and messages..."
          value={query}
          onValueChange={setQuery}
          className="flex-1 border-none focus:ring-0 text-sm font-normal antialiased"
        />
        <Button
          variant={searchNotes ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchNotes(!searchNotes)}
          className={`ml-2 h-7 px-3 text-xs font-medium transition-all ${
            searchNotes 
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
              : "bg-transparent border hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Filter className="h-3 w-3 mr-1" />
          Include Notes
        </Button>
      </div>
      
      <CommandList className="max-h-[400px] overflow-y-auto">
        {loading && (
          <div className="p-6 text-center text-muted-foreground">
            <Zap className="h-5 w-5 animate-spin mx-auto mb-3" />
            <div className="text-sm font-medium">Searching...</div>
          </div>
        )}
        
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          No results found for "{query}".
        </CommandEmpty>
        
        {searchTime !== null && results.length > 0 && (
          <div className="px-4 py-3 text-xs text-muted-foreground border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">{results.length} result{results.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {searchTime}ms
              </span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <CommandGroup heading="Search Results" className="p-0">
            {results.map((result) => {
              const Icon = getIcon(result.content_type)
              return (
                <CommandItem
                  key={`${result.content_type}-${result.id}`}
                  onSelect={() => handleResultSelect(result)}
                  className="flex items-start space-x-3 p-4 m-1 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium truncate text-foreground antialiased">
                        {result.conversation_name}
                      </h4>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
                        {result.content_type === "message_user" ? "user" : 
                         result.content_type === "message_ai" ? "assistant" : 
                         result.content_type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                        {Math.round(result.relevance_score)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed antialiased">
                      {result.snippet}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(result.created_at)}
                    </div>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}