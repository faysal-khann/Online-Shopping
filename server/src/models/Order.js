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
    subtotal: Number,
    shippingFee: Number,
    tax: Number,
    total: { type: Number, required: true },
    shippingMethod: { key: String, label: String, eta: String },
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      city: String,
      postalCode: String,
    },
    payment: {
      method: { type: String, enum: ["card", "mobile", "cod"], default: "cod" },
      status: { type: String, enum: ["unpaid", "paid", "refunded", "failed"], default: "unpaid" },
      brand: String,
      last4: String,
      provider: String,
      ref: String,
      paidAt: Date,
      refundedAt: Date,
      refundRef: String,
    },
    idempotencyKey: { type: String, index: true, unique: true, sparse: true },
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
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);