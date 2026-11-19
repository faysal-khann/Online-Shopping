import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    subtitle: { type: String, trim: true, maxlength: 160, default: "" },
    image: { type: String, required: true },
    link: { type: String, default: "/list" },
    buttonText: { type: String, trim: true, maxlength: 24, default: "Shop now" },
    active: { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);