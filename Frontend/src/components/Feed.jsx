import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 🔥 IMPORTANT: Ye variable yaad rakhega ki last fetch kahan tak hua tha
  // Screen par cards hon ya na hon, isko farq nahi padta.
  const lastFetchedId = useRef(null);

  const getFeed = async () => {
    // Agar fetch chal raha hai ya data khatam ho gaya hai, toh ruk jao
    if (isFetching || !hasMore || !user) return;

    setIsFetching(true);
    try {
      let url = `${BASE_URL}feed?limit=10`;

      // Agar pehle kuch fetch ho chuka hai, toh us ID ke baad ka data mango
      if (lastFetchedId.current) {
        url += `&after=${lastFetchedId.current}`;
      }

      const res = await axios.get(url, { withCredentials: true });
      const newUsers = res.data.data || [];

      if (newUsers.length === 0) {
        setHasMore(false); // Ab DB me aur log nahi hain
      } else {
        // Double Check: Duplicate hatane ke liye (safety)
        // Redux me jo pehle se hain unhe filter kar lo
        const uniqueNewUsers = newUsers.filter(
          (newUser) =>
            !feed?.some((existingUser) => existingUser._id === newUser._id)
        );

        if (uniqueNewUsers.length > 0) {
          dispatch(addFeed(uniqueNewUsers));
          // Last Fetched ID ko update karo taaki agli call iske aage se ho
          lastFetchedId.current = newUsers[newUsers.length - 1]._id;
        } else {
          // Agar filter ke baad sab duplicate nikle, lekin backend ne data bheja tha
          // Iska matlab humein aur aage dhoondna padega
          lastFetchedId.current = newUsers[newUsers.length - 1]._id;
          // Recursively agla batch bula lo (taaki user stuck na ho)
          setIsFetching(false);
          getFeed();
          return;
        }
      }
    } catch (error) {
      console.error("Feed fetch error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // 1. Initial Load (Sirf ek baar)
  useEffect(() => {
    if (user) {
      // Agar redux khali hai toh fetch karo
      if (!feed || feed.length === 0) {
        getFeed();
      } else {
        // Agar Redux me pehle se data hai (refresh ke baad),
        // toh cursor ko sync kar do last user ke saath
        lastFetchedId.current = feed[feed.length - 1]._id;
      }
    }
  }, [user]);

  // 2. Infinite Scroll Trigger
  useEffect(() => {
    // Jab cards 4 se kam bachein, naya maal mangwa lo
    if (feed && feed.length <= 4 && hasMore && !isFetching && user) {
      getFeed();
    }
  }, [feed, hasMore, isFetching, user]);

  const handleManualRefresh = () => {
    setHasMore(true);
    lastFetchedId.current = null; // Cursor reset
    dispatch(addFeed(null)); // UI reset -> First useEffect will trigger fetch
  };

  if (!user) return null;

  if (feed === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black/50">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-violet-600"></span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero h-[100dvh] w-full overflow-hidden"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      <div className="hero-overlay bg-black/70"></div>

      <div className="hero-content text-center px-2 my-9 w-full max-w-full">
        <div className="flex flex-col items-center justify-center w-full">
          {feed.length > 0 && (
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter uppercase italic px-2">
                Find Connections
              </h1>
            </div>
          )}

          <div className="relative w-full max-w-[min(90vw,400px)] aspect-[2/3] max-h-[75vh] flex justify-center items-center sm:mt-2 mt-1">
            {feed.length > 0 ? (
              [...feed]
                .reverse()
                .map((user, index) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    isTopCard={index === feed.length - 1}
                  />
                ))
            ) : (
              <div className="text-center p-8 bg-base-300/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl mx-4">
                <div className="text-4xl mb-4">😲</div>
                <h2 className="text-lg font-bold text-white mb-4">
                  No more developers left!
                </h2>
                <button
                  className="btn btn-sm md:btn-md bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white font-bold px-8 rounded-full hover:scale-105 transition-all"
                  onClick={handleManualRefresh}
                >
                  Refresh Feed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
