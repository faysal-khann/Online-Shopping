import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    reason: {
      type: String,
      enum: ["damaged", "wrong_item", "not_as_described", "changed_mind", "other"],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "refunded"],
      default: "requested",
    },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ReturnRequest", returnSchema);