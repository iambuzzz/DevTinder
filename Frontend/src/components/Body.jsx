import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { addUser } from "../utils/userSlice";
import axios from "axios";
import createSocketConnection from "../utils/socket";
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

  useEffect(() => {
    if (!userData) {
      fetchUser();
    } else {
      setLoading(false);
      fetchUnreadCounts();
    }
  }, [userData]);

  useEffect(() => {
    if (!userData) return;

    const socket = createSocketConnection();
    window.socket = socket;
    const handleMessage = (data) => {
      const senderId = data.senderId.toString();
      const isCurrentlyChatting = window.location.pathname.includes(senderId);
      if (!isCurrentlyChatting) {
        dispatch(incrementUnreadCount(senderId));
      }
    };

    socket.on("msgrecieved", handleMessage);

    socket.on("onlineUsersList", (users) => {
      dispatch(setOnlineUsers(users));
    });

    return () => {
      // socket.off("msgrecieved", handleMessage);
      // socket.off("onlineUsersList");
      // // socket.disconnect(); // Isey tabhi karo jab logout ho raha ho
      if (socket) {
        socket.disconnect();
        window.socket = null;
      }
    };
  }, [userData]);

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
