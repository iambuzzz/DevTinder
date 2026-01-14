import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => {
      // 1. Agar naya data khali hai aur purana state exist karta hai
      if (!action.payload) return state;

      // 2. Agar pehli baar data aa raha hai
      if (state === null) return action.payload;

      // 3. DUPLICATE REMOVAL LOGIC
      // Hum naye aane wale users ko check karenge ki wo already state mein to nahi hain?
      const existingIds = new Set(state.map((user) => user._id));

      const uniqueNewUsers = action.payload.filter(
        (newUser) => !existingIds.has(newUser._id)
      );

      // Sirf naye unique users ko append karo
      return [...state, ...uniqueNewUsers];
    },
    removeFeed: (state, action) => {
      if (!state) return null;
      // Array se user hatao (Swipe hone par)
      return state.filter((user) => user._id !== action.payload);
    },
    clearFeed: () => null, // Logout ya Refresh ke liye
  },
});

export const { addFeed, removeFeed, clearFeed } = feedSlice.actions;
export default feedSlice.reducer;
