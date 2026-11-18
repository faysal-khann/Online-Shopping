import ReturnRequest from "../models/ReturnRequest.js";
import Order from "../models/Order.js";

const REASONS = ["damaged", "wrong_item", "not_as_described", "changed_mind", "other"];
const STATUSES = ["requested", "approved", "rejected", "refunded"];
const WINDOW_DAYS = 14;

export const createReturn = async (req, res) => {
  const { orderId, reason, details = "" } = req.body;
  if (!REASONS.includes(reason)) return res.status(400).json({ message: "Choose a reason" });
  if (typeof details !== "string" || details.length > 1000)
    return res.status(400).json({ message: "Details are too long" });

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "delivered")
    return res.status(400).json({ message: "Only delivered orders can be returned" });

  const deliveredAt = order.statusHistory.find((h) => h.status === "delivered")?.at || order.updatedAt;
  if (Date.now() - new Date(deliveredAt).getTime() > WINDOW_DAYS * 86400000)
    return res.status(400).json({ message: `The ${WINDOW_DAYS}-day return window has passed` });

  if (await ReturnRequest.exists({ order: order._id, status: { $in: ["requested", "approved", "refunded"] } }))
    return res.status(409).json({ message: "A return already exists for this order" });

  const request = await ReturnRequest.create({
    user: req.user._id,
    order: order._id,
    reason,
    details: details.trim(),
  });
  res.status(201).json({ request });
};

export const myReturns = async (req, res) => {
  const returns = await ReturnRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("order", "total createdAt items")
    .lean();
  res.json({ returns });
};

// ---- admin ----
export const adminReturns = async (req, res) => {
  const q = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  const returns = await ReturnRequest.find(q)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "name email")
    .populate("order", "total createdAt")
    .lean();
  res.json({ returns });
};

export const updateReturn = async (req, res) => {
  const { status, adminNote = "" } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
  if (typeof adminNote !== "string" || adminNote.length > 500)
    return res.status(400).json({ message: "Note is too long" });
  const request = await ReturnRequest.findByIdAndUpdate(
    req.params.id,
    { status, adminNote: adminNote.trim() },
    { new: true }
  );
  if (!request) return res.status(404).json({ message: "Return not found" });
  res.json({ request });
};