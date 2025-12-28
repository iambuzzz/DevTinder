import React, { useState } from "react"; // useState add kiya
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeFeed } from "../utils/feedSlice";

const UserCard = ({ user, isTopCard }) => {
  const { _id, firstName, photoURL, age, skillsOrInterests, about } = user;
  const dispatch = useDispatch();

  // State to toggle full about text
  const [showFullAbout, setShowFullAbout] = useState(false);

  // Drag logic values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleRequest = (status) => {
    // Optimistic Update: UI se pehle hatao
    dispatch(removeFeed(_id));

    // API Call: Backend update karo
    axios
      .post(
        BASE_URL + "request/send/" + status + "/" + _id,
        {},
        { withCredentials: true }
      )
      .then((res) => console.log(status + " request successful"))
      .catch((err) => console.error("Request failed", err));
  };

  // --- 3D Hover Logic ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [7, -7]), // 15 degrees ki jagah 7 kiya (zyada tilt fast lagta hai)
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-7, 7]),
    springConfig
  );

  const handleMouseMove = (e) => {
    if (!isTopCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXRelative = (e.clientX - rect.left) / width - 0.5;
    const mouseYRelative = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(mouseXRelative);
    mouseY.set(mouseYRelative);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex: isTopCard ? 10 : 1,
        perspective: 1500,
      }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 150) handleRequest("interested");
        else if (info.offset.x < -150) handleRequest("ignored");
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <motion.div
        style={{
          rotateX: isTopCard ? rotateX : 0,
          rotateY: isTopCard ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.05 }}
        className="w-full h-full"
      >
        <figure className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-base-100">
          <img
            src={photoURL || "https://www.w3schools.com/howto/img_avatar.png"}
            alt={firstName}
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{ transform: "translateZ(50px)" }}
          />

          <div
            className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/60 to-transparent"
            style={{ transform: "translateZ(70px)" }}
          >
            {/* Flexbox use kiya Name aur Button ko ek line mein laane ke liye */}
            <div className="flex items-baseline gap-2 py-2">
              <h2 className="text-3xl font-bold text-left text-white">
                {firstName}, {age}
              </h2>

              {/* Show More/Less Button ab heading ke bagal mein hai */}
              {about && about.length > 60 && (
                <button
                  onClick={() => setShowFullAbout(!showFullAbout)}
                  className="text-[10px] px-2 py-1 rounded-md text-white font-bold uppercase tracking-tighter transition-all"
                >
                  {showFullAbout ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {about && (
              <div
                onClick={() => setShowFullAbout(!showFullAbout)}
                className="cursor-pointer pb-2"
              >
                <p
                  className={`text-sm text-left pr-3 text-white/80 transition-all duration-300 ${
                    showFullAbout ? "" : "line-clamp-2"
                  }`}
                >
                  {about}
                </p>
              </div>
            )}
          </div>
        </figure>
      </motion.div>
    </motion.div>
  );
};

export default UserCard;
