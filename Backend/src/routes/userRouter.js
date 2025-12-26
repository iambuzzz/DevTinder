const express = require("express");
const userRouter = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
userRouter.get("/user/requests", auth, async (req, res) => {
  try {
    const request = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate("fromUserId", ["firstName", "lastName"]);
    if (request.length === 0) {
      return res.send("No Pending requests!");
    }
    console.log(request);
    res.send("Found " + request.length + " requests!");
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

userRouter.get("/user/connections", auth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      $or: [
        { toUserId: req.user._id, status: "accepted" },
        { fromUserId: req.user._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", "firstName lastName")
      .populate("toUserId", "firstName lastName");

    if (!requests.length) {
      return res.status(404).send("No connections found");
    }

    const loggedInUserId = req.user._id.toString();

    const result = requests.map((req) => {
      const otherUser =
        req.fromUserId._id.toString() === loggedInUserId
          ? req.toUserId
          : req.fromUserId;

      return {
        user: otherUser,
        status: req.status,
        id: req._id,
        createdAt: req.createdAt,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(400).send("Something went wrong: " + error.message);
  }
});

userRouter.get("/feed", auth, async (req, res) => {
  try {
    const loggedinUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 2;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequest = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedinUser._id }, { toUserId: loggedinUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    hideUsersFromFeed.add(loggedinUser._id);
    connectionRequest.forEach((re) => {
      hideUsersFromFeed.add(re.fromUserId);
      hideUsersFromFeed.add(re.toUserId);
    });

    const users = await User.find({
      _id: { $nin: Array.from(hideUsersFromFeed) },
    })
      .select("_id firstName lastName age gender")
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

module.exports = userRouter;
