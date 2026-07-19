const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

/*
  [PHASE 3: gRPC SERVER]
  
  WHAT: Each chat server instance runs this gRPC server on a separate port.
        It listens for calls from OTHER chat servers.
  
  WHY: When Server 1 needs to deliver a message to a user on Server 2,
       Server 1 calls Server 2's gRPC endpoint. Server 2 receives the call
       HERE and pushes the message to the correct local WebSocket.
  
  HOW: 
       1. We load the .proto file to understand the service contract
       2. We implement each RPC method (DeliverMessage, DeliverSeenUpdate, etc.)
       3. Each method uses the local `io` (Socket.io) instance to emit to the target socket
       4. The gRPC server starts on GRPC_PORT (separate from HTTP port)
  
  EXAMPLE:
       HTTP Server on port 3000, gRPC Server on port 4000
       HTTP Server on port 3001, gRPC Server on port 4001
*/

// Load the proto file
const PROTO_PATH = path.join(__dirname, "chat.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,       // Convert snake_case to camelCase automatically
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

/**
 * Start the gRPC server.
 * We pass in the Socket.io `io` instance so gRPC handlers can emit to local sockets.
 * 
 * @param {object} io - The Socket.io server instance (for emitting to local WebSockets)
 * @param {number} port - The gRPC port to listen on
 * @returns {object} The gRPC server instance
 */
const startGrpcServer = (io, port) => {
  const server = new grpc.Server();

  // Register the ChatService with all its RPC handlers
  server.addService(chatProto.ChatService.service, {

    // --- 1. DeliverMessage ---
    // Called when another server wants us to deliver a chat message to a local user
    deliverMessage: (call, callback) => {
      try {
        const { targetSocketId, text, senderId, time } = call.request;
        
        // [DEBUG LOG] - Multi-server testing
        console.log(`\n📥 gRPC RECEIVED: DeliverMessage`);
        console.log(`   From sender: ${senderId}`);
        console.log(`   Text: "${text}"`);
        console.log(`   Delivering to local socket: ${targetSocketId}`);
        console.log(`   On Server: HTTP:${process.env.HTTP_PORT || 3000} | gRPC:${process.env.GRPC_PORT || 4000}\n`);

        // Emit directly to the target socket on THIS server
        io.to(targetSocketId).emit("msgrecieved", {
          text,
          senderId,
          seen: false,
          time,
        });

        callback(null, { success: true });
      } catch (err) {
        console.error("gRPC DeliverMessage error:", err);
        callback(null, { success: false, error: err.message });
      }
    },

    // --- 2. DeliverSeenUpdate ---
    // Called when another server wants to notify a local user that their messages were read
    deliverSeenUpdate: (call, callback) => {
      try {
        const { targetSocketId, viewerId } = call.request;

        io.to(targetSocketId).emit("msgSeenUpdate", {
          viewerId,
        });

        callback(null, { success: true });
      } catch (err) {
        console.error("gRPC DeliverSeenUpdate error:", err);
        callback(null, { success: false });
      }
    },

    // --- 3. DeliverTypingIndicator ---
    // Called when another server wants to show/hide typing indicator for a local user
    deliverTypingIndicator: (call, callback) => {
      try {
        const { targetSocketId, senderId, isTyping } = call.request;

        io.to(targetSocketId).emit("userTyping", {
          senderId,
          isTyping,
        });

        callback(null, { success: true });
      } catch (err) {
        console.error("gRPC DeliverTypingIndicator error:", err);
        callback(null, { success: false });
      }
    },

    // --- 4. DeliverNotification ---
    // Generic: connection requests, accepted notifications, etc.
    deliverNotification: (call, callback) => {
      try {
        const { targetSocketId, eventName, payloadJson } = call.request;
        const payload = JSON.parse(payloadJson);

        io.to(targetSocketId).emit(eventName, payload);

        callback(null, { success: true });
      } catch (err) {
        console.error("gRPC DeliverNotification error:", err);
        callback(null, { success: false });
      }
    },
  });

  // Start listening
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(), // No TLS for development
    (err, boundPort) => {
      if (err) {
        console.error("❌ gRPC Server failed to start:", err);
        return;
      }
      console.log(`✅ gRPC Server listening on port ${boundPort}`);
    }
  );

  return server;
};

module.exports = { startGrpcServer };
