import jwt from "jsonwebtoken";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import User from "../models/User.js";
import { createToken, hashToken } from "../lib/tokens.js";
import { sendMailSafe } from "../lib/mailer.js";
import { verifyEmailMail, resetPasswordMail } from "../lib/emailTemplates.js";

import { createOtp, hashOtp } from "../lib/tokens.js";
import { verifyOtpMail } from "../lib/emailTemplates.js";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:3000";
const isStr = (v) => typeof v === "string" && v.length > 0;

if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
}
export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  emailVerified: u.emailVerified,
  phone: u.phone,
  avatarUrl: u.avatarUrl,
});

export const sendToken = (res, user, status = 200) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * HOUR,
  });
  res.status(status).json({ user: publicUser(user) });
};
const issueVerification = async (user) => {
  const { code, hash } = createOtp();
  user.verifyOtpHash = hash;
  user.verifyOtpExpires = new Date(Date.now() + 10 * MIN);
  user.verifyOtpAttempts = 0;
  user.verifyOtpSentAt = new Date();
  await user.save();
  sendMailSafe({ to: user.email, ...verifyOtpMail(user.name, code) });
};
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!isStr(name) || !isStr(email) || !isStr(password))
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  if (await User.findOne({ email: email.toLowerCase().trim() }))
    return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({ name, email, password });
  await issueVerification(user);
  sendToken(res, user, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!isStr(email) || !isStr(password))
    return res.status(401).json({ message: "Invalid email or password" });
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password",
  );
  if (user && !user.password)
    return res.status(400).json({
      message:
        "This account uses Google sign-in. Use the Google button, or reset your password to add one.",
    });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid email or password" });
  sendToken(res, user);
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

export const me = (req, res) => res.json({ user: publicUser(req.user) });

// ---------- Email verification ----------
export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  if (!isStr(code) || !/^\d{6}$/.test(code))
    return res.status(400).json({ message: "Enter the 6-digit code" });

  const user = await User.findById(req.user._id).select(
    "+verifyOtpHash +verifyOtpExpires +verifyOtpAttempts",
  );
  if (user.emailVerified) return res.json({ user: publicUser(user) });
  if (!user.verifyOtpHash || !user.verifyOtpExpires || user.verifyOtpExpires < new Date())
    return res.status(400).json({ message: "This code has expired. Request a new one." });
  if (user.verifyOtpAttempts >= 5)
    return res.status(429).json({ message: "Too many attempts. Request a new code." });

  if (hashOtp(code) !== user.verifyOtpHash) {
    user.verifyOtpAttempts += 1;
    await user.save();
    return res.status(400).json({ message: "Incorrect code" });
  }

  user.emailVerified = true;
  user.verifyOtpHash = undefined;
  user.verifyOtpExpires = undefined;
  user.verifyOtpAttempts = 0;
  await user.save();
  res.json({ user: publicUser(user) });
};

export const resendVerification = async (req, res) => {
  const user = await User.findById(req.user._id).select("+verifyOtpSentAt");
  if (user.emailVerified)
    return res.status(400).json({ message: "Your email is already verified" });
  if (user.verifyOtpSentAt && Date.now() - user.verifyOtpSentAt.getTime() < MIN)
    return res.status(429).json({ message: "Please wait a minute before requesting another code" });
  await issueVerification(user);
  res.json({ message: "A new code has been sent" });
};

// ---------- Password reset ----------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!isStr(email))
    return res.status(400).json({ message: "Email is required" });

  // Same reply whether or not the account exists, so emails can't be enumerated
  const reply = {
    message: "If that email is registered, a reset link has been sent.",
  };

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+resetTokenExpires",
  );
  if (user) {
    const recentlySent =
      user.resetTokenExpires &&
      user.resetTokenExpires.getTime() - Date.now() > HOUR - MIN;
    if (!recentlySent) {
      const { raw, hash } = createToken();
      user.resetTokenHash = hash;
      user.resetTokenExpires = new Date(Date.now() + HOUR);
      await user.save();
      sendMailSafe({
        to: user.email,
        ...resetPasswordMail(
          user.name,
          `${clientUrl()}/reset-password?token=${raw}`,
        ),
      });
    }
  }
  res.json(reply);
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!isStr(token)) return res.status(400).json({ message: "Missing token" });
  if (!isStr(password) || password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select("+password +resetTokenHash +resetTokenExpires");
  if (!user)
    return res
      .status(400)
      .json({ message: "This reset link is invalid or has expired" });

  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.emailVerified = true; // they just proved they own the inbox
  await user.save();
  sendToken(res, user);
};

// ---------- Google sign-in (verified through Firebase) ----------
export const googleLogin = async (req, res) => {
  if (!process.env.FIREBASE_PROJECT_ID)
    return res
      .status(501)
      .json({ message: "Google sign-in is not configured" });
  const { credential } = req.body;
  if (!isStr(credential))
    return res.status(400).json({ message: "Missing credential" });

  let payload;
  try {
    payload = await getAuth().verifyIdToken(credential);
  } catch (e) {
    console.error("Firebase token check failed:", e.message);
    return res.status(401).json({ message: "Google sign-in failed" });
  }
  if (payload.firebase?.sign_in_provider !== "google.com")
    return res.status(401).json({ message: "Google sign-in failed" });
  if (!payload.email || !payload.email_verified)
    return res
      .status(401)
      .json({ message: "Your Google email is not verified" });

  const email = payload.email.toLowerCase();
  const googleId = payload.uid;
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email }).select("+password");
    if (user) {
      // Link Google to the existing account
      user.googleId = googleId;
      // An unverified signup may have been created by someone else using this
      // email, so drop its password before it can be used to enter the account.
      if (!user.emailVerified) user.password = undefined;
      user.emailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleId,
        emailVerified: true,
      });
    }
  }
  sendToken(res, user);
};