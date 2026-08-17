import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { notificationsApi } from "./notificationsApi";

interface NotificationsUiState {
  unreadCount: number;
  isDropdownOpen: boolean;
}

const initialState: NotificationsUiState = {
  unreadCount: 0,
  isDropdownOpen: false,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setDropdownOpen(state, action: PayloadAction<boolean>) {
      state.isDropdownOpen = action.payload;
    },
    toggleDropdown(state) {
      state.isDropdownOpen = !state.isDropdownOpen;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      notificationsApi.endpoints.getUnreadCount.matchFulfilled,
      (state, action) => {
        state.unreadCount = action.payload.count;
      },
    );
  },
});

export const { setDropdownOpen, toggleDropdown } = notificationsSlice.actions;
export default notificationsSlice.reducer;
