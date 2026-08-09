import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthSession, AuthState } from "@/lib/auth/auth-types";

const initialState: AuthState = {
  status: "unknown",
  session: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.status = "authenticated";
      state.session = action.payload;
    },
    clearSession(state) {
      state.status = "unauthenticated";
      state.session = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
