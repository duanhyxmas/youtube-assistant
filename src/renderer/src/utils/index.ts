/**
 * get video url
 *
 * @param videoId video id
 * @returns video url
 */
export const getVideoUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`
}
