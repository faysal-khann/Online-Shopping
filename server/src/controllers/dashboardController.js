import User from "../models/User.js";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Session from "../models/Session.js";
import { describeDevice } from "../lib/device.js";
import { profileOf } from "./profileController.js";

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 200 },
  { name: "Gold", min: 1000 },
];

const tierFor = (points) => {
  let idx = 0;
  TIERS.forEach((t, i) => {
    if (points >= t.min) idx = i;
  });
  const next = TIERS[idx + 1];
  return { tier: TIERS[idx].name, next: next ? { name: next.name, at: next.min } : null };
};

const loadUser = (id) => User.findById(id).select("+password");

export const overview = async (req, res) => {
  const user = await loadUser(req.user._id);
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();

  const counted = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = counted.reduce((s, o) => s + o.total, 0);
  const points = Math.floor(
    orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0)
  );
  const activeOrders = orders.filter((o) => ["pending", "paid", "shipped"].includes(o.status)).length;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en", { month: "short" }), total: 0 };
  });
  for (const o of counted) {
    const d = new Date(o.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.total += o.total;
  }

  const openReturns = await ReturnRequest.countDocuments({
    user: user._id,
    status: { $in: ["requested", "approved"] },
  });

  res.json({
    profile: profileOf(user),
    stats: {
      totalOrders: orders.length,
      totalSpent,
      activeOrders,
      wishlistCount: user.wishlist.length,
      openReturns,
    },
    rewards: { points, ...tierFor(points) },
    monthly: months.map(({ label, total }) => ({ label, total })),
    recentOrders: orders.slice(0, 5).map((o) => ({
      _id: o._id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  });
};

export const updatePreferences = async (req, res) => {
  const { orderEmails, promotions } = req.body;
  if (typeof orderEmails !== "boolean" || typeof promotions !== "boolean")
    return res.status(400).json({ message: "Invalid preferences" });
  const user = await loadUser(req.user._id);
  user.prefs = { orderEmails, promotions };
  await user.save();
  res.json({ profile: profileOf(user) });
};

export const listSessions = async (req, res) => {
  const sessions = await Session.find({ user: req.user._id }).sort({ lastSeenAt: -1 }).lean();
  res.json({
    sessions: sessions.map((s) => ({
      _id: s._id,
      device: describeDevice(s.userAgent),
      ip: s.ip,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      current: String(s._id) === req.sessionId,
    })),
  });
};

export const revokeSession = async (req, res) => {
  if (req.params.id === req.sessionId)
    return res.status(400).json({ message: "Use Logout to end this device's session" });
  await Session.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ message: "Session ended" });
};

export const revokeOtherSessions = async (req, res) => {
  await Session.deleteMany({ user: req.user._id, _id: { $ne: req.sessionId } });
  res.json({ message: "Signed out everywhere else" });
};