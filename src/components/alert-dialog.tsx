import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
}

export function AlertDialog({
  open,
  onOpenChange,
  title = "Alert",
  description,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
  variant = "default"
}: AlertDialogProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          {cancelText && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {cancelText}
            </Button>
          )}
          <Button 
            type="button" 
            variant={variant} 
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function useAlert() {
  const [alertState, setAlertState] = React.useState<{
    open: boolean
    title?: string
    description: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onCancel?: () => void
    variant?: "default" | "destructive"
  }>({
    open: false,
    description: ""
  })

  const showAlert = React.useCallback((config: Omit<typeof alertState, "open">) => {
    setAlertState({ ...config, open: true })
  }, [])

  const hideAlert = React.useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }))
  }, [])

  const AlertComponent = React.useCallback(() => (
    <AlertDialog
      {...alertState}
      onOpenChange={hideAlert}
    />
  ), [alertState, hideAlert])

  return { showAlert, AlertComponent }
}
