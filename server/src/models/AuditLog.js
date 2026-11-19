import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: String,
    userRole: String,
    action: { type: String, index: true },
    target: { type: { type: String }, id: String, label: String },
    meta: mongoose.Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditSchema);