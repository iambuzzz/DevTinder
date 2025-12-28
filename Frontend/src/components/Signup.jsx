import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import validator from "validator";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
  });

  const [responseErr, setResponseErr] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      return setResponseErr("Passwords do not match!");
    }

    try {
      const signupData = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
      };
      delete signupData.confirmPassword;

      const res = await axios.post(BASE_URL + "signup", signupData, {
        withCredentials: true,
      });

      dispatch(addUser(res.data.data));
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Signup failed";
      setResponseErr(msg);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "age") {
      if (value !== "" && (Number(value) < 0 || Number(value) > 120)) {
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
    if (responseErr) setResponseErr("");
  };

  const isPasswordStrong = (pass) => {
    return validator.isStrongPassword(pass, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
  };

  const hasTypedPassword = formData.password.length > 0;
  const passwordValid = isPasswordStrong(formData.password);
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;
  const hasTypedConfirm = formData.confirmPassword.length > 0;

  return (
    <div
      className="hero min-h-screen"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      {/* Background Dark Overlay */}
      <div className="hero-overlay bg-black/50"></div>

      <div className="hero-content w-full py-20">
        <div className="w-full max-w-lg p-8 bg-base-300/50 rounded-xl shadow-2xl border border-white/40 backdrop-blur-sm">
          <h2 className="text-3xl font-extrabold text-white mb-6">
            Create Account
          </h2>

          {responseErr && (
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
              <span>{responseErr}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold mb-1 text-gray-300">
                  First Name*
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
              <label className="label">
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
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold mb-1 text-gray-300">
                  Email ID*
                </span>
              </label>
              <input
                name="emailId"
                type="email"
                className="w-full bg-black/40 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-violet-500 transition-all"
                value={formData.emailId}
                onChange={handleChange}
                placeholder="Email"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-300">
                  Password*
                </span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className={`w-full bg-black/40 border p-3 rounded-lg outline-none transition-all ${
                    !hasTypedPassword
                      ? "border-gray-600 focus:border-violet-500"
                      : passwordValid
                      ? "border-green-500"
                      : "border-red-500"
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-300">
                  Confirm Password*
                </span>
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className={`w-full bg-black/40 border p-3 rounded-lg outline-none transition-all ${
                    !hasTypedConfirm
                      ? "border-gray-600 focus:border-violet-500"
                      : passwordsMatch
                      ? "border-green-500"
                      : "border-red-500"
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    Age*
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
                <label className="label">
                  <span className="label-text font-semibold mb-1 text-gray-300">
                    Gender*
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
          </div>

          <button
            className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none text-white font-bold py-3 mt-8 rounded-lg transition-all active:scale-95"
            onClick={handleSignup}
          >
            Sign Up
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
