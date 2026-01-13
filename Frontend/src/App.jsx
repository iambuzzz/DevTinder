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
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import PremiumPage from "./components/PremiumPage";
import ContactUs from "./components/ContactUs";
import Chat from "./components/Chat";
import UserChats from "./components/UserChats";
import ScrollToTop from "./utils/ScrollToTop";
import PrivateRoutes from "./components/PrivateRoutes";
import { Provider } from "react-redux";
import { appStore } from "./utils/appStore";
function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Body />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/contactus" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route element={<PrivateRoutes />}>
              <Route path="/" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/request" element={<RequestsFeed />} />
              <Route path="/connection" element={<Connections />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/messages" element={<UserChats />} />
              <Route path="/premium" element={<PremiumPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
