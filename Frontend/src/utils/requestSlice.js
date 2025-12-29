import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
  name: "requests",
  initialState: null,
  reducers: {
    addRequests: (state, action) => action.payload,
    removeRequest: (state, action) => {
      return state.filter((req) => req.requestId !== action.payload);
    },
    clearRequests: (state, action) => null,
  },
});

export const { addRequests, removeRequest, clearRequests } =
  requestSlice.actions;
export default requestSlice.reducer;
