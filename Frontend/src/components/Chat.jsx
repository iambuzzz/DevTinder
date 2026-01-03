import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import createSocketConnection from "../utils/socket";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { clearUnreadCount } from "../utils/chatSlice";

const Chat = ({ firstName, lastName, photoURL }) => {
  const { id } = useParams();
  const targetId = id;
  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const dispatch = useDispatch();
  const onlineList = useSelector((store) => store.chat?.onlineUsers) || [];
  const isOnline = onlineList.includes(targetId);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state || {};
  const targetName = userData.name || "User";
  const avatar =
    userData.avatar || "https://geographyandyou.com/images/user-profile.png";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Start with empty for real chat
  const chatBoxRef = useRef(null);
  const [targetLastSeen, setTargetLastSeen] = useState(null);
  const [isTargetTyping, setIsTargetTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const formatLastSeen = (date) => {
    if (!date) return "Offline";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const fetchChatMessages = async () => {
    try {
      const response = await axios.post(
        BASE_URL + `chat/${targetId}`,
        {
          targetId: targetId,
        },
        { withCredentials: true }
      );
      if (response.data && response.data.data) {
        const chatData = response.data.data;

        // Safe find: Check karo ki p aur p._id dono exist karte hain
        const tUser = chatData.participants?.find(
          (p) => p?._id?.toString() === targetId?.toString()
        );

        if (tUser) {
          // Agar lastSeen mil jaye toh set karo, varna purana data mat hatao
          setTargetLastSeen(tUser.lastSeen || null);
        }

        const formattedMessages = chatData.messages.map((msg) => ({
          fromMe: msg.senderId === userId,
          text: msg.text,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Fetch Chat Messages Error:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinChat", { targetId });
    });

    socket.on("connect_error", (err) => {
      console.log("Socket Connection Error:", err.message);
    });

    socketRef.current = socket;

    socket.emit("joinChat", { userId, targetId });
    fetchChatMessages();

    socket.on("msgrecieved", ({ text, senderId }) => {
      setMessages((prev) => [
        ...prev,
        {
          fromMe: senderId === userId,
          text: text,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });
    socket.on("userTyping", ({ senderId, isTyping }) => {
      if (senderId == targetId) {
        setIsTargetTyping(isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("msgrecieved");
        socketRef.current.off("userTyping");
        socketRef.current.off("connect");
        // socketRef.current.disconnect(); <== Isey mat karna
      }
    };
  }, [userId, targetId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth", // Ye line magic karegi
      });
    }
  }, [messages]);

  const sendMsg = () => {
    if (!message.trim() || !socketRef.current) return;

    const currentMsg = message; // Message ko save karlo delete karne se pehle

    // 1. Server ko bhejo (Ye DB mein save karega)
    socketRef.current.emit("sendMessage", {
      userId: userId,
      targetId: targetId,
      text: currentMsg,
    });

    // 2. Apni screen par turant add karo (Optimistic Update)
    setMessages((prev) => [
      ...prev,
      {
        fromMe: true, // Aapne bheja hai toh hamesha right side dikhega
        text: currentMsg,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
  };

  useEffect(() => {
    // Poore page ko smoothly top par le jaane ke liye
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("userTyping", ({ senderId, isTyping }) => {
      if (senderId === targetId) {
        setIsTargetTyping(isTyping);
      }
    });

    // Cleanup listener
    return () => {
      socketRef.current.off("userTyping");
    };
  }, [targetId]);
  // Chat.jsx
  useEffect(() => {
    const markMessagesAsSeen = async () => {
      try {
        await axios.post(
          BASE_URL + `chat/seen/${targetId}`,
          {},
          { withCredentials: true }
        );
        dispatch(clearUnreadCount(targetId)); // Redux saaf karo
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    };

    if (targetId) {
      markMessagesAsSeen();
    }
  }, [targetId, messages.length]);

  // Chat.jsx
  useEffect(() => {
    if (targetId) {
      dispatch(clearUnreadCount(targetId));
    }
  }, [targetId, dispatch]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Socket ko batao ki main type kar raha hoon
    socketRef.current.emit("typing", { targetId, isTyping: true });

    // Agar 1.5 second tak type nahi kiya toh 'stop typing' bhejo
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing", { targetId, isTyping: false });
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>

      <div
        className="relative z-10 w-full px-4 sm:px-8 pt-20 pb-6 
flex flex-col h-[100vh] min-h-0"
      >
        {/* --- HEADER SECTION --- */}
        <div className="w-full flex md:flex-row flex-col justify-between items-center gap-6">
          <div className="w-full flex items-center justify-between bg-gray-900/60 border border-white/10 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md">
            {" "}
            <div className="flex items-center gap-3 ">
              {" "}
              <button
                onClick={() => navigate(-1)} // -1 ka matlab hai "ek step peeche"
                className="text-white hover:text-indigo-400 transition-colors mr-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="relative">
                <img
                  src={avatar}
                  // className={`w-11 h-11 rounded-full object-cover border-2 transition-all ${
                  //   isOnline ? "border-green-500" : "border-purple-500/50"
                  // }`}
                  className="w-11 h-11 rounded-full object-cover border-1 transition-all border-purple-500/50"
                />
                {/* Dot indicator */}
                {/* <div
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${
                    isOnline
                      ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                      : "bg-gray-500"
                  }`}
                ></div> */}
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{targetName}</h2>
                {isTargetTyping ? (
                  <p className="text-green-400 text-[10px] font-bold italic animate-pulse">
                    typing...
                  </p>
                ) : isOnline ? (
                  <p className="text-green-400 text-[10px] font-bold">
                    ● Online
                  </p>
                ) : (
                  <p className="text-white/40 text-[10px]">
                    {targetLastSeen
                      ? `Last seen: ${formatLastSeen(targetLastSeen)}`
                      : "Offline"}
                  </p>
                )}
              </div>{" "}
            </div>{" "}
            <div className="text-gray-400"> 🔐</div>{" "}
          </div>
        </div>
        <div
          ref={chatBoxRef}
          className="flex-1 min-h-0 overflow-y-auto mt-3 
  p-4 rounded-2xl bg-gray-900/40 border border-white/10 shadow-xl"
        >
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`w-full mb-3 last:mb-0 flex ${
                  msg.fromMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[65%] px-4 py-2 text-sm rounded-2xl border shadow-md ${
                    msg.fromMe
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-violet-500/20"
                      : "bg-gray-800 text-gray-200 border-gray-600"
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-300 mt-1 text-right">
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex gap-3 items-center bg-gray-900/60 border border-white/10 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md">
          <input
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
          />

          <button
            onClick={sendMsg}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-xl text-white font-semibold active:scale-95 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
export default Chat;
