const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === "production" ? ".env.production" : ".env") });

const { config } = require("devtinder-shared");
const { dbConnect } = config;
const { initChatWorker } = require("./workers/chatWorker.js");

const start = async () => {
  try {
    await dbConnect();
    console.log("Connected to MongoDB from presence-router");
    
    await initChatWorker();
    console.log("Kafka Chat Worker initialized in presence-router");
  } catch (err) {
    console.error("Startup failed for presence-router", err);
  }
};

start();
