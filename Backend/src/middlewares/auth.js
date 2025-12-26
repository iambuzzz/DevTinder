const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const auth = async (req, res, next) => {
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({
      message: "Authorization failed",
      error: "Unauthorized: no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Authorization failed",
        error: "User not found",
      });
    }

    req.user = user; //attach user
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Authorization failed",
        error: "Session expired, please login again",
      });
    }

    return res
      .status(401)
      .json({ message: "Authorization failed", error: "Invalid token" });
  }
};

module.exports = auth;
