const { createConsumer } = require("../config/kafka");
const Chat = require("../models/chat");
const Message = require("../models/message");
const mongoose = require("mongoose");
const { grpcDeliverMessage } = require("../grpc/grpcClient");
const { getUserSession } = require("../config/redis");
const dbConnect = require("../config/dbConnect");

const initChatWorker = async () => {
  // Wait for DB connection
  await dbConnect();

  // Create consumer for chat messages
  // We use the SAME groupId across all worker instances so that Kafka 
  // load-balances the messages (each message is processed exactly once)
  const consumer = createConsumer("chat-worker-group");

  try {
    await consumer.connect();
    console.log("✅ Kafka Chat Worker connected");

    await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          const { senderId, targetId, text, messageId } = data;

          console.log(`[KAFKA WORKER] Processing message ${messageId} from ${senderId} to ${targetId}`);

          // 1. Save to Database (Durability)
          let chat = await Chat.findOne({
            participants: { $all: [new mongoose.Types.ObjectId(senderId), new mongoose.Types.ObjectId(targetId)] },
          });

          if (!chat) {
            chat = new Chat({ participants: [senderId, targetId] });
            await chat.save();
          }

          const newMessage = new Message({
            senderId,
            targetId,
            chatId: chat._id,
            text,
          });
          await newMessage.save();

          // Update latestMessage
          chat.latestMessage = newMessage._id;
          await chat.save();

          // 2. Deliver via gRPC (Real-time delivery if user is online)
          const targetSession = await getUserSession(targetId);
          if (targetSession) {
            const success = await grpcDeliverMessage(
              targetSession.grpcAddress,
              targetSession.socketId,
              text,
              senderId
            );
            if (!success) {
              console.log(`[KAFKA WORKER] gRPC delivery failed for ${targetId}, but message is saved in DB.`);
            }
          } else {
            console.log(`[KAFKA WORKER] Target ${targetId} is offline. Message safely queued in DB.`);
          }

        } catch (err) {
          console.error("❌ [KAFKA WORKER] Error processing message:", err);
          // In a real production app, we would push this to a Dead Letter Queue (DLQ)
        }
      },
    });
  } catch (error) {
    console.error("❌ Kafka Chat Worker failed to start:", error);
  }
};

// If run directly (e.g., node chatWorker.js)
if (require.main === module) {
  require("dotenv").config(); // Ensure env vars are loaded
  initChatWorker();
}

module.exports = { initChatWorker };
