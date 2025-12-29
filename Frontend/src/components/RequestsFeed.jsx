import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests } from "../utils/requestSlice"; // Naya slice
import UserCard from "./UserCard";

const RequestsFeed = () => {
  const requests = useSelector((store) => store.requests || []);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(BASE_URL + "user/requests", {
        withCredentials: true,
      });

      console.log("Full API Response:", res.data); // DEBUGGING KE LIYE

      // API structure check: res.data.data array hona chahiye
      const rawData = res.data.data || [];

      if (!Array.isArray(rawData)) {
        console.error("Data is not an array");
        return;
      }

      const formattedData = rawData
        .filter((item) => item && item.fromUserId) // Safety check: if fromUserId is missing
        .map((item) => ({
          ...item.fromUserId,
          requestId: item._id,
        }));

      console.log("Formatted Data for Cards:", formattedData);
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
      <div className="flex justify-center items-center min-h-screen bg-black">
        <span className="loading loading-spinner loading-lg text-violet-600"></span>
      </div>
    );
  }

  return (
    <div
      className="hero min-h-screen relative"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      <div className="hero-overlay bg-black/70"></div>

      <div className="hero-content text-center p-0 w-full z-10">
        <div className="flex flex-col items-center w-full px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              Review Requests
            </h1>
            <div className="badge badge-secondary font-bold px-4 py-3 mt-2">
              {requests?.length || 0} Pending
            </div>
          </div>

          <div className="relative w-full max-w-[360px] md:max-w-[400px] h-[600px] flex justify-center items-center">
            {requests && requests.length > 0 ? (
              [...requests].reverse().map((user, index) => (
                <UserCard
                  key={user.requestId}
                  user={user}
                  isTopCard={index === requests.length - 1}
                  // Isse UserCard ko pata chalega ki swipe hone par requestSlice se data delete karna hai
                  isReviewMode={true}
                />
              ))
            ) : (
              <div className="text-center p-10 bg-base-300/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Inbox Empty!
                </h2>
                <p className="text-gray-400 mb-6">
                  You've reviewed all pending connection requests.
                </p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="btn btn-primary bg-gradient-to-r from-blue-600 to-purple-600 border-none rounded-full px-8 shadow-lg shadow-purple-500/20"
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
