import { configureStore } from '@reduxjs/toolkit'
import settingsReducer, { SettingsState } from './settings'
import favoritesReducer, { FavoritesState } from './favorites'
import downloadsReducer, { DownloadsState } from './downloads'

/**
 * store
 */
export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    favorites: favoritesReducer,
    downloads: downloadsReducer
  }
})

export type RootState = {
  settings: SettingsState
  favorites: FavoritesState
  downloads: DownloadsState
}

export type AppDispatch = typeof store.dispatch
