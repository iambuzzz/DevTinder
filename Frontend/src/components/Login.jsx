import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { addFeed } from "../utils/feedSlice";

const Login = () => {
  const [email, setEmail] = useState("ambujjaiswal@gmail.com");
  const [password, setPassword] = useState("Ambuj@123");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [responseErr, setResponseErr] = useState("");

  const handleLogin = async () => {
    const obj = {
      emailId: email,
      password: password,
    };
    try {
      const res = await axios.post(BASE_URL + "login", obj, {
        withCredentials: true,
      });
      const res2 = await axios.get(BASE_URL + "feed", {
        withCredentials: true,
      });
      const userData = res.data.data;
      const feedData = res2.data.data || [];
      dispatch(addUser(userData));
      dispatch(addFeed(feedData));
      console.log(res.data.message);
      navigate("/");
    } catch (err) {
      console.log(err);
      if (!navigator.onLine) {
        setResponseErr("No internet connection. Please check your network.");
        return;
      }

      const dbError = err.response?.data?.error;
      if (dbError && dbError.includes("ENOTFOUND")) {
        setResponseErr(
          "Server is unable to connect to the database. Check your internet."
        );
        return;
      }

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";

      setResponseErr(errorMessage);
    }
  };

  return (
    // CHANGE 1: Hero Container with Background Image
    <div
      className="hero min-h-screen bg-base-200"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      {/* CHANGE 2: Dark Overlay */}
      <div className="hero-overlay bg-black/50"></div>

      {/* CHANGE 3: Content Wrapper */}
      <div className="hero-content flex-col w-full">
        <div className="w-full max-w-md p-8 bg-base-300/50 rounded-xl shadow-2xl border border-white/40 backdrop-blur-sm">
          <h2 className="text-3xl font-extrabold text-white mb-6">Login</h2>

          {/* Error Message Section */}
          {responseErr && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg animate-in fade-in zoom-in duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{responseErr}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold mb-1 text-white/80 pl-1">
                  Email
                </span>
              </label>
              <input
                type="text"
                className="w-full bg-black/20 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold mb-1 text-white/80 pl-1">
                  Password
                </span>
              </label>
              <input
                type="password"
                className="w-full bg-black/20 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white font-bold py-3 mt-2 rounded-lg transition-colors"
              onClick={handleLogin}
            >
              Login
            </button>
            <div className="mt-1 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
