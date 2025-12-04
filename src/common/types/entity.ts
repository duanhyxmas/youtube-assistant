import { DownloadStatus } from '@common/enum'

export type ConfigEntity = {
  key: string
  value: string
}

export type FavoriteEntity = {
  id?: number
  name: string
}

export type FavoriteVideoEntity = {
  id?: number
  favoriteId?: number
  videoId: string
  videoName: string
  videoUrl: string
  videoThumbnail: string
  videoChannelName: string
  videoPublishAt: string
}

export type DownloadEntity = {
  id?: number
  videoId: string
  videoName: string
  videoUrl: string
  videoThumbnail: string
  videoChannelName: string
  videoPublishAt: string
  filePath: string
  progressText: string
  errorText: string
  status: DownloadStatus
}
