import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import getSocket from "../utils/socket";
import { useSelector, useDispatch } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { clearUnreadCount } from "../utils/chatSlice";

const Chat = () => {
  const { id } = useParams();
  const targetId = id;
  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const dispatch = useDispatch();
  const onlineList = useSelector((store) => store.chat?.onlineUsers) || [];
  const isOnline = onlineList.includes(targetId);
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [targetProfile, setTargetProfile] = useState({
    name: location.state?.name || "User",
    avatar:
      location.state?.avatar ||
      "https://geographyandyou.com/images/user-profile.png",
  });

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [targetLastSeen, setTargetLastSeen] = useState(null);
  const [isTargetTyping, setIsTargetTyping] = useState(false);

  // --- REFS ---
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const scrollContainerStyle = {
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorY: "contain",
  };
  // --- HELPER FUNCTIONS ---
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

  // Call 1: Mark Seen (Ye aapki screenshot mein Line 56 wali call hai)
  const markMessagesAsSeen = async () => {
    if (!targetId) return;
    try {
      await axios.post(
        BASE_URL + `chat/seen/${targetId}`,
        {},
        { withCredentials: true }
      );
      dispatch(clearUnreadCount(targetId));
    } catch (err) {
      console.error("Error marking messages as seen:", err);
    }
  };

  // --- MAIN USE EFFECT ---
  useEffect(() => {
    if (!userId || !targetId) return;

    // AbortController taaki agar jaldi switch karo to purani call cancel ho jaye
    const controller = new AbortController();
    const signal = controller.signal;

    const socket = getSocket();
    socketRef.current = socket;
    socket.emit("joinChat", { targetId });

    // Call 2: Fetch Messages (Ye aapki screenshot mein Line 71 wali call hai)
    const fetchChatMessages = async () => {
      try {
        const response = await axios.post(
          BASE_URL + `chat/${targetId}`,
          { targetId: targetId },
          { withCredentials: true, signal: signal }
        );

        if (response.data && response.data.data) {
          const chatData = response.data.data;

          // --- USER PROFILE FIX ---
          const tUser = chatData.participants?.find(
            (p) => p?._id?.toString() === targetId?.toString()
          );

          if (tUser) {
            setTargetLastSeen(tUser.lastSeen || null);

            // ✅ Sirf First Name Uthaya
            const fName = tUser.firstName || "User";

            setTargetProfile({
              name: fName,
              avatar:
                tUser.photoURL ||
                "https://geographyandyou.com/images/user-profile.png",
            });
          }

          const formattedMessages = chatData.messages.map((msg) => ({
            fromMe: msg.senderId === userId,
            text: msg.text,
            seen: msg.seen,
            time: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setMessages(formattedMessages);

          // ✅ Messages aate hi Seen mark karo
          // Agar aapko wo dusri API call rokni hai, toh neeche wali line hata do:
          markMessagesAsSeen();
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Fetch Chat Messages Error:", err);
        }
      }
    };

    fetchChatMessages();

    // Listeners
    const handleChatMsg = (data) => {
      if (data.senderId.toString() === targetId.toString()) {
        setMessages((prev) => [
          ...prev,
          {
            fromMe: false,
            text: data.text,
            seen: false,
            time:
              data.time ||
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]);
        markMessagesAsSeen();
      }
    };

    const handleTyping = ({ senderId, isTyping }) => {
      if (senderId.toString() === targetId.toString()) {
        setIsTargetTyping(isTyping);
      }
    };

    const handleSeenUpdate = ({ viewerId }) => {
      if (viewerId === targetId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.fromMe ? { ...msg, seen: true } : msg))
        );
      }
    };

    socket.on("msgrecieved", handleChatMsg);
    socket.on("userTyping", handleTyping);
    socket.on("msgSeenUpdate", handleSeenUpdate);

    return () => {
      controller.abort(); // Cancel previous API
      socket.off("msgrecieved", handleChatMsg);
      socket.off("userTyping", handleTyping);
      socket.off("msgSeenUpdate", handleSeenUpdate);
    };
  }, [userId, targetId]);

  // --- SCROLL EFFECT ---
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // --- SEND MESSAGE ---
  const sendMsg = () => {
    if (!message.trim() || !socketRef.current) return;
    const currentMsg = message;

    socketRef.current.emit("sendMessage", {
      userId: userId,
      targetId: targetId,
      text: currentMsg,
    });

    setMessages((prev) => [
      ...prev,
      {
        fromMe: true,
        text: currentMsg,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setMessage("");
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socketRef.current.emit("typing", { targetId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing", { targetId, isTyping: false });
    }, 1500);
  };

  return (
    <div className="fixed h-[100dvh] w-full bg-black overflow-hidden">
      {/* Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-100 h-100 blur-[180px] md:w-170 md:h-120 md:blur-[250px] bg-purple-600/40 rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-156 h-126 bg-blue-600/40 rounded-full blur-[250px]"></div>

      <div
        className="relative z-10 w-full px-2 sm:px-8 pt-18 sm:pb-6 pb-3 flex flex-col h-dvh min-h-0"
        style={{ height: "var(--vh, 100dvh)" }}
      >
        {/* HEADER */}
        <div className="w-full flex md:flex-row flex-col justify-between items-center gap-6">
          <div className="w-full flex items-center justify-between bg-gray-900/60 border border-white/10 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 ">
              <button
                onClick={() => navigate(-1)}
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
                  src={targetProfile.avatar}
                  className="w-11 h-11 rounded-full object-cover border-1 mr-2 transition-all border-purple-500/50"
                  alt="Profile"
                />
              </div>

              <div>
                <h2 className="text-white font-bold text-lg">
                  {targetProfile.name}
                </h2>
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
              </div>
            </div>

            {/* --- 3 DOTS WAPAS AA GAYE --- */}
            <button className="text-gray-300 hover:text-white py-2 sm:px-2 px-0 rounded-full hover:bg-white/10 transition-all active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {/* --------------------------- */}
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div
          ref={chatBoxRef}
          // Yahan scrollContainerStyle lagaya hai smooth scroll ke liye
          style={scrollContainerStyle}
          className="flex-1 min-h-0 overflow-y-auto mt-3 p-4 rounded-2xl bg-gray-900/20 border border-white/5 shadow-inner custom-scrollbar"
        >
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`w-full mb-2 flex ${
                  msg.fromMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  // FIX: Removed 'backdrop-blur-md'
                  // ADDED: 'will-change-transform' for GPU performance
                  // Design: Bilkul wahi purana wala hai
                  className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 text-sm shadow-[0_4px_10px_rgba(0,0,0,0.1)] break-words border will-change-transform ${
                    msg.fromMe
                      ? "bg-indigo-500/30 border-indigo-500/30 text-white rounded-l-lg rounded-br-lg rounded-tr-none"
                      : "bg-white/10 border-white/10 text-gray-100 rounded-r-lg rounded-bl-lg rounded-tl-none"
                  }`}
                >
                  <span className="whitespace-pre-wrap leading-relaxed tracking-wide text-[15px] drop-shadow-sm">
                    {msg.text}
                  </span>
                  <div className="float-right ml-3 mt-2 flex items-center space-x-1 select-none opacity-80">
                    <span className="text-[10px] text-white/70 leading-none font-medium">
                      {msg.time}
                    </span>
                    {msg.fromMe && (
                      <span
                        className={`transition-colors duration-300 ${
                          msg.seen
                            ? "text-blue-300 drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]"
                            : "text-gray-400"
                        }`}
                      >
                        <svg
                          viewBox="0 0 16 11"
                          height="10"
                          width="10"
                          preserveAspectRatio="xMidYMid meet"
                          version="1.1"
                        >
                          <path
                            fill="currentColor"
                            d="M11.55,0.45l-7.22,7.22L1.68,5.03c-0.29-0.29-0.77-0.29-1.06,0l-0.47,0.47c-0.29,0.29-0.29,0.77,0,1.06 l3.72,3.72c0.29,0.29,0.77,0.29,1.06,0l8.15-8.15c0.29-0.29,0.29-0.77,0-1.06L12.61,0.45C12.32,0.16,11.84,0.16,11.55,0.45z"
                          ></path>
                          <path
                            fill="currentColor"
                            d="M15.85,0.45l-7.22,7.22l-0.34-0.34c-0.29-0.29-0.77-0.29-1.06,0l-0.47,0.47c-0.29,0.29-0.29,0.77,0,1.06 l1.41,1.41c0.29,0.29,0.77,0.29,1.06,0l7.09-7.09c0.29-0.29,0.29-0.77,0-1.06L15.85,0.45z"
                          ></path>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* INPUT AREA */}
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
