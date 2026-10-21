const socket = require("socket.io");
const jwt = require("jsonwebtoken");
const ConnectionRequest = require("../models/connectionRequest");
const cookie = require("cookie"); // Install: npm install cookie
const Chat = require("../models/chat");
const Message = require("../models/message"); // [ARCHITECTURAL CHANGE] Added new Message model
const User = require("../models/user");
const { setUserOnline, getUserSession, getUserSocketId, setUserOffline, getAllOnlineUsers, redis } = require("../config/redis"); // [PHASE 2+3] Redis Session Service
const { grpcDeliverMessage, grpcDeliverTypingIndicator } = require("../grpc/grpcClient"); // [PHASE 3] gRPC Client

// Create a dedicated Redis subscriber connection for Pub/Sub
const Redis = require("ioredis");
const redisSub = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

// [PHASE 4] Kafka Integration
const { createConsumer, publishMessage } = require("../config/kafka");

/*
  // --- OLD CODE (In-Memory Map) ---
  // const onlineUsers = new Map();
  // WHY REMOVED: This Map only lives in ONE server's RAM. In a multi-server 
  // setup (behind a Load Balancer), Server A can't see users on Server B.
  // REPLACED WITH: Redis Session Service (see ../config/redis.js)
*/
const onlineUsers = new Map(); // [KEPT FOR REFERENCE] Still exported but no longer primary source of truth

