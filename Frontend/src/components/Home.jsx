import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div
      // FIX: 'flex justify-center items-center' HATA DIYA hai.
      // 'hero' class apne aap center kar legi.
      className="hero min-h-[100vh]"
      style={{
        backgroundImage:
          "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
      }}
    >
      {/* Ab ye overlay background ke upar aur text ke peeche sahi se aayega */}
      <div className="hero-overlay"></div>

      <div className="hero-content text-center text-neutral-content">
        <div className="max-w-lg">
          <h1 className="mb-5 text-5xl md:text-7xl font-extrabold text-white leading-tight">
            Start something epic.
          </h1>

          <Link to="/signup">
            <button className="btn btn-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none rounded-full px-8 text-lg font-bold mt-4 hover:scale-105 transition-transform duration-200">
              Create Account
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
