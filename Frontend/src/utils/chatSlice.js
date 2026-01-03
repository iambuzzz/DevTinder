import { createSlice } from "@reduxjs/toolkit";
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    onlineUsers: [],
    unreadCounts: {}, // { userId: count }
  },
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    incrementUnreadCount: (state, action) => {
      const userId = action.payload;
      state.unreadCounts[userId] = (state.unreadCounts[userId] || 0) + 1;
    },
    clearUnreadCount: (state, action) => {
      const userId = action.payload;
      state.unreadCounts[userId] = 0;
    },
    setAllUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload;
    },
  },
});

export const {
  setOnlineUsers,
  incrementUnreadCount,
  clearUnreadCount,
  setAllUnreadCounts,
} = chatSlice.actions;
export default chatSlice.reducer;
