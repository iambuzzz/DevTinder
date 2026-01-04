import React from "react";
import { useSelector } from "react-redux";
import UserCard from "./UserCard";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import validator from "validator";
import { useState } from "react";
const Profile = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ password: "", newPassword: "" });
  const [pwdError, setPwdError] = useState("");
  const handleChangePassword = async () => {
    try {
      setPwdError("");
      const res = await axios.patch(
        BASE_URL + "profile/changepassword",
        pwdData,
        {
          withCredentials: true,
        }
      );
      alert("Password changed successfully!");
      setShowPasswordModal(false); // Modal band kar do
      setPwdData({ password: "", newPassword: "" }); // Reset fields
    } catch (err) {
      setPwdError(err.response?.data?.error || "Failed to update password");
    }
  };
  // Local state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    age: user?.age || "",
    gender: user?.gender || "male",
    photoURL: user?.photoURL || "",
    skillsOrInterests: user?.skillsOrInterests?.join(", ") || "",
    about: user?.about || "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setError("");
      // Clean array for backend
      const updatedData = {
        ...formData,
        skillsOrInterests: formData.skillsOrInterests
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
      };
      const res = await axios.patch(BASE_URL + "profile/edit", updatedData, {
        withCredentials: true,
      });
      dispatch(addUser(res.data.data));
      alert("Profile Updated!");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Safe Preview Data Generator
  const getPreviewData = () => {
    return {
      ...formData,
      // Ensure skills is always an array for UserCard .map()
      skillsOrInterests: formData.skillsOrInterests
        ? formData.skillsOrInterests
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "")
        : [],
    };
  };
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-10 relative"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed", // YEH ZAROORI HAI: Background wahin rahega, content scroll hoga
      }}
    >
      {/* Dark Overlay - isse pura page cover hoga content badhne par bhi */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Content Wrapper - z-index 10 taaki overlay ke upar rahe */}
      <div className="relative z-10 w-full flex flex-col items-center px-3 md:px-0">
        {showPasswordModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-lg px-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md p-8 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl relative animate-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-white mb-6">
                Change Password
              </h2>

              {pwdError && (
                <p className="text-red-400 text-xs mb-4 bg-red-500/10 p-2 rounded border border-red-500/30">
                  {pwdError}
                </p>
              )}

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label-text text-gray-400 mb-1 ml-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-xl outline-none focus:border-violet-500 transition-all"
                    value={pwdData.password}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-control">
                  <label className="label-text text-gray-400 mb-1 ml-1">
                    New Strong Password
                  </label>
                  <input
                    type="password"
                    className="w-full bg-black/40 border border-gray-700 text-white p-3 rounded-xl outline-none focus:border-violet-500 transition-all"
                    value={pwdData.newPassword}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:opacity-90 transition-all active:scale-95"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
        {showPreview && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 px-4"
            // onClick={() => setShowPreview(false)}
          >
            {/* CARD CONTAINER: Feed wala responsive logic */}
            <div
              className="relative w-full max-w-[min(90vw,400px)] aspect-[2/3] max-h-[75vh] flex justify-center items-center animate-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON: Card ke andar top-right mein move kiya */}
              <button
                className="absolute top-4 right-4 z-[200] bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/70 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>

              {/* UserCard component */}
              <UserCard
                user={getPreviewData()}
                isTopCard={true}
                isPreview={true}
              />
            </div>
          </div>
        )}
        <div className="w-full max-w-lg p-8 bg-base-300/50 rounded-xl shadow-2xl border border-white/20 backdrop-blur-md my-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-extrabold text-white ">
              Edit Profile
            </h2>
            <div
              onClick={() => setShowPreview(true)}
              className="text-violet-400 hover:text-violet-600 font-semibold text-sm transition-colors hover:cursor-pointer"
            >
              PREVIEW
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg animate-in fade-in zoom-in duration-300">
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
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label w-full pl-1">
                <span className="label-text font-semibold mb-1 text-gray-300">
                  First Name
                </span>
              </label>
              <input
                name="firstName"
                type="text"
                className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Firstname"
              />
            </div>

            <div className="form-control">
              <label className="label w-full pl-1">
                <span className="label-text font-semibold mb-1 text-gray-300">
                  Last Name
                </span>
              </label>
              <input
                name="lastName"
                type="text"
                className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Lastname"
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label w-full pl-1">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    Age
                  </span>
                </label>
                <input
                  name="age"
                  type="number"
                  placeholder="Age"
                  className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label w-full pl-1">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    Gender
                  </span>
                </label>
                <select
                  name="gender"
                  className="w-full bg-black/40 border border-gray-600 text-white p-3 pr-12 rounded-lg outline-none focus:border-violet-500 transition-all h-[52px] appearance-none cursor-pointer"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    // YAHAN CHANGE KIYA HAI: 'right 1rem' se arrow thoda andar aa jayega
                    backgroundPosition: "right 1.25rem center",
                    backgroundSize: "1em",
                  }}
                >
                  <option value="" disabled className="bg-slate-900">
                    Select
                  </option>
                  <option value="male" className="bg-slate-900">
                    Male
                  </option>
                  <option value="female" className="bg-slate-900">
                    Female
                  </option>
                  <option value="other" className="bg-slate-900">
                    Other
                  </option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label w-full pl-1">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    About
                  </span>
                </label>
                <input
                  name="about"
                  type="text"
                  className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="ABout"
                />
              </div>
              <div className="form-control">
                <label className="label w-full pl-1">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    PhotoURL
                  </span>
                </label>
                <input
                  name="photoURL"
                  type="text"
                  className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                  value={formData.photoURL}
                  onChange={handleChange}
                  placeholder="PhotoURL"
                />
              </div>

              <div className="form-control">
                <label className="label w-full pl-1">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    Skills Or Interests
                  </span>
                </label>
                <textarea
                  name="skillsOrInterests"
                  type="text"
                  className="w-full text-[16px] bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all textarea textarea-bordered h-28"
                  value={formData.skillsOrInterests}
                  onChange={handleChange}
                  placeholder="Your skills or interests"
                />
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white font-bold py-3 mt-8 rounded-lg transition-all active:scale-95"
            onClick={handleSave}
          >
            Save
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Want to change the password?{" "}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline"
              >
                Change Password
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
