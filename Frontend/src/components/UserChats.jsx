import React from "react";

const UserChats = () => {
  return (
    <div>
      <div
        className="hero min-h-screen"
        style={{
          backgroundImage:
            "url(https://tinder.com/static/build/8ad4e4299ef5e377d2ef00ba5c94c44c.webp)",
        }}
      >
        <div className="hero-overlay bg-black/70"></div>

        <div className="hero-content text-center p-0 my-20 w-full">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="text-center p-10 bg-base-300/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
              <div className="text-5xl mb-4">🕣</div>
              <h2 className="text-xl font-bold text-white mb-4">
                Coming soon!
              </h2>
              <button
                className="btn bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white font-bold px-8 rounded-full hover:scale-105 transition-all"
                onClick={() => getFeed(1)}
              >
                Refresh Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChats;
