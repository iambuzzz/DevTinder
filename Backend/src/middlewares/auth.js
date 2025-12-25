const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const auth = async (req, res, next) => {
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).send("User not found!");
    }

    req.user = user; // ⭐ attach user
    console.log("Authorized user:", user.emailId);
    return next();
  } catch (err) {
    console.error("Auth Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).send("Session expired, please login again");
    }

    return res.status(401).send("Invalid token");
  }
};

module.exports = auth;
