import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import getSocket from "../utils/socket";
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
    if (!userId || !targetId) return;

    // 1. Singleton socket uthao (Wahi jo Body.jsx use kar raha hai)
    const socket = getSocket();
    socketRef.current = socket;

    // 2. Room join karne ka signal bhejo
    socket.emit("joinChat", { targetId });

    // 3. Purani messages fetch karo
    fetchChatMessages();

    // 4. Message receive karne ka function (Local to this chat)
    const handleChatMsg = (data) => {
      // Check karo ki message isi bande ka hai jiski chat khuli hai
      if (data.senderId.toString() === targetId.toString()) {
        setMessages((prev) => [
          ...prev,
          {
            fromMe: false, // Kyunki 'msgrecieved' hamesha samne wale ka hota hai
            text: data.text,
            time:
              data.time ||
              new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]);
      }
    };

    // 5. Typing indicator ka function
    const handleTyping = ({ senderId, isTyping }) => {
      if (senderId.toString() === targetId.toString()) {
        setIsTargetTyping(isTyping);
      }
    };

    // Listeners On karo
    socket.on("msgrecieved", handleChatMsg);
    socket.on("userTyping", handleTyping);

    // 6. CLEANUP (Bahut important hai!)
    return () => {
      // Sirf ye specific functions hatao taaki Body.jsx wala listener chalta rahe
      socket.off("msgrecieved", handleChatMsg);
      socket.off("userTyping", handleTyping);
      // socket.disconnect() bilkul mat karna!
    };
  }, [userId, targetId]); // targetId badalne par chat refresh hogi

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
      <div className="absolute top-[-10%] left-[-10%] w-100 h-100 blur-[180px] md:w-170 md:h-120 md:blur-[250px] bg-purple-600/40 rounded-full"></div>

      <div className="absolute bottom-[-10%] right-[-10%] w-156 h-126 bg-blue-600/40 rounded-full blur-[250px]"></div>

      <div
        className="relative z-10 w-full px-2 sm:px-8 pt-18 sm:pb-6 pb-3
flex flex-col h-[100vh] min-h-0"
      >
        {/* --- HEADER SECTION --- */}
        <div className="w-full flex md:flex-row flex-col justify-between items-center gap-6">
          <div className="w-full flex items-center justify-between bg-gray-900/60 border border-white/10 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md">
            {" "}
            <div className="flex items-center gap-2 ">
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
                  className="w-11 h-11 rounded-full object-cover border-1 mr-2 transition-all border-purple-500/50"
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
          </div>
        </div>
        {/* Chat Message List Area */}
        <div
          ref={chatBoxRef}
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
                  className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 text-sm shadow-[0_4px_10px_rgba(0,0,0,0.1)] break-words backdrop-blur-md border ${
                    msg.fromMe
                      ? // Sender (Me): Indigo Tinted Glass
                        "bg-indigo-500/30 border-indigo-500/30 text-white rounded-l-lg rounded-br-lg rounded-tr-none"
                      : // Receiver (Them): White/Gray Tinted Glass
                        "bg-white/10 border-white/10 text-gray-100 rounded-r-lg rounded-bl-lg rounded-tl-none"
                  }`}
                >
                  {/* Message Text */}
                  <span className="whitespace-pre-wrap leading-relaxed tracking-wide text-[15px] drop-shadow-sm">
                    {msg.text}
                  </span>

                  {/* Time & Ticks Container */}
                  <div className="float-right ml-3 mt-2 flex items-center space-x-1 select-none opacity-80">
                    <span className="text-[10px] text-white/70 leading-none font-medium">
                      {msg.time}
                    </span>

                    {/* Blue Ticks Logic */}
                    {msg.fromMe && (
                      <span className="text-blue-300 drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]">
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
