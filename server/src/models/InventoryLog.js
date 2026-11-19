import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },
    productName: String,
    type: { type: String, enum: ["sale", "cancel", "manual", "edit", "import", "return"], required: true },
    delta: { type: Number, required: true },
    before: Number,
    after: Number,
    reason: { type: String, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
logSchema.index({ createdAt: -1 });

export default mongoose.model("InventoryLog", logSchema);