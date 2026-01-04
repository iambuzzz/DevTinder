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
    const userId = socket.user.id || socket.user._id;

    // 1. User online aaya: Map mein daalo aur sabko broadcast karo
    // Pehle purani socket id remove karo (if any)
    onlineUsers.delete(userId);
    // Nayi fresh socket id set karo
    onlineUsers.set(userId, socket.id);

    // Debugging ke liye log dalo
    console.log(`User Connected: ${userId} with SocketID: ${socket.id}`);
    io.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    // 2. User disconnect hua: Map se hatao aur sabko broadcast karo
    socket.on("disconnect", async () => {
      //Map se hatao
      onlineUsers.delete(userId);

      // DB mein Last Seen update karo (Very Important)
      try {
        // Use your actual user model path
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (e) {
        console.error("LastSeen Error", e);
      }
      // Sabko update bhej do
      io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
      console.log(`User ${userId} offline`);
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
          //   console.log(`Secure room joined: ${roomId}`);
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

        // 1. DB mein save karo
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetId] },
        });
        if (!chat) {
          chat = new Chat({ participants: [userId, targetId], messages: [] });
        }
        chat.messages.push({ senderId: userId, text: text });
        await chat.save();

        // 2. Sirf RECEIVER ko message bhejo (SENDER ko nahi)
        // socket.to(roomId) ka matlab: "Mere alawa room mein sabko bhejo"
        socket.to(roomId).emit("msgrecieved", {
          text,
          senderId: userId,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });

        // 3. Notification ke liye:
        // Hum check karenge ki kya receiver abhi room mein hai?
        const targetSocketId = onlineUsers.get(targetId);
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);

          // Agar target user room mein NAHI hai, tabhi direct notification bhejo
          if (targetSocketId) {
            // Hum room check HATA rahe hain, seedha emit kar rahe hain
            // Isse Body.jsx hamesha notification receive karega
            io.to(targetSocketId).emit("msgrecieved", {
              text,
              senderId: userId,
              isNotification: true, // Frontend Body.jsx isse pehchanega
            });
          }
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
