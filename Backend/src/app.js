const express = require("express");
const dbConnect = require("./config/dbConnect");

const app = express();

const start = async () => {
  try {
    await dbConnect();
    app.listen(3000, () => {
      console.log("Server running on port 3000...");
    });
  } catch (err) {
    console.error("Startup failed", err);
  }
};

start();
