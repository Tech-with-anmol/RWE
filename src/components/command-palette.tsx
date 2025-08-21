import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MessageSquarePlus, Search, FileText, Lightbulb, Brain, Pen, Settings } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommand: (command: string) => void;
}

export function CommandPalette({ open, onOpenChange, onCommand }: CommandPaletteProps) {
  const runCommand = React.useCallback((command: string) => {
    onCommand(command);
    onOpenChange(false);
  }, [onCommand, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search... (Ctrl+P to open)" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand('new-topic')}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                <span>New Topic</span>
                <div className="ml-auto text-xs">Ctrl+N</div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand('search')}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search Conversations</span>
                <div className="ml-auto text-xs">Ctrl+K</div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              <CommandItem onSelect={() => runCommand('tab-ai')}>
                <Brain className="mr-2 h-4 w-4" />
                <span>AI Chat</span>
                <div className="ml-auto text-xs">Ctrl+1</div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand('tab-notes')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Notes</span>
                <div className="ml-auto text-xs">Ctrl+2</div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand('tab-summary')}>
                <Lightbulb className="mr-2 h-4 w-4" />
                <span>Summary</span>
                <div className="ml-auto text-xs">Ctrl+3</div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand('tab-mindmap')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Mind Map</span>
                <div className="ml-auto text-xs">Ctrl+4</div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand('tab-whiteboard')}>
                <Pen className="mr-2 h-4 w-4" />
                <span>Whiteboard</span>
                <div className="ml-auto text-xs">Ctrl+5</div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
