import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import createSocketConnection from "../utils/socket";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Chat = ({ firstName, lastName, photoURL }) => {
  const { id } = useParams();
  const targetId = id;
  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const location = useLocation();
  const userData = location.state || {};
  const targetName = userData.name || "User";
  const avatar =
    userData.avatar || "https://geographyandyou.com/images/user-profile.png";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Start with empty for real chat
  const chatBoxRef = useRef(null);
  const socketRef = useRef(null);

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

    return () => {
      socket.disconnect();
    };
  }, [userId, targetId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMsg = () => {
    if (!message.trim() || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      userId: userId,
      targetId: targetId,
      text: message,
    });

    setMessage("");
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
            <div className="flex items-center gap-3">
              {" "}
              <Link to="/connection" className="text-white">
                {" "}
                ←{" "}
              </Link>{" "}
              <img
                src={avatar}
                className="w-10 h-10 rounded-full object-cover border border-purple-500"
              />{" "}
              <div>
                {" "}
                <h2 className="text-white font-bold text-lg">
                  {targetName}
                </h2>{" "}
                <p className="text-white/40 text-xs">Ofline</p>{" "}
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
            onChange={(e) => setMessage(e.target.value)}
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
