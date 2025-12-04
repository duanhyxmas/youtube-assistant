import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DownloadEntity } from '@common/types/entity'

/**
 * download state
 */
export interface DownloadsState {
  downloads: DownloadEntity[]
  downloadMap: Record<string, DownloadEntity>
}

const initialState: DownloadsState = {
  downloads: [],
  downloadMap: {}
}

export const downloadSlice = createSlice({
  name: 'downloads',
  initialState,
  reducers: {
    /**
     * set downloads
     */
    setDownloads: (state, action: PayloadAction<DownloadEntity[]>) => {
      // set downloads
      state.downloads = action.payload

      // set download map
      state.downloadMap = action.payload.reduce(
        (acc, download) => {
          acc[download.videoId] = download
          return acc
        },
        {} as Record<string, DownloadEntity>
      )
    },
    /**
     * add download
     * if download exists, delete it
     * add download to the top
     */
    addDownload: (state, action: PayloadAction<DownloadEntity>) => {
      // if download exists, delete it
      const index = state.downloads.findIndex(
        (download) => download.videoId === action.payload.videoId
      )
      if (index !== -1) {
        state.downloads.splice(index, 1)
      }
      // add download to the top
      state.downloads.unshift(action.payload)

      // update download map
      state.downloadMap[action.payload.videoId] = action.payload
    },
    /**
     * update download
     * find download by id and update it
     */
    updateDownload: (state, action: PayloadAction<DownloadEntity>) => {
      // update download
      const index = state.downloads.findIndex((d) => d.id === action.payload.id)
      if (index !== -1) {
        state.downloads[index] = action.payload
      }

      // update download map
      state.downloadMap[action.payload.videoId] = action.payload
    },
    /**
     * delete download
     * filter download by id and delete it from map by videoId
     */
    deleteDownload: (state, action: PayloadAction<DownloadEntity>) => {
      // filter download by id
      state.downloads = state.downloads.filter((d) => d.id !== action.payload.id)

      // delete it from map by videoId
      delete state.downloadMap[action.payload.videoId]
    }
  }
})

export const { setDownloads, addDownload, updateDownload, deleteDownload } = downloadSlice.actions

export default downloadSlice.reducer
