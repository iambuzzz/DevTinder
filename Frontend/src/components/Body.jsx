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
import {
  setOnlineUsers,
  incrementUnreadCount,
  setAllUnreadCounts,
} from "../utils/chatSlice";

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useSelector((store) => store.user);
  const [loading, setLoading] = useState(true);
  const currentPathRef = useRef(location.pathname);
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
  useEffect(() => {
    if (!userData) return;

    // 1. Singleton socket use karo (getSocket)
    const socket = getSocket();
    window.socket = socket;

    // 2. Pehle purane listeners hatao taaki duplicate na ho
    socket.off("msgrecieved");
    socket.off("onlineUsersList");
    socket.off("newConnectionRequest");

    // 3. Notification Listener (Hamesha background mein chalega)
    socket.on("msgrecieved", (data) => {
      const senderId = data.senderId.toString();

      // Check karo kya user usi bande ki chat khol ke baitha hai?
      const isCurrentlyChatting = currentPathRef.current.includes(senderId);

      if (!isCurrentlyChatting) {
        dispatch(incrementUnreadCount(senderId));
      }
    });

    // 4. Baaki listeners
    socket.on("onlineUsersList", (users) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on("newConnectionRequest", (data) => {
      dispatch(appendRequest(data.fromUser));
    });

    // 5. CLEANUP: Yahan socket.disconnect() MAT KARO
    // Agar yahan disconnect kiya, toh route change hote hi socket band ho jayega
    return () => {
      socket.off("msgrecieved");
      socket.off("onlineUsersList");
      socket.off("newConnectionRequest");
      // socket.disconnect() ko sirf Logout par rakho
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
      <Footer />
    </div>
  );
};

export default Body;
