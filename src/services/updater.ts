import { invoke } from "@tauri-apps/api/core"

export async function checkForUpdates() {
  try {
    const response = await fetch('https://api.github.com/repos/Tech-with-anmol/RWE/releases/latest')
    
    
    if (response.status === 404) {
      return { available: false, error: 'No releases available yet' }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const release = await response.json()
    

    if (!release.tag_name) {
      return { available: false, error: 'Invalid release data' }
    }
    
    const currentVersion = await invoke<string>('get_app_version')
    const latestVersion = release.tag_name.replace('v', '')
    
    if (latestVersion !== currentVersion) {
      return {
        available: true,
        version: latestVersion,
        date: release.published_at,
        body: release.body,
        downloadUrl: release.assets?.find((asset: any) => 
          asset.name.includes(process.platform === 'win32' ? '.msi' : 
          process.platform === 'darwin' ? '.dmg' : '.AppImage')
        )?.browser_download_url
      }
    }
    return { available: false }
  } catch (error) {
    console.error('Update check failed:', error)
    return { available: false, error: String(error) }
  }
}

export async function openDownloadPage() {
  await invoke('open_url', { url: 'https://github.com/Tech-with-anmol/RWE/releases/latest' })
}

export async function prepareForUpdate(): Promise<string> {
  return await invoke('prepare_for_update')
}

export async function exportUserData(): Promise<string> {
  return await invoke('export_user_data')
}

export async function importUserData(importPath: string): Promise<boolean> {
  return await invoke('import_user_data', { importPath })
}

export async function getDataDirectory(): Promise<string> {
  return await invoke('get_data_directory')
}
