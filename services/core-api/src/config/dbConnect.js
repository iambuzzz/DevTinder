const mongoose = require("mongoose");
const dbConnect = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully...");
};
module.exports = dbConnect;
