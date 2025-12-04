import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FavoriteEntity } from '@common/types/entity'

/**
 * favorites state
 */
export interface FavoritesState {
  favorites: FavoriteEntity[]
}

const initialState: FavoritesState = {
  favorites: []
}

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /**
     * set favorites
     */
    setFavorites: (state, action: PayloadAction<FavoriteEntity[]>) => {
      state.favorites = action.payload || []
    },
    /**
     * add favorite
     */
    addFavorite: (state, action: PayloadAction<FavoriteEntity>) => {
      state.favorites = [action.payload, ...state.favorites]
    },
    /**
     * update favorite
     */
    updateFavorite: (state, action: PayloadAction<FavoriteEntity>) => {
      state.favorites = state.favorites.map((f) =>
        f.id === action.payload.id ? action.payload : f
      )
    },
    /**
     * delete favorite
     */
    deleteFavorite: (state, action: PayloadAction<number>) => {
      state.favorites = state.favorites.filter((f) => f.id !== action.payload)
    }
  }
})

export const { setFavorites, addFavorite, updateFavorite, deleteFavorite } = favoritesSlice.actions

export default favoritesSlice.reducer
