const mongoose = require("mongoose");

/* 
  [ARCHITECTURAL CHANGE - PHASE 1]
  WHY: We are moving from an embedded array to a separate `Message` collection.
  WHAT: The old `messageSchema` and `messages: [messageSchema]` inside the Chat model are being commented out.
  HOW: We removed the array to prevent hitting the 16MB document size limit in MongoDB. 
  Now, Chat only stores the participants and a reference to the latest message (for fast feed UI).

// --- OLD CODE (Embedded Messages) ---
// const messageSchema = new mongoose.Schema(
//   {
//     senderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     text: {
//       type: String,
//       required: true,
//     },
//     seen: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );
*/

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // --- OLD CODE ---
    // messages: [messageSchema], 
    
    // --- NEW CODE ---
    // Instead of holding all messages, we just hold the ID of the last message sent in this chat.
    // This makes generating the "Recent Chats" sidebar extremely fast because we don't have to query the Message collection!
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    }
  },
  { timestamps: true }
);
const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
