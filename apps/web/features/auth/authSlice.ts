import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@hassad/shared'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>
    ) => {
      const { user } = action.payload
      state.user = user
      state.isAuthenticated = true
      state.isInitialized = true
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isInitialized = true
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    },
  },
})

export const { setCredentials, logout, setInitialized } = authSlice.actions
export default authSlice.reducer
