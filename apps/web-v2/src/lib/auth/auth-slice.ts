import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthSession, AuthState } from "@/lib/auth/auth-types";

const initialState: AuthState = {
  status: "unknown",
  session: null,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.status = "authenticated";
      state.session = action.payload;
      state.sessionExpired = false;
    },
    clearSession(state) {
      state.status = "unauthenticated";
      state.session = null;
      state.sessionExpired = false;
    },
    sessionExpired(state) {
      state.status = "unauthenticated";
      state.session = null;
      state.sessionExpired = true;
    },
  },
});

export const { setSession, clearSession, sessionExpired } = authSlice.actions;
export const authReducer = authSlice.reducer;
