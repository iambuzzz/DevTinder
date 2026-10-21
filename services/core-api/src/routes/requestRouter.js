const express = require("express");
const { models } = require("devtinder-shared");
const { ConnectionRequest, User } = models;
const requestRouter = express.Router();
const auth = require("../middlewares/auth.js");
const sendEmail = require("../utils/sendEmail.js");
/*
  // --- OLD CODE (Phase 2 - only socketId) ---
  // const { getUserSocketId } = require("../config/redis"); // [PHASE 2] Redis Session Service
*/
const { config } = require("devtinder-shared");
const { redis: { getUserSession } } = config;
const { grpcDeliverNotification } = require("../grpc/grpcClient");
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
      /*
        // --- OLD CODE (In-Memory Map) ---
        // const targetSocketId = global.onlineUsers.get(targetUserIdString);
      */
      /*
        // --- OLD CODE (Phase 2 - Redis but no gRPC, same-server only) ---
        // const targetSocketId = await getUserSocketId(targetUserIdString);
        // if (targetSocketId) {
        //   global.io.to(targetSocketId).emit("newConnectionRequest", { ... });
        // }
      */
      const targetSession = await getUserSession(targetUserIdString);

      if (targetSession) {
        const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
        
        // Use gRPC to tell the chat-ws microservice to deliver the notification
        try {
          await grpcDeliverNotification(targetGrpcAddress, targetSocketId, "newConnectionRequest", { 
            fromUser: req.user, 
            message: "New connection request received!" 
          });
        } catch (grpcErr) {
          console.error("gRPC connection request notification failed:", grpcErr.message);
        }
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

      if (status === "accepted") {
        const targetUserId = request.fromUserId;
        /*
          // --- OLD CODE (In-Memory Map) ---
          // const targetSocketId = global.onlineUsers.get(targetUserId.toString());
        */
        /*
          // --- OLD CODE (Phase 2 - Redis but no gRPC, same-server only) ---
          // const targetSocketId = await getUserSocketId(targetUserId.toString());
          // if (targetSocketId) { global.io.to(targetSocketId).emit(...); }
        */
        const targetSession = await getUserSession(targetUserId.toString());
        
        if (targetSession) {
          const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
          
          const payload = {
            message: `Your connection request was ${status}!`,
            data: {
              user: req.user,
              requestId: request._id,
              status: "accepted",
              createdAt: new Date(),
            },
          };

          // Use gRPC to tell the chat-ws microservice to deliver the notification
          try {
            await grpcDeliverNotification(targetGrpcAddress, targetSocketId, "connectionAccepted", payload);
          } catch (grpcErr) {
            console.error("gRPC accepted notification failed:", grpcErr.message);
          }
        }      }
      res.status(200).json({ message: "Request " + status + " successfully!" });
    } catch (err) {
      res
        .status(400)
        .send({ message: `Request accept/reject failed`, error: err.message });
    }
  }
);

module.exports = requestRouter;
