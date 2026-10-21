const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

/*
  [PHASE 3: gRPC CLIENT]
  
  WHAT: This module creates gRPC client connections to OTHER chat servers.
        When we need to deliver a message to a user on a different server,
        we use this client to make the gRPC call.
  
  WHY: Direct server-to-server communication is the fastest way (~1-2ms)
       to deliver messages between chat servers hosting different users.
  
  HOW: 
       1. We maintain a cache of gRPC client connections (so we don't create
          a new connection for every single message — that would be slow)
       2. When socket.js needs to send a message to Server 2, it calls
          getGrpcClient("localhost:4001") which returns a reusable client
       3. The client has methods like .deliverMessage(), .deliverSeenUpdate(), etc.
  
  CONNECTION POOLING:
       If we have 1000 servers, each server doesn't connect to all 999 others.
       It only connects to servers it's ACTIVELY communicating with.
       Idle connections are cleaned up after a timeout.
*/

// Load the proto file (same as grpcServer.js)
const PROTO_PATH = path.join(__dirname, "chat.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

// --- Connection Cache ---
// We reuse gRPC connections to avoid the overhead of creating new ones.
// Key: "host:port" (e.g., "localhost:4001")
// Value: gRPC client instance
const clientCache = new Map();

/**
 * Get a gRPC client for the given server address.
 * Returns a cached client if one exists, otherwise creates a new connection.
 * 
 * @param {string} grpcAddress - The target server's gRPC address (e.g., "localhost:4001")
 * @returns {object} A gRPC ChatService client
 */
const getGrpcClient = (grpcAddress) => {
  // Check cache first
  if (clientCache.has(grpcAddress)) {
    return clientCache.get(grpcAddress);
  }

  // Create a new client connection
  const client = new chatProto.ChatService(
    grpcAddress,
    grpc.credentials.createInsecure(), // No TLS for development
    {
      // Connection options
      "grpc.keepalive_time_ms": 10000,           // Send keepalive ping every 10s
      "grpc.keepalive_timeout_ms": 5000,          // Wait 5s for ping response
      "grpc.keepalive_permit_without_calls": 1,   // Allow keepalive even when idle
    }
  );

  // Cache it for reuse
  clientCache.set(grpcAddress, client);
  console.log(`📡 gRPC Client connected to ${grpcAddress}`);

  return client;
};

// --- Helper Functions ---
// These wrap the raw gRPC calls in Promises so we can use async/await

/**
 * Deliver a chat message to a user on another server via gRPC.
 */
const grpcDeliverMessage = (grpcAddress, targetSocketId, text, senderId, time) => {
  return new Promise((resolve, reject) => {
    const client = getGrpcClient(grpcAddress);
    client.deliverMessage(
      { targetSocketId, text, senderId, time },
      { deadline: new Date(Date.now() + 3000) }, // 3 second timeout
      (err, response) => {
        if (err) {
          console.error(`gRPC DeliverMessage to ${grpcAddress} failed:`, err.message);
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
};

/**
 * Notify a user on another server that their messages were seen.
 */
const grpcDeliverSeenUpdate = (grpcAddress, targetSocketId, viewerId) => {
  return new Promise((resolve, reject) => {
    const client = getGrpcClient(grpcAddress);
    client.deliverSeenUpdate(
      { targetSocketId, viewerId },
      { deadline: new Date(Date.now() + 3000) },
      (err, response) => {
        if (err) {
          console.error(`gRPC DeliverSeenUpdate to ${grpcAddress} failed:`, err.message);
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
};

/**
 * Send typing indicator to a user on another server.
 */
const grpcDeliverTypingIndicator = (grpcAddress, targetSocketId, senderId, isTyping) => {
  return new Promise((resolve, reject) => {
    const client = getGrpcClient(grpcAddress);
    client.deliverTypingIndicator(
      { targetSocketId, senderId, isTyping },
      { deadline: new Date(Date.now() + 3000) },
      (err, response) => {
        if (err) {
          console.error(`gRPC DeliverTypingIndicator to ${grpcAddress} failed:`, err.message);
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
};

/**
 * Send a generic notification to a user on another server.
 * Used for connection requests, accepted notifications, etc.
 */
const grpcDeliverNotification = (grpcAddress, targetSocketId, eventName, payload) => {
  return new Promise((resolve, reject) => {
    const client = getGrpcClient(grpcAddress);
    client.deliverNotification(
      { targetSocketId, eventName, payloadJson: JSON.stringify(payload) },
      { deadline: new Date(Date.now() + 3000) },
      (err, response) => {
        if (err) {
          console.error(`gRPC DeliverNotification to ${grpcAddress} failed:`, err.message);
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
};

module.exports = {
  getGrpcClient,
  grpcDeliverMessage,
  grpcDeliverSeenUpdate,
  grpcDeliverTypingIndicator,
  grpcDeliverNotification,
};
