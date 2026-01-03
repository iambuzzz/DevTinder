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
    });
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
module.exports = chatRouter;
