import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { createOtp, hashOtp } from "../lib/tokens.js";
import { sendMailSafe } from "../lib/mailer.js";
import { emailChangeOtpMail } from "../lib/emailTemplates.js";
import { publicUser, sendToken } from "./authController.js";

const MIN = 60 * 1000;
const isStr = (v) => typeof v === "string";
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const profileOf = (u) => ({
  ...publicUser(u),
  hasPassword: !!u.password,
  googleLinked: !!u.googleId,
  addresses: u.addresses,
  createdAt: u.createdAt,
});

const loadUser = (id, extra = "") => User.findById(id).select(`+password ${extra}`);

// ---------- Profile ----------
export const getProfile = async (req, res) => {
  const user = await loadUser(req.user._id);
  res.json({ profile: profileOf(user) });
};

export const updateProfile = async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  if (!isStr(name) || name.trim().length < 2 || name.trim().length > 60)
    return res.status(400).json({ message: "Name must be 2 to 60 characters" });
  if (phone && (!isStr(phone) || !PHONE_RE.test(phone.trim())))
    return res.status(400).json({ message: "Enter a valid phone number" });
  if (avatarUrl && (!isStr(avatarUrl) || !/^https?:\/\/\S+$/.test(avatarUrl.trim())))
    return res.status(400).json({ message: "Avatar must be an http(s) image URL" });

  const user = await loadUser(req.user._id);
  user.name = name.trim();
  user.phone = phone?.trim() || undefined;
  user.avatarUrl = avatarUrl?.trim() || undefined;
  await user.save();
  res.json({ profile: profileOf(user) });
};

// ---------- Password ----------
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!isStr(newPassword) || newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters" });

  const user = await loadUser(req.user._id);
  if (user.password) {
    if (!isStr(currentPassword) || !(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: "Current password is incorrect" });
    if (currentPassword === newPassword)
      return res.status(400).json({ message: "New password must be different" });
  }
  // Google-only accounts have no password yet, so they can set a first one here
  user.password = newPassword;
  await user.save(); // also sets passwordChangedAt, which signs out every other device
  sendToken(res, user); // re-issues the cookie so THIS device stays signed in
};

// ---------- Connected accounts ----------
export const unlinkGoogle = async (req, res) => {
  const user = await loadUser(req.user._id);
  if (!user.googleId) return res.status(400).json({ message: "Google is not connected" });
  if (!user.password)
    return res.status(400).json({ message: "Set a password first, or you'd be locked out" });
  user.googleId = undefined;
  await user.save();
  res.json({ profile: profileOf(user) });
};

// ---------- Email change with OTP ----------
export const requestEmailChange = async (req, res) => {
  const { email, password } = req.body;
  if (!isStr(email) || !EMAIL_RE.test(email.trim()))
    return res.status(400).json({ message: "Enter a valid email" });
  const next = email.toLowerCase().trim();

  const user = await loadUser(req.user._id, "+emailOtpSentAt");
  if (user.password && (!isStr(password) || !(await user.matchPassword(password))))
    return res.status(400).json({ message: "Password is incorrect" });
  if (next === user.email)
    return res.status(400).json({ message: "That is already your email" });
  if (await User.exists({ email: next }))
    return res.status(409).json({ message: "That email is already in use" });
  if (user.emailOtpSentAt && Date.now() - user.emailOtpSentAt.getTime() < MIN)
    return res.status(429).json({ message: "Please wait a minute before requesting another code" });

  const { code, hash } = createOtp();
  user.pendingEmail = next;
  user.emailOtpHash = hash;
  user.emailOtpExpires = new Date(Date.now() + 10 * MIN);
  user.emailOtpAttempts = 0;
  user.emailOtpSentAt = new Date();
  await user.save();

  sendMailSafe({ to: next, ...emailChangeOtpMail(user.name, code) });
  res.json({ message: `A code was sent to ${next}` });
};

export const confirmEmailChange = async (req, res) => {
  const { code } = req.body;
  if (!isStr(code) || !/^\d{6}$/.test(code))
    return res.status(400).json({ message: "Enter the 6-digit code" });

  const user = await loadUser(
    req.user._id,
    "+pendingEmail +emailOtpHash +emailOtpExpires +emailOtpAttempts"
  );
  if (!user.pendingEmail || !user.emailOtpHash || !user.emailOtpExpires || user.emailOtpExpires < new Date())
    return res.status(400).json({ message: "This code has expired. Request a new one." });
  if (user.emailOtpAttempts >= 5)
    return res.status(429).json({ message: "Too many attempts. Request a new code." });

  if (hashOtp(code) !== user.emailOtpHash) {
    user.emailOtpAttempts += 1;
    await user.save();
    return res.status(400).json({ message: "Incorrect code" });
  }
  if (await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } }))
    return res.status(409).json({ message: "That email is already in use" });

  user.email = user.pendingEmail;
  user.emailVerified = true;
  user.pendingEmail = undefined;
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  user.emailOtpAttempts = 0;
  await user.save();
  res.json({ profile: profileOf(user) });
};

