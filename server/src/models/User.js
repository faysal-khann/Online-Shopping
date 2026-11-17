import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Not required for Google accounts
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function () {
        return !this.googleId;
      },
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    googleId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, select: false },

    verifyOtpHash: { type: String, select: false },
    verifyOtpExpires: { type: Date, select: false },
    verifyOtpAttempts: { type: Number, default: 0, select: false },
    verifyOtpSentAt: { type: Date, select: false },

    verifyTokenExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (this.password) this.password = await bcrypt.hash(this.password, 10);
  // Lets us reject login cookies issued before a password change
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.matchPassword = function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);