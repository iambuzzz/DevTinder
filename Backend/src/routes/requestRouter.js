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
        message: "Connection Request sned successfully!",
        data,
      });
    } catch (err) {
      console.log(err);
      res.status(400).send("ERROR : " + err.message);
    }
  }
);

module.exports = requestRouter;
