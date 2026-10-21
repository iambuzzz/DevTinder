const express = require("express");
const chatRouter = express.Router();
const { models } = require("devtinder-shared");
const { Chat, Message } = models;
/*
  // --- OLD CODE (Phase 2 - only socketId) ---
  // const { getUserSocketId } = require("../config/redis"); // [PHASE 2] Redis Session Service
*/
// --- NEW CODE (Phase 3 - full session with gRPC address) ---
const { config } = require("devtinder-shared");
const { redis: { getUserSession } } = config;
const { grpcDeliverSeenUpdate } = require("../grpc/grpcClient");
const auth = require("../middlewares/auth");

chatRouter.post("/chat/:id", auth, async (req, res) => {
  const userId = req.user._id;
  const targetId = req.params.id;
  if (targetId.toString() !== req.body.targetId.toString()) {
    return res.status(400).json({ message: "Target ID mismatch" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] },
    }).populate("participants", "firstName lastName photoURL lastSeen");
    
    if (!chat) {
      /*
        // OLD CODE: 
        // chat = new Chat({ participants: [userId, targetId], messages: [] });
      */
      chat = new Chat({ participants: [userId, targetId] });
      await chat.save();
    }

    // [ARCHITECTURAL CHANGE] Fetch messages from the new collection and inject them into the response
    // so the frontend React component doesn't break!
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    
    const chatData = chat.toObject();
    // Re-attaching for backwards compatibility with frontend. 
    // We map our new 'status' field to the old boolean 'seen' field so the React app doesn't break!
    chatData.messages = messages.map(m => {
      const mObj = m.toObject();
      mObj.seen = mObj.status === "read";
      return mObj;
    });

    res
      .status(200)
      .json({ message: "Chat retrieved successfully", data: chatData });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error retrieving chat", error: err.message });
  }
});

chatRouter.get("/user/chats", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName photoURL lastSeen")
      /*
        // OLD CODE:
        // .populate("lastMessageId") // [ARCHITECTURAL CHANGE] Populate the new reference
      */
      .sort({ updatedAt: -1 });

    // [BUG FIX]: Instead of relying on lastMessageId (which can be stale if there are 
    // duplicate Chat documents or migration issues), we now directly query the Message 
    // collection for the very latest message in each chat. This is always accurate!
    const chatList = await Promise.all(chats.map(async (chat) => {
      const targetUser = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      // Query the latest message directly from the Message collection
      const latestMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .lean();

      return {
        _id: chat._id,
        targetUser,
        /*
          // OLD CODE: 
          // lastMessage: chat.messages[chat.messages.length - 1],
        */
        // NEW CODE:
        lastMessage: latestMessage,
        updatedAt: chat.updatedAt,
      };
    }));

    res.status(200).json(chatList);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
});

chatRouter.get("/unread-counts", auth, async (req, res) => {
  const userId = req.user._id;
  try {
    /*
      // --- OLD CODE (relied on embedded array) ---
      // const chats = await Chat.find({ participants: userId });
      // let counts = {};
      // 
      // chats.forEach((chat) => {
      //   const unread = chat.messages.filter(
      //     (msg) => msg.senderId.toString() !== userId.toString() && !msg.seen
      //   ).length;
      // 
      //   const targetUser = chat.participants.find(
      //     (p) => p.toString() !== userId.toString()
      //   );
      //   if (unread > 0) counts[targetUser] = unread;
      // });
    */

    // NEW CODE: Fast query on the Message collection!
    const unreadMessages = await Message.find({ 
      targetId: userId, 
      status: { $ne: "read" } 
    });

    let counts = {};
    unreadMessages.forEach((msg) => {
      const senderString = msg.senderId.toString();
      counts[senderString] = (counts[senderString] || 0) + 1;
    });

    res.json(counts); // Return karega: { "userId123": 5, "userId456": 2 }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// backend/routes/chatRouter.js

chatRouter.post("/chat/seen/:targetId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const targetId = req.params.targetId;

    // 1. Database Update: Target ke messages ko "seen" mark karo
    /*
      // --- OLD CODE ---
      // await Chat.updateOne(
      //   { participants: { $all: [userId, targetId] } },
      //   {
      //     $set: { "messages.$[elem].seen": true },
      //   },
      //   {
      //     arrayFilters: [{ "elem.senderId": targetId, "elem.seen": false }],
      //   }
      // );
    */
    // NEW CODE: Update direct Message documents
    await Message.updateMany(
      { senderId: targetId, targetId: userId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    // 2. REAL-TIME NOTIFICATION (The Magic Step ✨)
    // Hum check karenge ki kya Sender (Target) online hai?
    // Agar haan, toh usse turant batao ki messages seen ho gaye.
    /*
      // --- OLD CODE (In-Memory Map) ---
      // Note: 'global.onlineUsers' tumhare socket.js se aa raha hai
      // const targetSocketId = global.onlineUsers?.get(targetId);
    */
    /*
      // --- OLD CODE (Phase 2 - Redis but no gRPC, same-server only) ---
      // const targetSocketId = await getUserSocketId(targetId);
      // if (targetSocketId) {
      //   global.io.to(targetSocketId).emit("msgSeenUpdate", { viewerId: userId });
      // }
    */
    const targetSession = await getUserSession(targetId);
    if (targetSession) {
      const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
      // ALWAYS DIFFERENT SERVER: use gRPC (since core-api is REST only)
      try {
        await grpcDeliverSeenUpdate(targetGrpcAddress, targetSocketId, userId.toString());
      } catch (grpcErr) {
        console.error("gRPC seen update failed:", grpcErr.message);
      }
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = chatRouter;
