const mongoose = require("mongoose");
const Chat = require("./src/models/chat");
const Message = require("./src/models/message");
require("dotenv").config();

// Temporary schema to read the old embedded messages
const oldChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [{
    senderId: mongoose.Schema.Types.ObjectId,
    text: String,
    seen: Boolean,
    createdAt: Date,
    updatedAt: Date
  }],
  lastMessageId: mongoose.Schema.Types.ObjectId
}, { collection: 'chats' });

const OldChat = mongoose.model("OldChat", oldChatSchema);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB for Migration...");

    const chats = await OldChat.find({});
    console.log(`Found ${chats.length} chat documents.`);

    let migratedCount = 0;

    for (let chat of chats) {
      if (chat.messages && chat.messages.length > 0) {
        console.log(`Migrating ${chat.messages.length} messages for Chat ${chat._id}`);
        
        // Find the other participant for targetId mapping
        const p1 = chat.participants[0].toString();
        const p2 = chat.participants[1].toString();

        for (let msg of chat.messages) {
          const senderString = msg.senderId.toString();
          const targetString = senderString === p1 ? p2 : p1;

          // Check if message already migrated to prevent duplicates
          const exists = await Message.findOne({ 
            chatId: chat._id, 
            text: msg.text, 
            createdAt: msg.createdAt 
          });

          if (!exists) {
            const newMsg = new Message({
              chatId: chat._id,
              senderId: msg.senderId,
              targetId: targetString,
              text: msg.text,
              status: msg.seen ? "read" : "sent",
              createdAt: msg.createdAt,
              updatedAt: msg.updatedAt
            });
            await newMsg.save();
            migratedCount++;
            
            // Set lastMessageId if it's the last one
            if (msg === chat.messages[chat.messages.length - 1]) {
              await Chat.findByIdAndUpdate(chat._id, { lastMessageId: newMsg._id });
            }
          }
        }
      }
    }

    console.log(`Migration Complete! Migrated ${migratedCount} messages.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
