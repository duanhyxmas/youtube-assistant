import { FC } from 'react'
import { ConfigEntity, DownloadEntity, FavoriteEntity } from '@common/types/entity'

export type FramePage = {
  title: string
  name: string
  icon?: React.ComponentType
  page: FC
}

export type Notify = {
  success: (text: string) => void
  error: (text: string) => void
  info: (text: string) => void
  warning: (text: string) => void
}

export type BaseResult<T = unknown> = {
  success: boolean
  message?: string
  value?: T
}

export type SelectResult = {
  canceled: boolean
  path?: string
}

export type ChatMessage = {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export type AppInitializeResult = {
  downloadPath: ConfigEntity
  downloadMaxProcessCount: ConfigEntity
  browserCookieFile: ConfigEntity
  browserName: ConfigEntity
  downloads: DownloadEntity[]
  favorites: FavoriteEntity[]
}

export type OptionValue = {
  label: string
  value: string
}
