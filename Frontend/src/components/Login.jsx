import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { addFeed } from "../utils/feedSlice";
import { addRequests } from "../utils/requestSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [responseErr, setResponseErr] = useState("");

  // CHANGE 1: Loading state banaya
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation taaki khali hone par call na jaye
    if (!email || !password) {
      setResponseErr("Please enter email and password");
      return;
    }

    setResponseErr(""); // Purana error hatao
    setIsLoading(true); // CHANGE 2: Loading start

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
      const res3 = await axios.get(BASE_URL + "user/requests", {
        withCredentials: true,
      });
      const userData = res.data.data;
      const feedData = res2.data.data || [];
      const reqData = res3.data.data || [];

      dispatch(addUser(userData));
      dispatch(addFeed(feedData));
      dispatch(addRequests(reqData));

      navigate("/");
    } catch (err) {
      console.log(err.message);
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
    } finally {
      // CHANGE 3: Chahe success ho ya error, loading band honi chahiye
      // Note: Agar navigate ho gaya to ye component unmount ho jayega, jo ki fine hai.
      setIsLoading(false);
    }
  };

  return (
    <div
      className="hero min-h-screen bg-base-200"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      <div className="hero-overlay bg-black/50"></div>

      <div className="hero-content flex-col w-full py-20">
        <div className="w-full max-w-md p-8 bg-base-300/50 rounded-xl shadow-2xl border border-white/40 backdrop-blur-sm">
          <h2 className="text-3xl font-extrabold text-white mb-6">Login</h2>

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

            {/* CHANGE 4: Button with Loader Logic */}
            <button
              className={`btn w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white font-bold py-3 mt-2 rounded-lg transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={handleLogin}
              disabled={isLoading} // Button disable kar diya taaki double click na ho
            >
              {isLoading ? (
                // Spinner UI
                <span className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-md"></span>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
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
