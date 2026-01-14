import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { addUser } from "../utils/userSlice";
import { appendRequest, addRequests } from "../utils/requestSlice";
import { addRealTimeConnection } from "../utils/connectionSlice";
import axios from "axios";
import getSocket from "../utils/socket";
// Note: disconnectSocket import toh hai par use hum useEffect me nahi karenge refresh ke liye
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
  const isChatPage = location.pathname.includes("/chat");

  const fetchUser = async () => {
    try {
      const res = await axios.get(BASE_URL + "profile", {
        withCredentials: true,
      });
      dispatch(addUser(res.data.data));
    } catch (error) {
      if (location.pathname === "/") {
        navigate("/home");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await axios.get(BASE_URL + "unread-counts", {
        withCredentials: true,
      });
      dispatch(setAllUnreadCounts(res.data));
    } catch (err) {
      console.error("Unread count fetch error", err);
    }
  };
  const fetchConnectionRequests = async () => {
    try {
      const res = await axios.get(BASE_URL + "user/requests", {
        withCredentials: true,
      });
      const rawData = res.data.data || [];

      if (Array.isArray(rawData)) {
        // Data format waisa hi rakho jaisa slice expect karta hai
        const formattedData = rawData
          .filter((item) => item && item.fromUserId)
          .map((item) => ({
            ...item.fromUserId,
            requestId: item._id,
          }));

        // Redux me daal do
        dispatch(addRequests(formattedData));
      }
    } catch (err) {
      console.error("Connection requests fetch error", err);
    }
  };

  useEffect(() => {
    if (!userData) {
      fetchUser();
    } else {
      setLoading(false);
      fetchUnreadCounts();
      fetchConnectionRequests();
    }
  }, [userData]);

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!userData) return;

    const socket = getSocket();
    window.socket = socket;

    // Define Listeners as named functions (Zaroori hai taaki specific remove kar sakein)

    const handleMsgReceived = (data) => {
      const senderId = data.senderId.toString();
      // Check karo agar hum abhi usi chat page par hain
      const isCurrentlyChatting = currentPathRef.current.includes(senderId);

      // Agar chat khuli nahi hai, tabhi count badhao
      if (!isCurrentlyChatting) {
        dispatch(incrementUnreadCount(senderId));
      }
    };

    const handleOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    const handleConnectionRequest = (data) => {
      dispatch(appendRequest(data.fromUser));
    };

    const handleConnectionAccepted = (payload) => {
      const { user, requestId, status, createdAt } = payload.data;

      // Structure waisa banao jaisa UserCard expect karta hai
      const newConnection = {
        id: requestId,
        status: status,
        createdAt: createdAt,
        user: user, // The full user object
      };

      dispatch(addRealTimeConnection(newConnection));
      // toast.success(`${user.firstName} accepted your request!`);
    };

    // Listeners attach karo
    socket.on("msgrecieved", handleMsgReceived);
    socket.on("onlineUsersList", handleOnlineUsers);
    socket.on("newConnectionRequest", handleConnectionRequest);
    socket.on("connectionAccepted", handleConnectionAccepted);
    // Online Check Logic
    if (socket.connected) {
      socket.emit("getOnlineUsers");
    } else {
      socket.on("connect", () => {
        socket.emit("getOnlineUsers");
      });
    }

    // CLEANUP FUNCTION (Ab ye safe hai)
    return () => {
      // Hum sirf apne function pass kar rahe hain, toh Chat.jsx wala listener delete nahi hoga!
      socket.off("msgrecieved", handleMsgReceived);
      socket.off("onlineUsersList", handleOnlineUsers);
      socket.off("newConnectionRequest", handleConnectionRequest);
      socket.off("connectionAccepted", handleConnectionAccepted);
      socket.off("connect");
    };
  }, [userData, dispatch]);

  // Logout check logic
  useEffect(() => {
    if (!loading && !userData && location.pathname === "/") {
      navigate("/home");
    }
  }, [location.pathname, userData, loading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && userData) {
        // console.log("App resumed! Fetching latest data...");
        fetchUnreadCounts();
        fetchConnectionRequests();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userData]);

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
