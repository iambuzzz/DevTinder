const mongoose = require("mongoose");
const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: `{VVALUE} is incorrect status type`,
      },
    },
  },
  { timestamps: true }
);

//creating indexes for fast querying
// An index is like a book index — it makes finding data fast.
// Without index → MongoDB scans every document in a collection (called COLLSCAN).
// With index → MongoDB jumps directly to matching records (called IXSCAN).
// ✔️ Unique Index Example
// emailId: {
//   type: String,
//   unique: true
// }
// ✔️ Simple Index
// userSchema.index({ emailId: 1 });
// ✔️ Descending Index
// userSchema.index({ createdAt: -1 });
// ⚠️ BUT — Indexes Have Cost
// Cost	                    Why
// Slow write operations-	MongoDB updates index on every insert/update
// Takes disk space-        Index stored on disk
// Bad indexes slow DB-     too many or wrong indexes hurt performance
// SO:Only create indexes for fields you query frequently.

// 🔥 INDEX ORDER MATTERS
// MongoDB follows:
// LEFT PREFIX RULE
// For:
// { firstName: 1, lastName: 1, age: 1 }
// Efficient for:
// firstName
// firstName + lastName
// firstName + lastName + age
// Not efficient for:
// lastName
// age
// lastName + age

// Sparse Index
// Ignores documents without field
// Useful for optional fields
// userSchema.index({ phone: 1 }, { sparse: true });

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true }); //Supports queries using firstName + lastName and uniqueness is on the combination together, not individually

connectionRequestSchema.pre("save", function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    throw new Error("Invalid request! cannot send request to yourself!");
  }
  next();
});
const ConnectionRequest = mongoose.model(
  "ConnectionRequests",
  connectionRequestSchema
);
module.exports = ConnectionRequest;
