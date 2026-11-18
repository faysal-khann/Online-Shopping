import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userAgent: String,
  ip: String,
  lastSeenAt: { type: Date, default: Date.now },
  // Removed automatically after 7 days, the same lifetime as the login cookie
  createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 },
});

export default mongoose.model("Session", sessionSchema);