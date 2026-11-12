import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    type: { type: String, enum: ["physical", "digital"], default: "physical" },
    colors: [String],
    sizes: [String],
    stock: { type: Number, default: 0, min: 0 },
    additionalInfo: [{ title: String, text: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);