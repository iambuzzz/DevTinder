import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../utils/userSlice";
import feedReducer from "../utils/feedSlice";
import requestReducer from "../utils/requestSlice";
import connectionReducer from "../utils/connectionSlice";
export const appStore = configureStore({
  reducer: {
    user: userReducer,
    feed: feedReducer,
    requests: requestReducer,
    connections: connectionReducer,
  },
});
