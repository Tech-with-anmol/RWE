"use client"

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UpdateDialog } from "./update-dialog";
import { exportUserData, importUserData } from "@/services/updater";
import { backupDatabase, getDatabaseInfo } from "@/services/database";

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false)
  const [dbInfo, setDbInfo] = React.useState<any>(null)
  const [exporting, setExporting] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [backing, setBacking] = React.useState(false)

  const loadDbInfo = async () => {
    try {
      const info = await getDatabaseInfo()
      setDbInfo(info)
    } catch (error) {
      console.error('Failed to load database info:', error)
    }
  }

  React.useEffect(() => {
    if (open) {
      loadDbInfo()
    }
  }, [open])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportPath = await exportUserData()
      alert(`Data exported successfully to: ${exportPath}`)
    } catch (error) {
      alert(`Export failed: ${error}`)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.db'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            const reader = new FileReader()
            reader.onload = async () => {
              try {
                await importUserData(file.name)
                alert('Data imported successfully! Please restart the app.')
              } catch (error) {
                alert(`Import failed: ${error}`)
              }
            }
            reader.readAsArrayBuffer(file)
          } catch (error) {
            alert(`Import failed: ${error}`)
          }
        }
        setImporting(false)
      }
      input.click()
    } catch (error) {
      alert(`Import failed: ${error}`)
      setImporting(false)
    }
  }

  const handleBackup = async () => {
    setBacking(true)
    try {
      const backupPath = await backupDatabase()
      alert(`Backup created successfully at: ${backupPath}`)
    } catch (error) {
      alert(`Backup failed: ${error}`)
    } finally {
      setBacking(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your app settings and data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">App Updates</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check for and install app updates</p>
                  <p className="text-xs text-muted-foreground">Current version: {dbInfo?.app_version || 'Unknown'}</p>
                </div>
                <Button onClick={() => setUpdateDialogOpen(true)}>
                  Check for Updates
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Data Management</h3>
              
              {dbInfo && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Database Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Conversations: {dbInfo.conversations_count}</div>
                    <div>Messages: {dbInfo.messages_count}</div>
                    <div>Schema Version: {dbInfo.schema_version}</div>
                    <div>Database Size: {formatBytes(dbInfo.database_size_bytes)}</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Export Data</p>
                    <p className="text-sm text-muted-foreground">Create a backup file on your desktop</p>
                  </div>
                  <Button onClick={handleExport} disabled={exporting}>
                    {exporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Import Data</p>
                    <p className="text-sm text-muted-foreground">Restore from a backup file</p>
                  </div>
                  <Button onClick={handleImport} disabled={importing} variant="outline">
                    {importing ? 'Importing...' : 'Import'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Create Backup</p>
                    <p className="text-sm text-muted-foreground">Manual backup to backups folder</p>
                  </div>
                  <Button onClick={handleBackup} disabled={backing} variant="outline">
                    {backing ? 'Creating...' : 'Backup'}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">About</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>RWE - Research With Ease</p>
                <p>Version: {dbInfo?.app_version || 'Unknown'}</p>
                <p>Data is automatically backed up before updates</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <UpdateDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen} />
    </>
  )
}
