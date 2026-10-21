const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === "production" ? ".env.production" : ".env") });

const { initializeSocket } = require("./utils/socket.js");
const { startGrpcServer } = require("./grpc/grpcServer");
const { config } = require("devtinder-shared");
const { dbConnect, kafka: { connectKafkaProducer } } = config;

const app = express();
app.use(cors({ origin: true, credentials: true }));

const server = http.createServer(app);
initializeSocket(server);

// Define basic health check route
app.get("/health", (req, res) => res.send("Chat-WS is healthy"));

const start = async () => {
  try {
    await dbConnect();
    console.log("Connected to MongoDB from chat-ws");
    
    await connectKafkaProducer();
    console.log("Connected to Kafka Producer from chat-ws");

    const HTTP_PORT = process.env.WS_PORT || 5002;
    const GRPC_PORT = process.env.GRPC_PORT || 4002;

    server.listen(HTTP_PORT, () => {
      console.log(`💬 WebSocket Server running on port ${HTTP_PORT}`);
    });

    startGrpcServer(global.io, GRPC_PORT);
    console.log(`📡 gRPC Server listening on port ${GRPC_PORT}`);
  } catch (err) {
    console.error("Startup failed for chat-ws", err);
  }
};

start();
