import { dialog, shell } from 'electron'
import { existsSync, statSync } from 'fs'
import { BrowserPath, GetInstalledBrowsers } from 'get-installed-browsers'

import { PathType, SelectPathType } from '@common/enum'
import { BaseResult, SelectResult } from '@common/types/base'
import Log from '@main/log'
import MainWindowHelper from '@main/helpers/main-window-helper'

/**
 * check path exists
 *
 * @param path the path
 *
 * @returns true if path exists, false otherwise
 */
export function pathExists(path: string): boolean {
  try {
    return existsSync(path)
  } catch (e: unknown) {
    Log.error('Error checking file existence:', e)
    return false
  }
}

/**
 * get path type
 *
 * @param path the path
 *
 * @returns the path type
 */
export function getPathType(path: string): PathType {
  try {
    const stats = statSync(path)
    if (stats.isFile()) {
      return PathType.FILE
    } else if (stats.isDirectory()) {
      return PathType.DIRECTORY
    }
    return PathType.UNKNOWN
  } catch (e: unknown) {
    Log.error('Error checking path type:', e)
    return PathType.UNKNOWN
  }
}

/**
 * open path
 *
 * @param path the path
 *
 * @returns the open result
 */
export async function openPath(path: string): Promise<BaseResult> {
  if (!pathExists(path)) {
    return { success: false, message: 'path not exists' }
  }
  try {
    const result = await shell.openPath(path)
    if (!result) {
      return { success: true }
    }
    return { success: false, message: result || 'open path failed' }
  } catch (e: unknown) {
    Log.error('Error opening path:', e)
    return { success: false, message: e instanceof Error ? e.message : 'open path failed' }
  }
}

/**
 * show file
 *
 * @param path the path
 *
 * @returns the open result
 */
export async function showFile(path: string): Promise<BaseResult> {
  if (!pathExists(path)) {
    return { success: false, message: 'path not exists' }
  }
  const pathType = getPathType(path)
  if (pathType !== PathType.FILE) {
    return { success: false, message: 'path is not a file' }
  }
  try {
    shell.showItemInFolder(path)
    return { success: true }
  } catch (e: unknown) {
    Log.error('Error opening path:', e)
    return { success: false, message: e instanceof Error ? e.message : 'open path failed' }
  }
}

/**
 * select path
 *
 * @param type the path type
 *
 * @returns the select result
 */
export async function selectPath(type: SelectPathType): Promise<BaseResult<SelectResult>> {
  const mainWindow = MainWindowHelper.instance.mainWindow
  if (!mainWindow) {
    return { success: false, message: 'main window not exists' }
  }
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: [type]
    })
    return {
      success: true,
      value: { canceled: result.canceled, path: result.canceled ? '' : result.filePaths[0] }
    }
  } catch (e: unknown) {
    Log.error('Error opening path:', e)
    return { success: false, message: e instanceof Error ? e.message : 'open path failed' }
  }
}

/**
 * get installed browsers
 *
 * @returns the installed browsers
 */
export function getInstalledBrowsers(): BaseResult<BrowserPath[]> {
  try {
    const browsers = GetInstalledBrowsers()
    return { success: true, value: browsers }
  } catch (e) {
    Log.error(`get installed browsers failed: ${e}`)
    return {
      success: false,
      message: e instanceof Error ? e.message : 'get installed browsers failed'
    }
  }
}
