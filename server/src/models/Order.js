import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
        color: String,
        size: String,
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
