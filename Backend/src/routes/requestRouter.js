const express = require("express");
const ConnectionRequest = require("../models/connectionRequest");
const requestRouter = express.Router();
const auth = require("../middlewares/auth.js");
const User = require("../models/user.js");
/*
  // --- OLD CODE (Phase 2 - only socketId) ---
  // const { getUserSocketId } = require("../config/redis"); // [PHASE 2] Redis Session Service
*/
// --- NEW CODE (Phase 3 - full session with gRPC address) ---
const { getUserSession } = require("../config/redis"); // [PHASE 2+3] Redis Session Service
const { grpcDeliverNotification } = require("../grpc/grpcClient"); // [PHASE 3] gRPC Client

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
      // --- NEW CODE (Phase 3 - Redis + gRPC for cross-server notifications) ---
      const targetSession = await getUserSession(targetUserIdString);

      // Debugging Log (Agar ab bhi issue aaye toh isse check karna)
      // console.log(`Sending Req to: ${targetUserIdString}, SessionFound: ${!!targetSession}`);

      if (targetSession) {
        const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
        const myGrpcAddress = `${process.env.GRPC_HOST || "localhost"}:${process.env.GRPC_PORT || 4000}`;
        const payload = { fromUser: req.user, message: "New connection request received!" };

        if (targetGrpcAddress === myGrpcAddress) {
          // SAME SERVER: emit locally
          global.io.to(targetSocketId).emit("newConnectionRequest", payload);
        } else {
          // DIFFERENT SERVER: use gRPC
          try {
            await grpcDeliverNotification(targetGrpcAddress, targetSocketId, "newConnectionRequest", payload);
          } catch (grpcErr) {
            console.error("gRPC connection request notification failed:", grpcErr.message);
          }
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
        // --- NEW CODE (Phase 3 - Redis + gRPC for cross-server notifications) ---
        const targetSession = await getUserSession(targetUserId.toString());
        if (targetSession) {
          const { socketId: targetSocketId, grpcAddress: targetGrpcAddress } = targetSession;
          const myGrpcAddress = `${process.env.GRPC_HOST || "localhost"}:${process.env.GRPC_PORT || 4000}`;
          const payload = {
            message: `Your connection request was ${status}!`,
            data: {
              user: req.user,
              requestId: request._id,
              status: "accepted",
              createdAt: new Date(),
            },
          };

          if (targetGrpcAddress === myGrpcAddress) {
            // SAME SERVER: emit locally
            global.io.to(targetSocketId).emit("connectionAccepted", payload);
          } else {
            // DIFFERENT SERVER: use gRPC
            try {
              await grpcDeliverNotification(targetGrpcAddress, targetSocketId, "connectionAccepted", payload);
            } catch (grpcErr) {
              console.error("gRPC accepted notification failed:", grpcErr.message);
            }
          }
        }
      }
      res.status(200).json({ message: "Request " + status + " successfully!" });
    } catch (err) {
      res
        .status(400)
        .send({ message: `Request accept/reject failed`, error: err.message });
    }
  }
);

module.exports = requestRouter;
