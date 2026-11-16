import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

export const stats = async (req, res) => {
  const [users, products, orders, revenueAgg, lowStock, recent] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Product.find({ stock: { $lte: 5 } }).select("name slug stock").sort({ stock: 1 }).limit(8),
    Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
  ]);
  res.json({ users, products, orders, revenue: revenueAgg[0]?.total || 0, lowStock, recent });
};

export const listOrders = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const q = STATUSES.includes(status) ? { status } : {};
  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 10, 1), 50);

  const [orders, total] = await Promise.all([
    Order.find(q)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(q),
  ]);
  res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "cancelled" && status !== "cancelled")
    return res.status(400).json({ message: "Cancelled orders can't be reopened" });

  // Cancelling returns the items to stock
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const i of order.items) {
      if (i.product) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } });
    }
  }
  order.status = status;
  await order.save();
  res.json({ order });
};