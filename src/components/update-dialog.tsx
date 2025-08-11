"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { checkForUpdates, prepareForUpdate, openDownloadPage } from "@/services/updater"

interface UpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateDialog({ open, onOpenChange }: UpdateDialogProps) {
  const [updateInfo, setUpdateInfo] = React.useState<any>(null)
  const [checking, setChecking] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)

  const handleCheckForUpdates = async () => {
    setChecking(true)
    try {
      const update = await checkForUpdates()
      setUpdateInfo(update)
    } catch (error) {
      console.error('Update check failed:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleUpdate = async () => {
    setDownloading(true)
    try {
      await prepareForUpdate()
      await openDownloadPage()
      onOpenChange(false)
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      handleCheckForUpdates()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>App Updates</DialogTitle>
          <DialogDescription>
            Check for and install app updates. Your data will be automatically backed up before any update.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {checking && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Checking for updates...</p>
            </div>
          )}
          
          {updateInfo && !checking && (
            <div className="space-y-4">
              {updateInfo.available ? (
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold">Update Available: v{updateInfo.version}</h3>
                    {updateInfo.date && (
                      <p className="text-sm text-muted-foreground">Released: {new Date(updateInfo.date).toLocaleDateString()}</p>
                    )}
                    {updateInfo.body && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Release Notes:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{updateInfo.body}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} disabled={downloading} className="flex-1">
                      {downloading ? (
                        <>
                          <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Opening Download...
                        </>
                      ) : (
                        'Download Update'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Later
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Your data will be automatically backed up. Download and install the new version manually, then restart the app.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">You're running the latest version!</p>
                  <Button variant="outline" onClick={handleCheckForUpdates} className="mt-2">
                    Check Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
