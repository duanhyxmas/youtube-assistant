import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConfigEntity } from '@common/types/entity'

/**
 * settings state
 */
export interface SettingsState {
  downloadPath: ConfigEntity | null
  downloadMaxProcessCount: ConfigEntity | null
  browserCookieFile: ConfigEntity | null
  browserName: ConfigEntity | null
}

const initialState: SettingsState = {
  downloadPath: null,
  downloadMaxProcessCount: null,
  browserCookieFile: null,
  browserName: null
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * set download path
     */
    setDownloadPath: (state, action: PayloadAction<ConfigEntity | null>) => {
      state.downloadPath = action.payload
    },
    /**
     * set download max process count
     */
    setDownloadMaxProcessCount: (state, action: PayloadAction<ConfigEntity | null>) => {
      state.downloadMaxProcessCount = action.payload
    },
    /**
     * set browser cookie file
     */
    setBrowserCookieFile: (state, action: PayloadAction<ConfigEntity | null>) => {
      state.browserCookieFile = action.payload
    },
    /**
     * set browser name
     */
    setBrowserName: (state, action: PayloadAction<ConfigEntity | null>) => {
      state.browserName = action.payload
    }
  }
})

export const { setDownloadPath, setDownloadMaxProcessCount, setBrowserCookieFile, setBrowserName } =
  settingsSlice.actions

export default settingsSlice.reducer
