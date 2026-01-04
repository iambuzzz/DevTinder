import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests } from "../utils/requestSlice";
import UserCard from "./UserCard";

const RequestsFeed = () => {
  const requests = useSelector((store) => store.requests);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(BASE_URL + "user/requests", {
        withCredentials: true,
      });

      const rawData = res.data.data || [];

      if (!Array.isArray(rawData)) {
        console.error("Data is not an array");
        return;
      }

      const formattedData = rawData
        .filter((item) => item && item.fromUserId)
        .map((item) => ({
          ...item.fromUserId,
          requestId: item._id,
        }));

      dispatch(addRequests(formattedData));
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black/50">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-violet-600"></span>
          <p className="text-gray-400 font-medium">Checking your inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero min-h-screen w-full overflow-hidden" // overflow-hidden added
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      <div className="hero-overlay bg-black/70"></div>

      {/* Padding aur margins ko responsive kiya */}
      <div className="hero-content text-center px-2 my-9 w-full max-w-full z-10">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter uppercase italic">
              Review Requests
            </h1>
            <div className="badge badge-secondary font-bold px-4 py-3 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white shadow-lg">
              {requests?.length || 0} Pending
            </div>
          </div>

          {/* CARD CONTAINER: Responsive Scaling applied */}
          <div className="relative w-full max-w-[min(90vw,400px)] aspect-[2/3] max-h-[70vh] flex justify-center items-center sm:mt-2 mt-1">
            {requests && requests.length > 0 ? (
              [...requests]
                .reverse()
                .map((user, index) => (
                  <UserCard
                    key={user.requestId}
                    user={user}
                    isTopCard={index === requests.length - 1}
                    isReviewMode={true}
                  />
                ))
            ) : (
              <div className="text-center p-8 bg-base-300/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl mx-4">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Inbox Empty!
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                  You've reviewed all pending connection requests.
                </p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="btn btn-sm md:btn-md bg-gradient-to-r from-blue-600 to-purple-600 border-none rounded-full px-8 text-white font-bold"
                >
                  Explore More Devs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestsFeed;
