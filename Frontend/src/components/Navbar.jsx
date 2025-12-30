import React, { useState, useEffect } from "react";
import Logo from "../assets/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../utils/constants";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { removeUser } from "../utils/userSlice";
import { removeFeed, clearFeed } from "../utils/feedSlice";
import { clearRequests } from "../utils/requestSlice";
import { removeConnection } from "../utils/connectionSlice"; // Optional: Agar connections clear karne ho logout par

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user);
  const request = useSelector((store) => store.requests);

  const [notification, setNotification] = useState(0);
  const [showAuthButtons, setShowAuthButtons] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowAuthButtons(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, [user]);

  const logout = async () => {
    try {
      await axios.post(BASE_URL + "logout", {}, { withCredentials: true });
      dispatch(removeUser());
      dispatch(removeFeed());
      dispatch(clearFeed());
      dispatch(clearRequests());
      dispatch(removeConnection()); // Agar connection slice clear karna ho toh
      navigate("/home");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div>
      <div className="navbar fixed top-0 w-full z-50 bg-gradient-to-b from-black/60 to-transparent shadow-none pr-2 pl-1 md:pr-8 md:pl-6 transition-all duration-300">
        <div className="flex-1">
          <Link
            to="/"
            className="btn text-xl bg-transparent px-0 border-0 shadow-none hover:scale-105"
          >
            <img src={Logo} alt="Dev Tinder Logo" className="h-9 w-9" />
            <span className="font-bold tracking-tight text-white">
              Dev Tinder
            </span>
          </Link>
        </div>
        <div className="flex gap-2 items-center min-h-[48px]">
          {showAuthButtons && (
            <>
              {user ? (
                <>
                  {/* Logged In View */}

                  {/* --- NEW CHANGE: Connections Button Added Here --- */}
                  <button
                    className="btn btn-ghost btn-circle mr-1 text-white hover:bg-white/20 transition-all"
                    onClick={() => navigate("/connection")}
                    title="Connections"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </button>
                  {/* ----------------------------------------------- */}

                  {/* Request/Notification Button */}
                  <button
                    className="btn btn-ghost btn-circle mr-2 text-white hover:bg-white/20 transition-all"
                    onClick={() => navigate("/request")}
                    title="Requests"
                  >
                    <div className="indicator">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {request && request.length !== 0 && (
                        <span className="badge badge-xs badge-primary indicator-item">
                          {request.length}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-circle avatar ring-2 ring-white/50 ring-offset-0"
                    >
                      <div className="w-8 rounded-full">
                        <img
                          alt="User profile"
                          src={
                            user.photoURL ||
                            "https://www.w3schools.com/howto/img_avatar.png"
                          }
                        />
                      </div>
                    </div>

                    <ul
                      tabIndex={0}
                      className="menu menu-sm dropdown-content bg-base-300 rounded-box z-[1] mt-1 w-52 px-2 pb-3 shadow-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <li className="pointer-events-none py-2 border-b border-white/5 flex flex-col items-start mb-2">
                        <p className="uppercase tracking-wider text-gray-500">
                          Signed in as
                        </p>
                        <p className="font-bold truncate text-white text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                      </li>
                      <li>
                        <Link
                          to="/profile"
                          onClick={() => document.activeElement.blur()}
                          className="text-sm"
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <a
                          className="text-sm"
                          onClick={() => {
                            document.activeElement.blur();
                            navigate("/chat");
                          }}
                        >
                          Messages
                        </a>
                      </li>
                      <li>
                        <a
                          onClick={() => {
                            logout();
                            document.activeElement.blur();
                          }}
                          className="text-red-400 hover:bg-red-400/10 text-sm"
                        >
                          Logout
                        </a>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                /* Logged Out View */
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <Link
                    to="/login"
                    className="btn btn-ghost text-white font-medium hover:bg-white/20 px-2 md:px-4"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-full px-4 md:px-6 font-medium font-bold hover:scale-105 transition-transform duration-200"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
