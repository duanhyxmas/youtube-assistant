import Innertube, { YT } from 'youtubei.js'
import { SearchFilters } from 'node_modules/youtubei.js/dist/src/types'

import { FavoriteVideoEntity } from '@common/types/entity'
import { YoutubeSearchResult } from '@common/types/google'

import Log from '@renderer/utils/log'

let searchInnertube: Innertube | null = null

const MAX_SUGGESTION_LENGTH = 100

const innertubeCreate = async (): Promise<Innertube> => {
  try {
    return Innertube.create({
      // Disable session cache, consistent with FreeTube
      enable_session_cache: false,
      retrieve_innertube_config: false,
      user_agent: navigator.userAgent,
      retrieve_player: false, // Do not retrieve player info
      location: undefined,
      enable_safety_mode: false,
      client_type: undefined,
      // Use fetch method provided by electron
      fetch: (input, init) => fetch(input, init),
      cache: undefined,
      generate_session_locally: true
    })
  } catch (e) {
    Log.error(e)
    throw new Error('create InnerTube fail')
  }
}

const formatYoutubeVideoResult = (response: YT.Search): YoutubeSearchResult => {
  const videos: FavoriteVideoEntity[] = response.results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => {
      if (item.type !== 'Video') {
        return false
      }
      const video = item
      if (!video.thumbnail_overlays) {
        return true
      }
      const timeStatus = video.thumbnail_overlays.find((overlay) => {
        return overlay.type === 'ThumbnailOverlayTimeStatus'
      })
      return !timeStatus || timeStatus.style !== 'SHORTS'
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const video = item
      return {
        videoId: video.id,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        videoName: video.title?.text ?? '',
        videoChannelName: video.author?.name,
        videoThumbnail: video.thumbnails?.[0].url,
        videoPublishAt: video.published?.text ?? ''
      }
    })
  return {
    videos: videos,
    continuation: response.has_continuation && videos.length > 0 ? response : null
  }
}

export const youtubeVideoSearch = async (
  keywords: string | undefined | null = ''
): Promise<YoutubeSearchResult> => {
  if (keywords === null || keywords === undefined || !keywords.trim()) {
    throw new Error(' pelease input avaliable keywords')
  }
  const filters: SearchFilters = {
    type: 'video'
  }
  try {
    const innertube: Innertube = await innertubeCreate()
    const response: YT.Search = await innertube.search(keywords, filters)
    return formatYoutubeVideoResult(response)
  } catch (e) {
    console.error(e)
    throw e
  }
}

export const youtubeVideoLoadmore = async (
  continuation: YT.Search
): Promise<YoutubeSearchResult> => {
  const response = await continuation.getContinuation()
  return formatYoutubeVideoResult(response)
}

export const youtubeSearchSuggestion = async (
  keywords: string | undefined | null = ''
): Promise<string[]> => {
  if (
    keywords === null ||
    keywords === undefined ||
    !keywords.trim() ||
    keywords.length > MAX_SUGGESTION_LENGTH
  ) {
    return []
  }

  if (!searchInnertube) {
    searchInnertube = await innertubeCreate()
  }
  const response: string[] = await searchInnertube.getSearchSuggestions(keywords)
  return response
}
