import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addConnections } from "../utils/connectionSlice";
import { motion, AnimatePresence } from "framer-motion"; // Animation King
import { Link } from "react-router-dom"; // Chat pe le jaane ke liye
import UserCard from "./UserCard"; // Profile dekhne ke liye reuse karenge

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();

  // Local States
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // Modal ke liye

  const fetchConnections = async () => {
    try {
      const res = await axios.get(BASE_URL + "user/connections", {
        withCredentials: true,
      });
      dispatch(addConnections(res.data.data));
    } catch (err) {
      console.error("Connections fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Filter Logic: Search by Name
  const filteredConnections = useMemo(() => {
    if (!connections) return [];

    // Pehle check karo ki 'item' aur 'item.user' dono exist karte ho
    const validConnections = connections.filter((item) => item && item.user);

    if (!searchQuery) return validConnections;

    const lowerCaseQuery = searchQuery.toLowerCase().trim();

    return validConnections.filter((item) => {
      const fullName =
        `${item.user.firstName} ${item.user.lastName}`.toLowerCase();
      return fullName.includes(lowerCaseQuery);
    });
  }, [connections, searchQuery]);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }, // Ek-ek karke card aayega
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <span className="loading loading-ring loading-lg text-violet-500"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-10">
        {/* --- HEADER SECTION --- */}
        <div className="flex md:flex-row flex-col px-1 sm:mx-3 justify-between items-center mb-4 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Connections
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium ">
              You have {connections?.length || 0} developers in your network
            </p>
          </div>

          {/* Search Bar */}
        </div>
        <div className="relative group mb-8 px-3">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-50">
            <svg
              className="w-5 h-5 text-gray-500 group-focus-within:text-violet-500 transition-colors"
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
            placeholder="Search connections..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm transition-all shadow-lg backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* --- CONNECTIONS GRID --- */}
        {filteredConnections?.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 md:mx-3 lg:grid-cols-3 gap-6"
          >
            {filteredConnections.map((item) => {
              const { user, createdAt } = item;
              return (
                <motion.div
                  layout // CHANGE 1: Ye prop add karo (Layout smooth karega)
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden" // CHANGE 2: Explicitly batao start state
                  animate="visible" // CHANGE 3: Explicitly batao end state
                  exit="hidden" // Optional: Agar AnimatePresence use kar rahe ho
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-gray-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-violet-500/10 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    {/* User Info */}
                    <div className="flex gap-4 w-full">
                      <div className="relative shrink-0">
                        <img
                          src={
                            user.photoURL ||
                            "https://geographyandyou.com/images/user-profile.png"
                          }
                          alt={user.firstName}
                          className="w-16 h-16 rounded-full object-cover aspect-square border-2 border-violet-500/50 group-hover:scale-110 transition-all"
                        />
                        {/* <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div> */}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                          Since {new Date(createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-sm mt-2 line-clamp-1 italic">
                          {user.about || "No bio available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills Pills (Optional - agar backend se skills mangwaye ho) */}
                  {/* <div className="mt-4 flex flex-wrap gap-2">
                    {user.skillsOrInterests &&
                      Array.isArray(user.skillsOrInterests) &&
                      user.skillsOrInterests.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-gray-700/50 text-gray-300 px-2 py-1 rounded-md border border-gray-600"
                        >
                          {skill}
                        </span>
                      ))}
                  </div> */}

                  {/* Actions Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      to={`/chat`} // Chat route (Chat feature jab banaoge tab kaam aayega)
                      className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl font-semibold transition-all active:scale-95 text-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Message
                    </Link>

                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-semibold transition-all active:scale-95 text-sm border border-gray-600"
                    >
                      View Profile
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <div className="text-6xl mb-4 grayscale opacity-50">🔍</div>
            <h3 className="text-xl text-gray-400 font-bold">
              No connections found
            </h3>
            <p className="text-gray-600 text-sm">
              Try searching for a different name
            </p>
          </div>
        )}
      </div>

      {/* --- PROFILE MODAL (PREVIEW) --- */}
      <AnimatePresence>
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[400px] h-[600px]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute -top-4 -right-4 z-[60] bg-gray-800 text-white rounded-full p-2 shadow-lg border border-gray-600 hover:bg-red-500 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Reusing UserCard but disabling drag */}
              <UserCard
                user={selectedUser}
                isTopCard={true}
                isPreview={true} // Drag disabled
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Connections;
