export enum PathType {
  FILE,
  DIRECTORY,
  UNKNOWN
}

export enum SelectPathType {
  FILE = 'openFile',
  DIRECTORY = 'openDirectory'
}

export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum LabelType {
  SHOW_FILE = 'showFile',
  OPEN_FILE = 'openFile',
  OPEN_DIRECTORY = 'openDirectory',
  PLAY_VIDEO = 'playVideo',
  RESUME_DOWNLOAD = 'resumeDownload',
  RE_DOWNLOAD = 'ReDownload',
  PAUSE_DOWNLOAD = 'pauseDownload'
}
