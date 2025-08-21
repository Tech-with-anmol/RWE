import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiKey, setApiKey } from "@/services/database";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet: () => void;
}

export function ApiKeyDialog({ open, onOpenChange, onApiKeySet }: ApiKeyDialogProps) {
  const [apiKey, setApiKeyValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      loadApiKey();
    }
  }, [open]);

  const loadApiKey = async () => {
    try {
      const key = await getApiKey();
      if (key) {
        setApiKeyValue(key);
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setSaving(true);
    try {
      await setApiKey(apiKey.trim());
      onApiKeySet();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save API key:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Gemini API Key</DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API key to start chatting. You can get a free API key from Google AI Studio.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">API Key</div>
            <Input
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
            >
              Get API Key
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!apiKey.trim() || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
