import { app, ipcMain } from 'electron'
import { BrowserPath } from 'get-installed-browsers'

import { join } from 'path'

import {
  APP_INITIALIZE,
  DB_ADD_DOWNLOAD,
  DB_ADD_FAVORITE,
  DB_COPY_FAVORITE,
  DB_DELETE_DOWNLOAD,
  DB_DELETE_FAVORITE,
  DB_DELETE_FAVORITE_VIDEO,
  DB_GET_DOWNLOADS,
  DB_GET_FAVORITE_VIDEOS_BY_FAVORITE_ID,
  DB_GET_FAVORITES,
  DB_PAUSE_DOWNLOAD,
  DB_RESUME_DOWNLOAD,
  DB_SAVE_CONFIG,
  DB_SAVE_FAVORITE_VIDEO,
  DB_UPDATE_FAVORITE,
  FAVORITE_VIDEOS_CHANGED,
  FILE_EXISTS,
  GET_INSTALLED_BROWSERS,
  OPEN_DIRECTORY,
  OPEN_FILE,
  PLAY_VIDEO,
  SELECT_DIRECTORY,
  SELECT_FILE
} from '@common/constants/ipc-events'
import { AppInitializeResult, BaseResult, SelectResult } from '@common/types/base'
import {
  ConfigEntity,
  DownloadEntity,
  FavoriteEntity,
  FavoriteVideoEntity
} from '@common/types/entity'
import {
  BROWSER_COOKIE_FILE,
  BROWSER_NAME,
  DOWNLOAD_MAX_PROCESS_COUNT,
  DOWNLOAD_PATH
} from '@common/constants/config-key'
import { DEFAULT_DOWNLOAD_DIRECTORY, DEFAULT_DOWNLOAD_MIN_PROCESS } from '@common/constants'
import { DownloadStatus, SelectPathType } from '@common/enum'
import MainWindowHelper from '@main/helpers/main-window-helper'
import DatabaseHelper from '@main/helpers/database-helper'
import DownloadHelper from '@main/helpers/download-helper'
import { getInstalledBrowsers, openPath, pathExists, selectPath, showFile } from '@main/utils'
import Log from '@main/log'

export default class IpcMainHelper {
  // singleton, the instance of IpcMainHelper
  private static _instance: IpcMainHelper | null = null

  /**
   * constructor
   * listen ipc main handle
   */
  constructor() {
    this._listenIpc()
  }
  /**
   * get the instance of IpcMainHelper
   *
   * @returns the instance of IpcMainHelper
   */
  public static instance(): IpcMainHelper {
    if (!this._instance) {
      this._instance = new IpcMainHelper()
    }
    return this._instance
  }

