const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/chat");
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
    }).populate("participants", " lastSeen");
    if (!chat) {
      chat = new Chat({ participants: [userId, targetId], messages: [] });
      await chat.save();
    }
    res
      .status(200)
      .json({ message: "Chat retrieved successfully", data: chat });
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
      .sort({ updatedAt: -1 });

    const chatList = chats.map((chat) => {
      const targetUser = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: chat._id,
        targetUser,
        lastMessage: chat.messages[chat.messages.length - 1],
        updatedAt: chat.updatedAt,
      };
    });

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
    const chats = await Chat.find({ participants: userId });
    let counts = {};

    chats.forEach((chat) => {
      const unread = chat.messages.filter(
        (msg) => msg.senderId.toString() !== userId.toString() && !msg.seen
      ).length;

      const targetUser = chat.participants.find(
        (p) => p.toString() !== userId.toString()
      );
      if (unread > 0) counts[targetUser] = unread;
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

    // Is chat ke saare messages jo target ne bheje hain, unhe seen: true kar do
    await Chat.updateOne(
      { participants: { $all: [userId, targetId] } },
      {
        $set: { "messages.$[elem].seen": true },
      },
      {
        arrayFilters: [{ "elem.senderId": targetId, "elem.seen": false }],
      }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = chatRouter;
