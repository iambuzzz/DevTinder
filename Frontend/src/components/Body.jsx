import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { addUser } from "../utils/userSlice";
import { appendRequest } from "../utils/requestSlice";
import axios from "axios";
import getSocket from "../utils/socket";
import { disconnectSocket } from "../utils/socket";
import {
  setOnlineUsers,
  incrementUnreadCount,
  setAllUnreadCounts,
} from "../utils/chatSlice";

const Body = () => {
  // Check karo ki kya hum chat page par hain
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useSelector((store) => store.user);
  const [loading, setLoading] = useState(true);
  const currentPathRef = useRef(location.pathname);
  const isChatPage = location.pathname.includes("/chat");

  const fetchUser = async () => {
    try {
      const res = await axios.get(BASE_URL + "profile", {
        withCredentials: true,
      });
      dispatch(addUser(res.data.data));
    } catch (error) {
      // Agar user login nahi hai aur wo feed (/) par hai, toh home bhejo
      if (location.pathname === "/") {
        navigate("/home");
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchUnreadCounts = async () => {
    const res = await axios.get(BASE_URL + "unread-counts", {
      withCredentials: true,
    });
    // Redux mein naya action banao 'setAllUnreadCounts'
    dispatch(setAllUnreadCounts(res.data));
  };

  // Pehle unread counts aur user fetch wala useEffect (Waise hi rahega)
  useEffect(() => {
    if (!userData) {
      fetchUser();
    } else {
      setLoading(false);
      fetchUnreadCounts();
    }
  }, [userData]);

  // Path track karne wala (Zaroori hai notification check ke liye)
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  // Socket listeners wala useEffect (FIXED VERSION)
  // Body.jsx ka socket useEffect

  useEffect(() => {
    if (!userData) return;

    disconnectSocket();

    const socket = getSocket();
    window.socket = socket;

    // Listeners cleanup
    socket.off("msgrecieved");
    socket.off("onlineUsersList");
    socket.off("newConnectionRequest");

    // 1. Message Listener
    socket.on("msgrecieved", (data) => {
      const senderId = data.senderId.toString();
      const isCurrentlyChatting = currentPathRef.current.includes(senderId);
      if (!isCurrentlyChatting) {
        dispatch(incrementUnreadCount(senderId));
      }
    });

    // 2. Online Users Listener
    socket.on("onlineUsersList", (users) => {
      dispatch(setOnlineUsers(users));
    });

    // 3. Request Listener
    socket.on("newConnectionRequest", (data) => {
      // console.log("🔔 Request Notification Aayi:", data);
      dispatch(appendRequest(data.fromUser));
    });

    // --- CHANGE 4: FAIL-SAFE ONLINE CHECK ---
    // Agar socket pehle se connected hai, toh abhi maango
    if (socket.connected) {
      socket.emit("getOnlineUsers");
    }
    // Agar abhi connect ho raha hai, toh connect hone par maango
    else {
      socket.on("connect", () => {
        socket.emit("getOnlineUsers");
      });
    }

    return () => {
      socket.off("msgrecieved");
      socket.off("onlineUsersList");
      socket.off("newConnectionRequest");
      socket.off("connect"); // Connect listener bhi hatao
    };
  }, [userData, dispatch]);

  // Jab user logout ho aur "/" par click kare (Dev Tinder logo),
  // toh use turant detect karke redirect karein
  useEffect(() => {
    if (!loading && !userData && location.pathname === "/") {
      navigate("/home");
    }
  }, [location.pathname, userData, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-violet-600"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isChatPage && <Footer />}
    </div>
  );
};

export default Body;
