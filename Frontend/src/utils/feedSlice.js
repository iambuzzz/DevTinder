// feedSlice.js
import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => {
      if (!action.payload) return null;
      if (state === null) return action.payload;

      // Agar naya data khali hai, toh purani state hi rehne do
      if (action.payload.length === 0) return state;

      // Duplicate check: Sirf wo users lo jo pehle se state mein nahi hain
      const uniqueNewUsers = action.payload.filter(
        (newUser) => !state.some((oldUser) => oldUser._id === newUser._id)
      );

      return [...state, ...uniqueNewUsers];
    },
    removeFeed: (state, action) => {
      if (!state) return null;
      return state.filter((user) => user._id !== action.payload);
    },
    clearFeed: () => null, // 👈 ADD THIS
  },
});

export const { addFeed, removeFeed, clearFeed } = feedSlice.actions;
export default feedSlice.reducer;
