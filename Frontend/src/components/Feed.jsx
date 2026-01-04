import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const user = useSelector((store) => store.user); // CHANGE 1: User data nikala
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const getFeed = async (pageNumber) => {
    // CHANGE 2: Security Check
    // Agar user nahi hai, toh API call mat karo (Logout fix)
    if (isFetching || !user) return;

    setIsFetching(true);
    try {
      const res = await axios.get(
        `${BASE_URL}feed?page=${pageNumber}&limit=10`,
        { withCredentials: true }
      );
      dispatch(addFeed(res.data.data || []));
    } catch (error) {
      console.error("Feed fetch error:", error);
      dispatch(addFeed([]));
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    // CHANGE 3: Logic Update
    // Feed tabhi fetch karo jab Feed Null ho AUR User Logged In ho
    if (feed === null && user) {
      getFeed(1);
    }
  }, [feed, user]); // Dependency update ki taaki user change par react kare

  useEffect(() => {
    // Scroll/Pagination Logic
    if (feed && feed.length === 2 && !isFetching && user) {
      // Yahan bhi user check
      const nextPage = page + 1;
      setPage(nextPage);
      getFeed(nextPage);
    }
  }, [page, feed, user]); // Added dependencies

  // Agar user null hai (logout state), toh Spinner mat dikhao, seedha null return karo
  // Isse UI blink nahi karega logout ke time
  if (!user) return null;

  if (feed === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black/50">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-violet-600"></span>
          <p className="text-gray-400 animate-pulse font-medium">
            Finding developers near you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero min-h-screen w-full overflow-hidden" // overflow-hidden added to prevent scroll
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      <div className="hero-overlay bg-black/70"></div>

      {/* Padding aur width ko responsive kiya gaya hai */}
      <div className="hero-content text-center px-2 my-9 w-full max-w-full">
        <div className="flex flex-col items-center justify-center w-full">
          {feed.length > 0 && (
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter uppercase italic">
                Find Connections
              </h1>
            </div>
          )}

          {/* CARD CONTAINER: Isse responsive banane ke liye changes */}
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
                  onClick={() => getFeed(1)}
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
