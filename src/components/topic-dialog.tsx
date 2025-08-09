import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogTitle,
     DialogHeader,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import * as React from "react";

interface TopicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateConversation?: (name: string, summary: string) => Promise<void>;
}

export function TopicDialog({ open, onOpenChange, onCreateConversation }: TopicDialogProps) {
    const [topicName, setTopicName] = React.useState("");

    const handleSubmit = async () => {
        if (topicName.trim() && onCreateConversation) {
            try {
                await onCreateConversation(topicName.trim(), `Conversation about ${topicName.trim()}`);
                setTopicName("");
                onOpenChange(false);
            } catch (error) {
                console.error("Failed to create conversation:", error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Topic</DialogTitle>
                    <DialogDescription>
                        Please enter the name of the new topic you want to create.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Topic Name</div>
                        <Input
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                            placeholder="Enter topic name..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!topicName.trim()}>
                            Create Topic
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}