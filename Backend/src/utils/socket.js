const socket = require("socket.io");
const jwt = require("jsonwebtoken");
const ConnectionRequest = require("../models/connectionRequest");
const cookie = require("cookie"); // Install: npm install cookie
const Chat = require("../models/chat");

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
    // --- 2. JOIN CHAT (With DB Check) ---
    socket.on("joinChat", async ({ targetId }) => {
      try {
        const userId = socket.user.id || socket.user._id;

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

    // --- 3. SEND MESSAGE (With Room Ownership Check) ---
    socket.on("sendMessage", async ({ targetId, text }) => {
      try {
        const userId = socket.user?.id || socket.user?._id;
        const roomId = [userId, targetId].sort().join("_");
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetId] },
        });
        if (!chat) {
          chat = new Chat({ participants: [userId, targetId], messages: [] });
        }
        chat.messages.push({ senderId: userId, text: text });
        await chat.save();

        // Check if user is actually in the room before sending

        if ([...socket.rooms].includes(roomId)) {
          io.to(roomId).emit("msgrecieved", {
            text,
            senderId: userId,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        } else {
          console.log(
            `Spam prevention: User ${userId} tried to send message to unauthorized room ${roomId}`
          );
        }
      } catch (err) {
        console.error("SendMessage Error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected safely");
    });
  });
};

module.exports = initializeSocket;
