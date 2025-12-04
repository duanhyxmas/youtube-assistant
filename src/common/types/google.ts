import { YT } from 'youtubei.js'
import { FavoriteVideoEntity } from '@common/types/entity'

export type YoutubeSearchResult = {
  continuation: YT.Search | null
  videos: FavoriteVideoEntity[]
}

export type YoutubeVideoInfo = {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration?: number
  viewCount?: number
  likeCount?: number
  dislikeCount?: number
  favoriteCount?: number
  commentCount?: number
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type GoogleSearchResult = {
  title: string
  snippet: string
  link: string
}
