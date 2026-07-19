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
    // [PHASE 4] Handle granular presence updates (O(1) instead of O(N))
    updateUserStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      if (isOnline) {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      }
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
  updateUserStatus,
  incrementUnreadCount,
  clearUnreadCount,
  setAllUnreadCounts,
} = chatSlice.actions;
export default chatSlice.reducer;