// ---------- Addresses ----------
const MAX_ADDRESSES = 5;

const readAddress = (b) => {
  const get = (k) => (isStr(b[k]) ? b[k].trim() : "");
  const label = ["home", "work", "other"].includes(b.label) ? b.label : "home";
  const a = {
    label,
    fullName: get("fullName"),
    phone: get("phone"),
    line1: get("line1"),
    city: get("city"),
    postalCode: get("postalCode"),
  };
  if (a.fullName.length < 2) return { error: "Full name is required" };
  if (!PHONE_RE.test(a.phone)) return { error: "Enter a valid phone number" };
  if (a.line1.length < 5) return { error: "Enter the street address" };
  if (!a.city) return { error: "City is required" };
  return { data: a };
};

export const addAddress = async (req, res) => {
  const { error, data } = readAddress(req.body);
  if (error) return res.status(400).json({ message: error });

  const user = await loadUser(req.user._id);
  if (user.addresses.length >= MAX_ADDRESSES)
    return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses` });

  const makeDefault = req.body.isDefault === true || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push({ ...data, isDefault: makeDefault });
  await user.save();
  res.status(201).json({ profile: profileOf(user) });
};

export const updateAddress = async (req, res) => {
  const { error, data } = readAddress(req.body);
  if (error) return res.status(400).json({ message: error });

  const user = await loadUser(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: "Address not found" });
  Object.assign(addr, data);
  if (req.body.isDefault === true) user.addresses.forEach((a) => (a.isDefault = a._id.equals(addr._id)));
  await user.save();
  res.json({ profile: profileOf(user) });
};

export const setDefaultAddress = async (req, res) => {
  const user = await loadUser(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: "Address not found" });
  user.addresses.forEach((a) => (a.isDefault = a._id.equals(addr._id)));
  await user.save();
  res.json({ profile: profileOf(user) });
};

export const deleteAddress = async (req, res) => {
  const user = await loadUser(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: "Address not found" });
  const wasDefault = addr.isDefault;
  user.addresses = user.addresses.filter((a) => !a._id.equals(addr._id));
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ profile: profileOf(user) });
};

// ---------- Download my data ----------
export const exportData = async (req, res) => {
  const user = await loadUser(req.user._id);
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      googleLinked: !!user.googleId,
      createdAt: user.createdAt,
    },
    addresses: user.addresses,
    orders,
  };
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="cartiva-my-data.json"');
  res.send(JSON.stringify(data, null, 2));
};

// ---------- Delete account ----------
export const deleteAccount = async (req, res) => {
  const { password, confirmEmail } = req.body;
  const user = await loadUser(req.user._id);

  if (user.role === "admin")
    return res.status(403).json({ message: "Admin accounts can't be deleted here" });

  if (user.password) {
    if (!isStr(password) || !(await user.matchPassword(password)))
      return res.status(400).json({ message: "Password is incorrect" });
  } else if (!isStr(confirmEmail) || confirmEmail.toLowerCase().trim() !== user.email) {
    return res.status(400).json({ message: "Type your email address to confirm" });
  }

  if (await Order.exists({ user: user._id, status: { $in: ["pending", "paid", "shipped"] } }))
    return res
      .status(409)
      .json({ message: "You have orders in progress. Wait until they are delivered or cancelled." });

  // Past orders are kept for the store's records, but no longer linked to a person
  await Cart.deleteOne({ user: user._id });
  await User.deleteOne({ _id: user._id });
  res.clearCookie("token");
  res.json({ message: "Account deleted" });
};

// ---------- Dashboard overview ----------
export const overview = async (req, res) => {
  const user = await loadUser(req.user._id);
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter((o) =>
    ["pending", "paid", "shipped"].includes(o.status)
  ).length;

  res.json({
    profile: profileOf(user),
    stats: { totalOrders: orders.length, totalSpent, activeOrders },
    recentOrders: orders.slice(0, 5).map((o) => ({
      _id: o._id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  });
};