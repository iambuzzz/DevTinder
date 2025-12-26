const express = require("express");
require("dotenv").config();
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
        return res.status(400).send("Invalid Status!");
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).send("User not found!");
      }

      const existingReq = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingReq) {
        return res.status(400).send("Request already exist!");
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.json({
        message: "Connection Request send successfully!",
        data,
      });
    } catch (err) {
      console.log(err);
      res.status(400).send("ERROR : " + err.message);
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
        throw new Error("Invalid Status!");
      }
      const requestId = req.params.requestId;
      const request = await ConnectionRequest.findById(requestId);
      const loggedinUser = req.user;
      if (!request) {
        throw new Error("Request does not exist");
      }
      if (!request.toUserId.equals(loggedinUser._id)) {
        throw new Error("Not Authorized to Accept Or Reject the reqeust!");
      }
      if (!request.status === "interested") {
        throw new Error("Not Authorized to Accept Or Reject the reqeust!!");
      }
      request.status = status;
      const data = await request.save();
      console.log(data);
      res.send("Request " + status + " successfully!");
    } catch (err) {
      res.status(400).send("Something went wrong : " + err.message);
    }
  }
);

module.exports = requestRouter;
