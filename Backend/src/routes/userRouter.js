const express = require("express");
const userRouter = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

userRouter.get("/user/requests", auth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate("fromUserId", [
      "_id",
      "firstName",
      "lastName",
      "age",
      "gender",
      "about",
      "skillsOrInterests",
      "photoURL",
    ]);

    if (requests.length === 0) {
      return res.json({ message: "No Pending requests!", data: requests });
    }
    return res.status(200).json({
      message: "Found " + requests.length + " requests!",
      data: requests,
    });
  } catch (err) {
    res.status(400).json({
      message: "Finding connection requests failed",
      error: err.message,
    });
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
      .populate(
        "fromUserId",
        "firstName lastName photoURL about age gender skillsOrInterests"
      ) // Added fields
      .populate(
        "toUserId",
        "firstName lastName photoURL about age gender skillsOrInterests"
      );

    if (!requests.length) {
      return res
        .status(404)
        .json({ message: "No connections found", data: requests });
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

    res
      .status(200)
      .json({ message: `${result.length} connections found`, data: result });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Finding users connection failed", error: err.message });
  }
});

// user.js (Backend Route)

userRouter.get("/feed", auth, async (req, res) => {
  try {
    const loggedinUser = req.user;
    const limit = parseInt(req.query.limit) || 10;
    const lastUserId = req.query.after; // Frontend se aayega

    // 1. Apne connections aur requests nikalo
    const connectionRequest = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedinUser._id }, { toUserId: loggedinUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    hideUsersFromFeed.add(loggedinUser._id);
    connectionRequest.forEach((re) => {
      hideUsersFromFeed.add(re.fromUserId);
      hideUsersFromFeed.add(re.toUserId);
    });

    // 2. Query Logic
    const query = {
      _id: { $nin: Array.from(hideUsersFromFeed) },
    };

    // Agar cursor hai, toh uske aage ka data do
    if (lastUserId) {
      query._id = { ...query._id, $gt: lastUserId };
    }

    const users = await User.find(query)
      .sort({ _id: 1 }) // Order fix rakhna zaroori hai
      .limit(limit);

    res.json({ data: users });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error fetching feed", error: err.message });
  }
});
module.exports = userRouter;
