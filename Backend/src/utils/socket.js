const socket = require("socket.io");
const jwt = require("jsonwebtoken");
const ConnectionRequest = require("../models/connectionRequest");
const cookie = require("cookie"); // Install: npm install cookie
const Chat = require("../models/chat");
const User = require("../models/user");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = socket(server, {
    path: "/socket.io",
    cors: {
      origin: [
        "http://localhost:5173",
        "https://iambuzzdev.in",
        "http://13.48.58.37",
        "https://13.48.58.37",
      ],
      credentials: true, // Cookies allow karne ke liye zaroori hai
    },
  });
  global.io = io;
  global.onlineUsers = onlineUsers;

  // --- 1. AUTHENTICATION MIDDLEWARE ---
  // Ye block har connection se pehle JWT verify karega
  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error("No cookies"));

      const parsed = cookie.parse(cookies);

      const token = parsed.authToken; // <<=== IMPORTANT
      if (!token) return next(new Error("No authToken cookie"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;

      next();
    } catch (err) {
      next(new Error("Authentication error: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const rawId = socket.user.id || socket.user._id;
    const userId = rawId.toString();

    // 1. Map Update
    onlineUsers.delete(userId); // Safety cleanup
    onlineUsers.set(userId, socket.id);

    // console.log("✅ User Connected:", userId); // Debugging ke liye on kar sakte ho

    io.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    // --- CHANGE 2: LISTENER FOR FRONTEND REQUEST ---
    socket.on("getOnlineUsers", () => {
      // Sirf us bande ko list bhejo jisne maangi hai
      io.to(socket.id).emit("onlineUsersList", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      // DB update same rahega...
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (e) {
        console.error("LastSeen Error", e);
      }
      io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
    });

    // --- 3. JOIN CHAT (With DB Check) ---
    socket.on("joinChat", async ({ targetId }) => {
      try {
        const isConnected = await ConnectionRequest.findOne({
          $or: [
            { fromUserId: userId, toUserId: targetId, status: "accepted" },
            { fromUserId: targetId, toUserId: userId, status: "accepted" },
          ],
        });

        if (isConnected) {
          const roomId = [userId, targetId].sort().join("_");
          socket.join(roomId);
        } else {
          console.log(
            `Access denied: No connection between ${userId} and ${targetId}`
          );
        }
      } catch (err) {
        console.error("JoinChat Error:", err);
      }
    });

    // --- 4. SEND MESSAGE (With Room Ownership Check) ---
    // --- 4. SEND MESSAGE (Updated to prevent duplicates) ---
    socket.on("sendMessage", async ({ targetId, text }) => {
      try {
        const userId = (socket.user?.id || socket.user?._id).toString();
        const roomId = [userId, targetId].sort().join("_");

        // 1. DB Save logic (same rakho)
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetId] },
        });
        if (!chat)
          chat = new Chat({ participants: [userId, targetId], messages: [] });
        chat.messages.push({ senderId: userId, text: text });
        await chat.save();

        // 2. Sirf ek baar bhejenge!
        // Hum seedha target ke socket par bhejenge, chahe wo kahin bhi ho.
        const targetSocketId = onlineUsers.get(targetId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("msgrecieved", {
            text,
            senderId: userId,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
      } catch (err) {
        console.error("SendMessage Error:", err);
      }
    });
    // --- 5. TYPING INDICATOR ---
    socket.on("typing", ({ targetId, isTyping }) => {
      const userId = (socket.user.id || socket.user._id).toString();
      const roomId = [userId, targetId].sort().join("_");

      // Ye message us room mein sabko jayega (except sender)
      socket.to(roomId).emit("userTyping", {
        senderId: userId,
        isTyping,
      });
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
