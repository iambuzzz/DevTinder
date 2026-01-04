import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

const UserChats = () => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const onlineList = useSelector((store) => store.chat.onlineUsers) || [];
  const isOnline = (userId) => onlineList.includes(userId.toString());
  const unreadCounts = useSelector((store) => store.chat.unreadCounts) || {};

  const fetchAllChats = async () => {
    try {
      const res = await axios.get(BASE_URL + "user/chats", {
        withCredentials: true,
      });
      setChats(res.data);
      setFilteredChats(res.data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChats();
  }, []);

  useEffect(() => {
    const results = chats.filter((chat) =>
      `${chat.targetUser.firstName} ${chat.targetUser.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredChats(results);
  }, [searchTerm, chats]);

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

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-indigo-500 font-bold">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-17 pb-4 sm:pb-6 w-full flex-grow flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-center sm:mb-6 mb-4 shrink-0">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight px-2">
            Messages
          </h1>
          <span className="bg-indigo-600/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">
            {filteredChats.length} active
          </span>
        </div>

        {/* Search Bar Section */}
        <div className="relative mb-4 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-50">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search matches..."
            className="w-full bg-gray-900/40 border border-white/10 text-white text-sm rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            {filteredChats.length > 0 ? (
              <div className="space-y-3 mb-3">
                {filteredChats.map((chat) => {
                  // ✅ FIX: Logic definitions inside map
                  const targetId = chat.targetUser._id;
                  const count = unreadCounts[targetId] || 0;
                  const userIsOnline = isOnline(targetId);

                  // ✅ FIX: Explicit return statement added
                  return (
                    <motion.div
                      key={chat._id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Link
                        to={`/chat/${targetId}`}
                        state={{
                          name: chat.targetUser.firstName,
                          avatar: chat.targetUser.photoURL,
                        }}
                        className="flex items-center gap-4 p-4 bg-gray-800/50 border border-white/5 rounded-3xl hover:bg-gray-800/70 hover:border-white/10 transition-all group shadow-lg"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={
                              chat.targetUser.photoURL ||
                              "https://geographyandyou.com/images/user-profile.png"
                            }
                            className="w-14 h-14 rounded-full object-cover border-2 group-hover:scale-110 transition-all border-indigo-500/30"
                            alt="avatar"
                          />
                          <div
                            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-4 border-black transition-colors ${
                              userIsOnline
                                ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                                : "bg-gray-600"
                            }`}
                          ></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="text-white font-bold truncate">
                            {chat.targetUser.firstName}{" "}
                            {chat.targetUser.lastName}
                          </h2>
                          <p
                            className={`text-sm truncate pr-4 ${
                              count > 0
                                ? "text-white font-bold"
                                : "text-gray-400"
                            }`}
                          >
                            {chat.lastMessage
                              ? chat.lastMessage.text
                              : "No messages yet"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`text-[12px] font-medium ${
                              userIsOnline
                                ? "text-green-400 animate-pulse"
                                : "text-gray-500"
                            }`}
                          >
                            {userIsOnline
                              ? "Online"
                              : formatLastSeen(chat.targetUser.lastSeen)}
                          </span>
                          {count > 0 && (
                            <span className="bg-indigo-600 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                              {count}
                            </span>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY STATE: Stretching to full available height */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-grow flex flex-col items-center justify-center text-center bg-gray-900/10 rounded-3xl border border-dashed border-white/10"
              >
                <div className="text-6xl mb-4 grayscale opacity-40">🔍</div>
                <h3 className="text-lg text-gray-400 font-bold">
                  No matches found{" "}
                  {searchTerm === "" ? "" : ` for "${searchTerm}"`}
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  Try a different name or keep exploring!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserChats;
