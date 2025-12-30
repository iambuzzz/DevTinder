import { useState } from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Body from "./components/Body";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Feed from "./components/Feed";
import Home from "./components/Home";
import Connections from "./components/Connections";
import RequestsFeed from "./components/RequestsFeed";
import UserChats from "./components/UserChats";
import { Provider } from "react-redux";
import { appStore } from "./utils/appStore";
function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={<Body />}>
            <Route path="/" element={<Feed />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/request" element={<RequestsFeed />} />
            <Route path="/connection" element={<Connections />} />
            <Route path="/chat" element={<UserChats />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
