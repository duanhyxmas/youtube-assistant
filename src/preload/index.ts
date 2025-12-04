import { contextBridge, ipcRenderer } from 'electron'
import { BrowserPath } from 'get-installed-browsers'
import { electronAPI } from '@electron-toolkit/preload'
import {
  ConfigEntity,
  DownloadEntity,
  FavoriteEntity,
  FavoriteVideoEntity
} from '@common/types/entity'
import {
  APP_INITIALIZE,
  DB_ADD_DOWNLOAD,
  DB_ADD_FAVORITE,
  DB_COPY_FAVORITE,
  DB_DELETE_DOWNLOAD,
  DB_DELETE_FAVORITE,
  DB_DELETE_FAVORITE_VIDEO,
  DB_GET_DOWNLOADS,
  DB_GET_FAVORITES,
  DB_GET_FAVORITE_VIDEOS_BY_FAVORITE_ID,
  DB_PAUSE_DOWNLOAD,
  DB_RESUME_DOWNLOAD,
  DB_SAVE_CONFIG,
  DB_SAVE_FAVORITE_VIDEO,
  DB_UPDATE_FAVORITE,
  DOWNLOAD_CHANGED,
  FILE_EXISTS,
  GET_INSTALLED_BROWSERS,
  OPEN_DIRECTORY,
  SELECT_DIRECTORY,
  SELECT_FILE,
  OPEN_FILE,
  FAVORITE_VIDEOS_CHANGED,
  PLAY_VIDEO
} from '@common/constants/ipc-events'
import { AppInitializeResult, BaseResult, SelectResult } from '@common/types/base'

// Custom APIs for renderer
const api = {
  appInitialize: (): Promise<AppInitializeResult | void> => ipcRenderer.invoke(APP_INITIALIZE),
  fileExists: (value: string): Promise<boolean> => ipcRenderer.invoke(FILE_EXISTS, value),
  openDirectory: (value: string): Promise<BaseResult> => ipcRenderer.invoke(OPEN_DIRECTORY, value),
  openFile: (value: string): Promise<BaseResult> => ipcRenderer.invoke(OPEN_FILE, value),
  playVideo: (value: string): Promise<BaseResult> => ipcRenderer.invoke(PLAY_VIDEO, value),
  selectDirectory: (): Promise<BaseResult<SelectResult>> => ipcRenderer.invoke(SELECT_DIRECTORY),
  selectFile: (): Promise<BaseResult<SelectResult>> => ipcRenderer.invoke(SELECT_FILE),
  getInstalledBrowsers: (): Promise<BaseResult<BrowserPath[]>> =>
    ipcRenderer.invoke(GET_INSTALLED_BROWSERS),
  saveConfig: (value: ConfigEntity): Promise<ConfigEntity | null> =>
    ipcRenderer.invoke(DB_SAVE_CONFIG, value),
  getFavorites: (): Promise<FavoriteEntity[]> => ipcRenderer.invoke(DB_GET_FAVORITES),
  addFavorite: (value: FavoriteEntity): Promise<FavoriteEntity | null> =>
    ipcRenderer.invoke(DB_ADD_FAVORITE, value),
  updateFavorite: (value: FavoriteEntity): Promise<FavoriteEntity | null> =>
    ipcRenderer.invoke(DB_UPDATE_FAVORITE, value),
  copyFavorite: (
    value: FavoriteEntity,
    originValue: FavoriteEntity
  ): Promise<FavoriteEntity | null> => ipcRenderer.invoke(DB_COPY_FAVORITE, value, originValue),
  deleteFavorite: (id: number): Promise<boolean> => ipcRenderer.invoke(DB_DELETE_FAVORITE, id),
  getFavoriteVideosByFavoriteId: (favoriteId: number): Promise<FavoriteVideoEntity[]> =>
    ipcRenderer.invoke(DB_GET_FAVORITE_VIDEOS_BY_FAVORITE_ID, favoriteId),
  saveFavoriteVideo: (value: FavoriteVideoEntity): Promise<FavoriteVideoEntity | null> =>
    ipcRenderer.invoke(DB_SAVE_FAVORITE_VIDEO, value),
  deleteFavoriteVideo: (id: number): Promise<boolean> =>
    ipcRenderer.invoke(DB_DELETE_FAVORITE_VIDEO, id),
  getDownloads: (): Promise<DownloadEntity[]> => ipcRenderer.invoke(DB_GET_DOWNLOADS),
  addDownload: (value: DownloadEntity): Promise<DownloadEntity | null> =>
    ipcRenderer.invoke(DB_ADD_DOWNLOAD, value),
  pauseDownload: (value: DownloadEntity): Promise<DownloadEntity | null> =>
    ipcRenderer.invoke(DB_PAUSE_DOWNLOAD, value),
  resumeDownload: (value: DownloadEntity): Promise<DownloadEntity | null> =>
    ipcRenderer.invoke(DB_RESUME_DOWNLOAD, value),
  deleteDownload: (id: number): Promise<boolean> => ipcRenderer.invoke(DB_DELETE_DOWNLOAD, id),
  // on changed
  onFavoriteVideosChanged: (callback: (id: number) => void) =>
    ipcRenderer.on(FAVORITE_VIDEOS_CHANGED, (_event, value) => callback(value)),
  onDownloadChanged: (callback: (download: DownloadEntity) => void) =>
    ipcRenderer.on(DOWNLOAD_CHANGED, (_event, value) => callback(value))
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI
  }
  // @ts-ignore (define in dts)
  window.api = api
}
