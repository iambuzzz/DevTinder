import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  const getFeed = async (pageNumber) => {
    if (isFetching) return;
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
    if (feed === null) {
      getFeed(1);
    }
  }, []);

  useEffect(() => {
    if (feed && feed.length === 2 && !isFetching) {
      const nextPage = page + 1;
      setPage(nextPage);
      getFeed(nextPage);
    }
  }, [page]);

  if (feed === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
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
    // CHANGE 1: Full-screen background image for Feed
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      {/* CHANGE 2: Dark Overlay taaki cards clear dikhein */}
      <div className="hero-overlay bg-black/60"></div>

      <div className="hero-content text-center p-0 w-full">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative w-[90%] max-w-[360px] md:max-w-[400px] h-[600px] flex justify-center items-center mt-4">
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
              // Empty State UI
              <div className="text-center p-10 bg-base-300/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-5xl mb-4">😲</div>
                <h2 className="text-xl font-bold text-white mb-4">
                  No more developers left!
                </h2>
                <button
                  className="btn bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white font-bold px-8 rounded-full hover:scale-105 transition-all"
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
