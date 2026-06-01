import { app, BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC } from '../shared/ipc'
import { UpdateStatus } from '../shared/types'

const { autoUpdater } = electronUpdater

let lastStatus: UpdateStatus = { state: 'idle' }

function broadcast(status: UpdateStatus): void {
  lastStatus = status
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) continue
    try {
      win.webContents.send(IPC.EvtUpdate, status)
    } catch {
      /* окно закрылось — игнорируем */
    }
  }
}

export function getUpdateStatus(): UpdateStatus {
  return lastStatus
}

/**
 * Настраивает авто-обновление через GitHub Releases.
 * В dev-режиме (не упаковано) обновления отключены — electron-updater требует
 * установленного приложения и файла app-update.yml.
 */
export function initUpdater(): void {
  if (!app.isPackaged) {
    broadcast({ state: 'disabled', message: 'Обновления доступны только в установленной версии' })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => broadcast({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', (info) =>
    broadcast({ state: 'not-available', version: info.version })
  )
  autoUpdater.on('download-progress', (p) =>
    broadcast({ state: 'downloading', percent: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (err) =>
    broadcast({ state: 'error', message: err == null ? 'unknown' : (err as Error).message })
  )

  // Проверка при старте и далее раз в 30 минут.
  void checkForUpdates()
  setInterval(() => void checkForUpdates(), 30 * 60 * 1000)
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  if (!app.isPackaged) return lastStatus
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    broadcast({ state: 'error', message: (err as Error).message })
  }
  return lastStatus
}

/** Перезапускает приложение и устанавливает скачанное обновление. */
export function installUpdate(): void {
  if (lastStatus.state === 'downloaded') {
    autoUpdater.quitAndInstall()
  }
}
