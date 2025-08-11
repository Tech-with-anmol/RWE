"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TopicAnalyticsChart } from "./topic-analytics-chart"

interface AnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnalysisDialog({ open, onOpenChange }: AnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Topic Analytics</DialogTitle>
          <DialogDescription>
            Analyze your topic creation patterns over time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <TopicAnalyticsChart />
        </div>
      </DialogContent>
    </Dialog>
  )
}
