import { ElectronAPI } from '@electron-toolkit/preload'
import { DownloadEntity } from '@common/types/entity'

declare global {
  interface Window {
    electron: ElectronAPI & {}
    api: {
      appInitialize: () => Promise<AppInitializeResult | void>
      fileExists: (value: string) => Promise<boolean>
      openDirectory: (value: string) => Promise<BaseResult>
      openFile: (value: string) => Promise<BaseResult>
      playVideo: (value: string) => Promise<BaseResult>
      selectDirectory: () => Promise<BaseResult<SelectResult>>
      selectFile: () => Promise<BaseResult<SelectResult>>
      getInstalledBrowsers: () => Promise<BaseResult<BrowserPath[]>>
      saveConfig: (value: ConfigEntity) => Promise<ConfigEntity | null>
      getFavorites: () => Promise<FavoriteEntity[]>
      addFavorite: (value: FavoriteEntity) => Promise<FavoriteEntity | null>
      updateFavorite: (value: FavoriteEntity) => Promise<FavoriteEntity | null>
      copyFavorite: (
        value: FavoriteEntity,
        originValue: FavoriteEntity
      ) => Promise<FavoriteEntity | null>
      deleteFavorite: (id: number) => Promise<boolean>
      getFavoriteVideosByFavoriteId: (favoriteId: number) => Promise<FavoriteVideoEntity[]>
      saveFavoriteVideo: (value: FavoriteVideoEntity) => Promise<FavoriteVideoEntity | null>
      deleteFavoriteVideo: (id: number) => Promise<boolean>
      getDownloads: () => Promise<DownloadEntity[]>
      addDownload: (value: DownloadEntity) => Promise<DownloadEntity | null>
      pauseDownload: (value: DownloadEntity) => Promise<DownloadEntity | null>
      resumeDownload: (value: DownloadEntity) => Promise<DownloadEntity | null>
      deleteDownload: (id: number) => Promise<boolean>
      // on changed handle
      onFavoriteVideosChanged: (callback: (id: number) => void) => Electron.IpcRenderer
      onDownloadChanged: (callback: (download: DownloadEntity) => void) => Electron.IpcRenderer
    }
  }
}

export {}
