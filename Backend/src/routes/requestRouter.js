const express = require("express");
const ConnectionRequest = require("../models/connectionRequest");
const requestRouter = express.Router();
const auth = require("../middlewares/auth.js");
const User = require("../models/user.js");

requestRouter.post(
  "/request/send/:status/:toUserId",
  auth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const status = req.params.status;
      const toUserId = req.params.toUserId;

      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Request sending failed", error: "Invalid Status" });
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({
          message: "Request sending failed",
          error: "User not found",
        });
      }

      const existingReq = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingReq) {
        return res.status(400).json({
          message: "Request sending failed",
          error: "Request already exists",
        });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      // Connection request save hone ke baad
      const targetUserIdString = toUserId.toString();
      const targetSocketId = global.onlineUsers.get(targetUserIdString);

      // Debugging Log (Agar ab bhi issue aaye toh isse check karna)
      // console.log(`Sending Req to: ${targetUserIdString}, SocketFound: ${targetSocketId}`);

      if (targetSocketId) {
        global.io.to(targetSocketId).emit("newConnectionRequest", {
          fromUser: req.user,
          message: "New connection request received!",
        });
      }

      res.json({
        message: "Connection Request send successfully!",
        data: data,
      });
    } catch (err) {
      res
        .status(400)
        .json({ message: "Request sending failed", error: err.message });
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  auth,
  async (req, res) => {
    try {
      const status = req.params.status;
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        throw new Error("Invalid status");
      }
      const requestId = req.params.requestId;
      const request = await ConnectionRequest.findById(requestId);
      const loggedinUser = req.user;
      if (!request) {
        throw new Error("Request does not exist");
      }
      if (!request.toUserId.equals(loggedinUser._id)) {
        throw new Error("Not authorized to accept or reject the reqeust");
      }
      if (!request.status === "interested") {
        throw new Error("Not authorized to accept or reject the reqeust");
      }
      request.status = status;
      const data = await request.save();
      res.status(200).json({ message: "Request " + status + " successfully!" });
    } catch (err) {
      res
        .status(400)
        .send({ message: `Request accept/reject failed`, error: err.message });
    }
  }
);

module.exports = requestRouter;
