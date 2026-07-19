const Redis = require("ioredis");

/*
  [ARCHITECTURAL CHANGE - PHASE 2: SESSION SERVICE]
  
  WHY: In a multi-server setup, each Node.js process has its own RAM. 
       If User A is on Server 1 and User B is on Server 2, Server 1's 
       in-memory Map won't know about User B. Messages will fail to deliver.
  
  WHAT: Redis acts as a centralized Session Service. ALL servers read/write 
        user connection info to the SAME Redis instance. Any server can now 
        locate any connected user in sub-milliseconds.
  
  HOW: We use Redis key-value pairs with JSON values:
       Key: "session:<userId>"
       Value: JSON string { "socketId": "abc", "grpcAddress": "localhost:4000" }
       
       [PHASE 3 UPDATE]: Previously we stored just the socketId as a plain string.
       Now we store a JSON object so we also know WHICH server's gRPC endpoint
       to call for cross-server message delivery.
       
       - When a user connects: SET "session:user123" '{"socketId":"abc","grpcAddress":"localhost:4000"}'
       - When checking if online: GET "session:user123" → returns JSON or null
       - When a user disconnects: DEL "session:user123"
*/

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  // password: process.env.REDIS_PASSWORD, // Uncomment for production
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis Session Service connected successfully!");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

// --- Session Service Helper Functions ---
// These abstract away the raw Redis commands so the rest of the app
// doesn't need to know about Redis internals.

/**
 * Register a user as online.
 * Called when a WebSocket connection is established.
 * 
 * [PHASE 3 UPDATE]: Now stores grpcAddress alongside socketId
 * so other servers know WHERE to make gRPC calls.
 * 
 * @param {string} userId 
 * @param {string} socketId 
 * @param {string} grpcAddress - This server's gRPC address (e.g., "localhost:4000")
 */
const setUserOnline = async (userId, socketId, grpcAddress) => {
  /*
    // --- OLD CODE (Phase 2 - Plain string) ---
    // await redis.set(`online:${userId}`, socketId);
  */
  // --- NEW CODE (Phase 3 - JSON with gRPC address) ---
  const sessionData = JSON.stringify({ socketId, grpcAddress });
  await redis.set(`session:${userId}`, sessionData);

  // [DEBUG LOG]
  console.log(`\n🟢 [REDIS] SESSION ADDED`);
  console.log(`   Key: session:${userId}`);
  console.log(`   Value: { socketId: ${socketId}, grpcAddress: ${grpcAddress} }`);
  const allKeys = await redis.keys("session:*");
  console.log(`   Total online users in Redis: ${allKeys.length}\n`);
};

/**
 * Get the full session info of an online user.
 * Returns null if the user is offline.
 * 
 * [PHASE 3 UPDATE]: Now returns an object { socketId, grpcAddress }
 * instead of just a socketId string.
 * 
 * @param {string} userId 
 * @returns {object|null} { socketId, grpcAddress } or null if offline
 */
const getUserSession = async (userId) => {
  const data = await redis.get(`session:${userId}`);
  if (!data) {
    // [DEBUG LOG]
    console.log(`\n🔍 [REDIS] SESSION LOOKUP: session:${userId} → NOT FOUND (user offline)`);
    return null;
  }
  const parsed = JSON.parse(data);
  // [DEBUG LOG]
  console.log(`\n🔍 [REDIS] SESSION LOOKUP: session:${userId} → FOUND on gRPC:${parsed.grpcAddress}`);
  return parsed;
};

/*
  // --- OLD CODE (Phase 2) ---
  // const getUserSocketId = async (userId) => {
  //   return await redis.get(`online:${userId}`);
  // };
  // REPLACED WITH: getUserSession() which returns { socketId, grpcAddress }
*/

/**
 * Convenience function: Get just the socketId of an online user.
 * Kept for backward compatibility with code that only needs socketId.
 * @param {string} userId 
 * @returns {string|null} socketId or null
 */
const getUserSocketId = async (userId) => {
  const session = await getUserSession(userId);
  return session ? session.socketId : null;
};

/**
 * Remove a user from the online registry.
 * Called when a WebSocket disconnects.
 * @param {string} userId 
 */
const setUserOffline = async (userId) => {
  /*
    // --- OLD CODE (Phase 2) ---
    // await redis.del(`online:${userId}`);
  */
  await redis.del(`session:${userId}`);

  // [DEBUG LOG]
  console.log(`\n🔴 [REDIS] SESSION REMOVED`);
  console.log(`   Key: session:${userId}`);
  const allKeys = await redis.keys("session:*");
  console.log(`   Total online users in Redis: ${allKeys.length}\n`);
};

/**
 * Get all online user IDs.
 * Uses Redis SCAN to find all keys matching "session:*"
 * This replaces the old `Array.from(onlineUsers.keys())` pattern.
 * @returns {string[]} Array of userIds
 */
const getAllOnlineUsers = async () => {
  /*
    // --- OLD CODE (Phase 2) ---
    // const keys = await redis.keys("online:*");
    // return keys.map((key) => key.replace("online:", ""));
  */
  const keys = await redis.keys("session:*");
  return keys.map((key) => key.replace("session:", ""));
};

module.exports = {
  redis,
  setUserOnline,
  getUserSession,   // [PHASE 3] New: returns { socketId, grpcAddress }
  getUserSocketId,  // Backward compatible: returns just socketId
  setUserOffline,
  getAllOnlineUsers,
};
