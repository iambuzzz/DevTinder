import { createSlice } from "@reduxjs/toolkit";

const connectionSlice = createSlice({
  name: "connections",
  initialState: {
    data: null, // Array of users
    unreadCount: 0, // Notification Badge number
  },
  reducers: {
    // 1. Initial Fetch (Database se)
    addConnections: (state, action) => {
      state.data = action.payload;
    },
    // 2. Real-time update (Socket se)
    addRealTimeConnection: (state, action) => {
      if (!state.data) {
        state.data = [];
      }
      // New connection ko TOP par add karo
      state.data.unshift(action.payload);
      // Badge count badhao
      state.unreadCount += 1;
    },
    // 3. Jab user Connections page khole
    markConnectionsSeen: (state) => {
      state.unreadCount = 0;
    },
    removeConnection: (state) => {
      state.data = null;
      state.unreadCount = 0;
    },
  },
});

export const {
  addConnections,
  addRealTimeConnection,
  markConnectionsSeen,
  removeConnection,
} = connectionSlice.actions;

export default connectionSlice.reducer;
