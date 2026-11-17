import { Router } from "express";
import {
  register, login, logout, me,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword, googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.post("/register", register);
r.post("/login", login);
r.post("/logout", logout);
r.get("/me", protect, me);

r.post("/verify-email", protect, verifyEmail);
r.post("/resend-verification", protect, resendVerification);
r.post("/forgot-password", forgotPassword);
r.post("/reset-password", resetPassword);
r.post("/google", googleLogin);
export default r;