const initializeSocket = (server) => {
  const io = socket(server, {
    path: "/socket.io",
    cors: {
      origin: [
        "http://localhost:5173",
        "http://devtinder.iambuzzdev.in",
        "https://iambuzzdev.in",
        "http://13.48.58.37",
        "https://13.48.58.37",
      ],
      credentials: true, // Cookies allow karne ke liye zaroori hai
    },
  });
  global.io = io;
  global.onlineUsers = onlineUsers;

  /*
    // --- OLD CODE (Phase 3: Redis Pub/Sub Global Broadcast) ---
    // redisSub.subscribe("globalEvents");
    // redisSub.on("message", (channel, message) => {
    //   if (channel === "globalEvents") {
    //     try {
    //       const data = JSON.parse(message);
    //       if (data.type === "UPDATE_ONLINE_USERS") {
    //         io.emit("onlineUsersList", data.payload);
    //       }
    //     } catch (err) { console.error("Redis PubSub parsing error:", err); }
    //   }
    // });
  */

  // --- [PHASE 4 FIX] REDIS PUB/SUB FOR PRESENCE ---
  // We use Redis Pub/Sub for presence because it's instantaneous and doesn't suffer from 
  // Kafka consumer group rebalancing delays. Kafka is kept strictly for chat messages (durability).
  redisSub.subscribe("presenceEvents");
  redisSub.on("message", (channel, message) => {
    if (channel === "presenceEvents") {
      try {
        const event = JSON.parse(message);
        console.log(`\n⚡ [REDIS PUB/SUB] PRESENCE EVENT: ${event.userId} is ${event.type}`);
        io.emit("userStatusUpdate", {
          userId: event.userId,
          isOnline: event.type === "USER_ONLINE",
        });
      } catch (err) {
        console.error("Redis PubSub parsing error:", err);
      }
    }
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

  io.on("connection", async (socket) => {
    const rawId = socket.user.id || socket.user._id;
    const userId = rawId.toString();

    /*
      // --- OLD CODE (In-Memory Map) ---
      // onlineUsers.delete(userId); // Safety cleanup
      // onlineUsers.set(userId, socket.id);
    */
    
    // --- CRITICAL FIX: REGISTER LISTENERS SYNCHRONOUSLY FIRST ---
    // We must attach this here before ANY await calls.
    socket.on("getOnlineUsers", async () => {
      const list = await getAllOnlineUsers();
      console.log(`[DEBUG] getOnlineUsers requested by ${userId}. Returning ${list.length} users.`);
      io.to(socket.id).emit("onlineUsersList", list);
    });

    // --- NEW CODE (Redis Session Service) ---
    // Register this user's socketId in Redis so ANY server can find them!
    /*
      // --- OLD CODE (Phase 2 - no grpcAddress) ---
      // await setUserOnline(userId, socket.id);
    */
    // --- NEW CODE (Phase 3 - with grpcAddress) ---

    // [DEBUG LOGS] - Multi-server testing
    console.log(`\n🟢 USER CONNECTING`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Socket ID: ${socket.id}`);

    /*
      // --- OLD CODE ---
      // io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
    */
    // --- NEW CODE ---
    /*
      // --- OLD CODE (Phase 3) ---
      // const onlineList = await getAllOnlineUsers();
      // redis.publish("globalEvents", JSON.stringify({ 
      //   type: "UPDATE_ONLINE_USERS", 
      //   payload: onlineList 
      // }));
    */


    // Listeners are now safely registered at the top of the connection handler.

    socket.on("disconnect", async () => {
      /*
        // --- OLD CODE ---
        // onlineUsers.delete(userId);
      */
      // --- NEW CODE ---
      await setUserOffline(userId);

      // [DEBUG LOG]
      console.log(`\n🔴 USER DISCONNECTED`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Server: HTTP:${process.env.HTTP_PORT || 3000}\n`);

      // DB update same rahega...
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (e) {
        console.error("LastSeen Error", e);
      }

      /*
        // --- OLD CODE (Phase 3) ---
        // const onlineList = await getAllOnlineUsers();
        // redis.publish("globalEvents", JSON.stringify({ 
        //   type: "UPDATE_ONLINE_USERS", 
        //   payload: onlineList 
        // }));
      */
      // --- NEW CODE (Phase 4 Fix: Redis Pub/Sub) ---
      redis.publish("presenceEvents", JSON.stringify({
        type: 'USER_OFFLINE',
        userId: userId
      }));
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

        // 1. DB Save logic (Refactored for Phase 1)
        // [BUG FIX]: Ensure we use ObjectIds for the query to prevent Mongoose from failing 
        // to find the chat and accidentally creating duplicate Chat documents!
        const mongoose = require("mongoose");
        
        // --- NEW CODE (Phase 4: Kafka Message Durability) ---
        // We now offload DB saving and gRPC delivery to the background worker!
        // This ensures the socket event loop is never blocked by MongoDB latency.
        const messageId = new mongoose.Types.ObjectId();
        await publishMessage("chat-messages", userId, {
          senderId: userId,
          targetId: targetId,
          text: text,
          messageId: messageId.toString()
        });
        
        console.log(`\n💬 [KAFKA] MESSAGE PRODUCED`);
        console.log(`   From: ${userId} → To: ${targetId}`);
        console.log(`   Text: "${text}"`);
        console.log(`   Worker will save to DB and deliver via gRPC\n`);

        /*
          // --- OLD CODE (Phase 3: Synchronous DB Save & Delivery) ---
          let chat = await Chat.findOne({
            participants: { $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(targetId)] },
          });
          
          if (!chat) {
            chat = new Chat({ participants: [userId, targetId] });
            await chat.save();
          }

          const newMessage = new Message({
            chatId: chat._id,
            senderId: userId,
            targetId: targetId,
            text: text,
            status: "sent"
          });
          await newMessage.save();

          chat.lastMessageId = newMessage._id;
          await chat.save();

          const targetSession = await getUserSession(targetId);
          if (targetSession) {
            const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
            const myGrpcAddress = `${process.env.GRPC_HOST || "localhost"}:${process.env.GRPC_PORT || 4000}`;
            const messageTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            if (targetGrpcAddress === myGrpcAddress) {
              io.to(targetSocketId).emit("msgrecieved", {
                text, senderId: userId, seen: false, time: messageTime,
              });
            } else {
              await grpcDeliverMessage(targetGrpcAddress, targetSocketId, text, userId);
            }
          } else {
            console.log(`\n💬 MESSAGE SENT (but target OFFLINE)`);
            console.log(`   From: ${userId} → To: ${targetId}`);
            console.log(`   Message safely stored in Database. Will be delivered when they connect.\n`);
          }
        */
      } catch (err) {
        console.error("SendMessage Error:", err);
      }
    });

    // --- 5. TYPING INDICATOR ---
    socket.on("typing", async ({ targetId, isTyping }) => {
      const userId = (socket.user.id || socket.user._id).toString();
      /*
        // --- OLD CODE (Room-based, same-server only) ---
        // const roomId = [userId, targetId].sort().join("_");
        // socket.to(roomId).emit("userTyping", { senderId: userId, isTyping });
      */
      // --- NEW CODE (Phase 3 - gRPC for cross-server typing) ---
      const targetSession = await getUserSession(targetId);
      if (targetSession) {
        const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
        const myGrpcAddress = `${process.env.GRPC_HOST || "localhost"}:${process.env.GRPC_PORT || 4000}`;

        if (targetGrpcAddress === myGrpcAddress) {
          // SAME SERVER: emit locally
          io.to(targetSocketId).emit("userTyping", { senderId: userId, isTyping });
        } else {
          // DIFFERENT SERVER: use gRPC
          try {
            await grpcDeliverTypingIndicator(targetGrpcAddress, targetSocketId, userId, isTyping);
          } catch (grpcErr) {
            // Typing indicator is non-critical, silently fail
          }
        }
      }
    });


    // --- CRITICAL FIX: REGISTER REDIS/KAFKA AT THE VERY END ---
    // Now that ALL socket listeners are registered, we can safely await
    const grpcAddress = `${process.env.GRPC_HOST || "localhost"}:${process.env.GRPC_PORT || 4000}`;
    await setUserOnline(userId, socket.id, grpcAddress);
    console.log(`\n🟢 USER CONNECTED`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Server: HTTP:${process.env.HTTP_PORT || 3000} | gRPC:${process.env.GRPC_PORT || 4000}`);
    console.log(`   Registered in Redis → session:${userId} = {socketId, grpcAddress: ${grpcAddress}}\n`);

    // --- NEW CODE (Phase 4 Fix: Redis Pub/Sub) ---
    redis.publish("presenceEvents", JSON.stringify({
      type: 'USER_ONLINE',
      userId: userId
    }));
  });
};

module.exports = { initializeSocket, onlineUsers };
