import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
  name: "requests",
  initialState: [], // null ki jagah empty array rakho safe rehne ke liye
  reducers: {
    addRequests: (state, action) => action.payload,
    appendRequest: (state, action) => {
      // Agar requests null hain toh array banao, warna push karo
      if (!state) return [action.payload];
      return [action.payload, ...state];
    },
    removeRequest: (state, action) => {
      return state.filter((req) => req.requestId !== action.payload);
    },
  },
});

export const { addRequests, appendRequest, removeRequest } =
  requestSlice.actions;
export default requestSlice.reducer;