  /**
   * listen ipc main
   */
  private _listenIpc(): void {
    ipcMain.handle(APP_INITIALIZE, async (): Promise<AppInitializeResult | void> => {
      try {
        // get configs
        const configs: ConfigEntity[] = DatabaseHelper.instance.getConfigs()

        // download path config
        let downloadPath: ConfigEntity | null = null

        // download max process count config
        let downloadMaxProcessCount: ConfigEntity | null = null

        // browser cookie file config
        let browserCookieFile: ConfigEntity | null = null

        // browser name config
        let browserName: ConfigEntity | null = null

        // find configs
        configs.forEach((config: ConfigEntity) => {
          if (config.key === DOWNLOAD_PATH) {
            downloadPath = config
          } else if (config.key === DOWNLOAD_MAX_PROCESS_COUNT) {
            downloadMaxProcessCount = config
          } else if (config.key === BROWSER_COOKIE_FILE) {
            browserCookieFile = config
          } else if (config.key === BROWSER_NAME) {
            browserName = config
          }
        })

        // if not found download path config, create default download path config
        if (!downloadPath) {
          downloadPath = {
            key: DOWNLOAD_PATH,
            value: join(app.getPath('userData'), DEFAULT_DOWNLOAD_DIRECTORY)
          }
          DatabaseHelper.instance.saveConfig(downloadPath)
        }

        // if not found download max process count config, create default download max process count config
        if (!downloadMaxProcessCount) {
          downloadMaxProcessCount = {
            key: DOWNLOAD_MAX_PROCESS_COUNT,
            value: DEFAULT_DOWNLOAD_MIN_PROCESS.toString()
          }
          DatabaseHelper.instance.saveConfig(downloadMaxProcessCount)
        }

        // if not found browser cookie file config, create default browser cookie file config
        if (!browserCookieFile) {
          browserCookieFile = {
            key: BROWSER_COOKIE_FILE,
            value: ''
          }
          DatabaseHelper.instance.saveConfig(browserCookieFile)
        }

        // if not found browser name config, create default browser name config
        if (!browserName) {
          browserName = {
            key: BROWSER_NAME,
            value: ''
          }
          DatabaseHelper.instance.saveConfig(browserName)
        }

        DatabaseHelper.instance.setDownloadPending()

        // get favorites
        const favorites: FavoriteEntity[] = DatabaseHelper.instance.getFavorites()

        // get downloads
        const downloads: DownloadEntity[] = DatabaseHelper.instance.getDownloads()

        // set download path
        DownloadHelper.instance.setDownloadPath(downloadPath.value)

        // set max process count
        DownloadHelper.instance.setMaxProcessCount(Number(downloadMaxProcessCount.value))

        // set browser cookie file
        if (browserCookieFile) {
          DownloadHelper.instance.setBrowserCookieFile(browserCookieFile.value)
        }

        // set browser name
        if (browserName) {
          DownloadHelper.instance.setBrowserName(browserName.value)
        }

        const taskDownloads = downloads.filter(
          (download: DownloadEntity) =>
            download.status === DownloadStatus.DOWNLOADING ||
            download.status === DownloadStatus.PENDING
        )

        if (taskDownloads.length > 0) {
          DownloadHelper.instance.addDownloads(...taskDownloads)
        }

        return {
          downloadPath,
          downloadMaxProcessCount,
          browserCookieFile,
          browserName,
          favorites,
          downloads
        }
      } catch (e: unknown) {
        Log.error(`init failed: ${e}`)
        MainWindowHelper.instance.setQuit()
        app.quit()
      }
    })

    ipcMain.handle(FILE_EXISTS, (_event, path): boolean => {
      return pathExists(path)
    })

    ipcMain.handle(PLAY_VIDEO, (_event, path): Promise<BaseResult> => {
      return openPath(path)
    })

    ipcMain.handle(OPEN_DIRECTORY, (_event, path): Promise<BaseResult> => {
      const directoryPath = join(path, '..')
      return openPath(directoryPath)
    })

    ipcMain.handle(OPEN_FILE, (_event, path): Promise<BaseResult> => {
      return showFile(path)
    })

    ipcMain.handle(SELECT_DIRECTORY, (): Promise<BaseResult<SelectResult>> => {
      return selectPath(SelectPathType.DIRECTORY)
    })

    ipcMain.handle(SELECT_FILE, (): Promise<BaseResult<SelectResult>> => {
      return selectPath(SelectPathType.FILE)
    })

    ipcMain.handle(GET_INSTALLED_BROWSERS, (): BaseResult<BrowserPath[]> => {
      return getInstalledBrowsers()
    })

    ipcMain.handle(DB_SAVE_CONFIG, (_event, config: ConfigEntity): ConfigEntity | null => {
      const result = DatabaseHelper.instance.saveConfig(config)
      if (result) {
        if (config.key === DOWNLOAD_PATH) {
          DownloadHelper.instance.setDownloadPath(config.value)
        } else if (config.key === DOWNLOAD_MAX_PROCESS_COUNT) {
          DownloadHelper.instance.setMaxProcessCount(Number(config.value))
        } else if (config.key === BROWSER_COOKIE_FILE) {
          DownloadHelper.instance.setBrowserCookieFile(config.value)
        } else if (config.key === BROWSER_NAME) {
          DownloadHelper.instance.setBrowserName(config.value)
        }
      }
      return result
    })

    ipcMain.handle(DB_GET_FAVORITES, (): FavoriteEntity[] => {
      return DatabaseHelper.instance.getFavorites()
    })

    ipcMain.handle(DB_ADD_FAVORITE, (_event, favorite: FavoriteEntity): FavoriteEntity | null => {
      return DatabaseHelper.instance.addFavorite(favorite)
    })

    ipcMain.handle(
      DB_UPDATE_FAVORITE,
      (_event, favorite: FavoriteEntity): FavoriteEntity | null => {
        return DatabaseHelper.instance.updateFavorite(favorite)
      }
    )

    ipcMain.handle(
      DB_COPY_FAVORITE,
      (_event, favorite: FavoriteEntity, originFavorite: FavoriteEntity): FavoriteEntity | null => {
        return DatabaseHelper.instance.copyFavorite(favorite, originFavorite)
      }
    )

    ipcMain.handle(DB_DELETE_FAVORITE, (_event, favoriteId: number): boolean => {
      return DatabaseHelper.instance.deleteFavorite(favoriteId)
    })

    ipcMain.handle(
      DB_GET_FAVORITE_VIDEOS_BY_FAVORITE_ID,
      (_event, favoriteId: number): FavoriteVideoEntity[] => {
        return DatabaseHelper.instance.getFavoriteVideosByFavoriteId(favoriteId)
      }
    )

    ipcMain.handle(
      DB_SAVE_FAVORITE_VIDEO,
      (_event, favoriteVideo: FavoriteVideoEntity): FavoriteVideoEntity | null => {
        const result = DatabaseHelper.instance.saveFavoriteVideo(favoriteVideo)
        if (result) {
          MainWindowHelper.instance.sendBroadcast(FAVORITE_VIDEOS_CHANGED, result.favoriteId)
        }
        return result
      }
    )

    ipcMain.handle(DB_DELETE_FAVORITE_VIDEO, (_event, favoriteVideoId: number): boolean => {
      return DatabaseHelper.instance.deleteFavoriteVideo(favoriteVideoId)
    })

    ipcMain.handle(DB_GET_DOWNLOADS, (): DownloadEntity[] => {
      return DatabaseHelper.instance.getDownloads()
    })

    ipcMain.handle(DB_ADD_DOWNLOAD, (_event, download: DownloadEntity): DownloadEntity | null => {
      download.status = DownloadStatus.PENDING
      download.progressText = '0'
      download.errorText = ''
      const result = DatabaseHelper.instance.saveDownload(download)
      if (result) {
        DownloadHelper.instance.addDownloads(result)
      }
      return result
    })

    ipcMain.handle(DB_PAUSE_DOWNLOAD, (_event, download: DownloadEntity): DownloadEntity | null => {
      download.status = DownloadStatus.PAUSED
      const result = DatabaseHelper.instance.updateProcess(download)
      if (result) {
        DownloadHelper.instance.deleteDownload(result.id!)
      }
      return result
    })

    ipcMain.handle(
      DB_RESUME_DOWNLOAD,
      (_event, download: DownloadEntity): DownloadEntity | null => {
        download.status = DownloadStatus.PENDING
        const result = DatabaseHelper.instance.updateProcess(download)
        if (result) {
          DownloadHelper.instance.addDownloads(result)
        }
        return result
      }
    )

    ipcMain.handle(DB_DELETE_DOWNLOAD, (_event, downloadId: number): boolean => {
      const result = DatabaseHelper.instance.deleteDownload(downloadId)
      if (result) {
        DownloadHelper.instance.deleteDownload(downloadId)
      }
      return result
    })
  }
}
