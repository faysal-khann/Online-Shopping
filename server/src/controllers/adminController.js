import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import { sendMailSafe } from "../lib/mailer.js";
import { orderStatusMail } from "../lib/emailTemplates.js";
import { refund } from "../lib/gateway.js";
import { restoreStock } from "../lib/inventory.js";
import { audit } from "../lib/audit.js";
import { toCsv } from "../lib/csv.js";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
const DAY = 86400000;
const round = (n) => Math.round(n * 100) / 100;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const shortId = (id) => String(id).slice(-8);

const validTz = (tz) => {
  if (typeof tz !== "string") return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
};

// ---------- Analytics ----------
export const stats = async (req, res) => {
  const days = [7, 30, 90].includes(+req.query.days) ? +req.query.days : 30;
  const tz = validTz(req.query.tz);
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  const live = { status: { $ne: "cancelled" } };

  const [periods, daily, byStatus, top, newCur, newPrev, products, customers, pending, openReturns, lowStock, recent] =
    await Promise.all([
      Order.aggregate([
        { $match: { ...live, createdAt: { $gte: prevStart } } },
        {
          $group: {
            _id: { $cond: [{ $gte: ["$createdAt", start] }, "cur", "prev"] },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...live, createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...live, createdAt: { $gte: start } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      User.countDocuments({ role: "user", createdAt: { $gte: start } }),
      User.countDocuments({ role: "user", createdAt: { $gte: prevStart, $lt: start } }),
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
      Order.countDocuments({ status: "pending" }),
      ReturnRequest.countDocuments({ status: "requested" }),
      Product.find({ stock: { $lte: 5 } }).select("name slug stock").sort({ stock: 1 }).limit(8).lean(),
      Order.find().sort({ createdAt: -1 }).limit(6).populate("user", "name email").lean(),
    ]);

  const pick = (k) => periods.find((p) => p._id === k) || { revenue: 0, orders: 0 };
  const cur = pick("cur");
  const prev = pick("prev");
  const aov = (p) => (p.orders ? p.revenue / p.orders : 0);

  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const series = [];
  const seen = new Set();
  for (let i = days; i >= 0; i--) {
    const key = fmt.format(new Date(now.getTime() - i * DAY));
    if (seen.has(key)) continue;
    seen.add(key);
    const d = byDay.get(key);
    series.push({ date: key, revenue: round(d?.revenue || 0), orders: d?.orders || 0 });
  }

  res.json({
    days,
    kpis: {
      revenue: { value: round(cur.revenue), prev: round(prev.revenue) },
      orders: { value: cur.orders, prev: prev.orders },
      aov: { value: round(aov(cur)), prev: round(aov(prev)) },
      customers: { value: newCur, prev: newPrev },
    },
    totals: { products, customers, pending, openReturns },
    daily: series,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    topProducts: top.map((t) => ({ name: t._id, quantity: t.quantity, revenue: round(t.revenue) })),
    lowStock,
    recent,
  });
};

// ---------- Orders ----------
const orderFilter = async (query) => {
  const filter = {};
  if (STATUSES.includes(query.status)) filter.status = query.status;
  if (["unpaid", "paid", "refunded", "failed"].includes(query.payment)) filter["payment.status"] = query.payment;

  const range = {};
  if (query.from && !isNaN(Date.parse(query.from))) range.$gte = new Date(query.from);
  if (query.to && !isNaN(Date.parse(query.to))) {
    const end = new Date(query.to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  if (Object.keys(range).length) filter.createdAt = range;

  const term = typeof query.q === "string" ? query.q.trim().replace(/^#/, "") : "";
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    const users = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select("_id")
      .limit(200)
      .lean();
    filter.$or = [
      { user: { $in: users.map((u) => u._id) } },
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${escapeRegex(term)}$`, options: "i" } } },
      { "items.name": rx },
    ];
  }
  return filter;
};

export const listOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const filter = await orderFilter(req.query);
  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 10, 1), 50);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};

export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone").lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};

export const exportOrders = async (req, res) => {
  const filter = await orderFilter(req.query);
  const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).limit(5000).lean();
  const rows = orders.map((o) => ({
    id: shortId(o._id),
    date: new Date(o.createdAt).toISOString(),
    customer: o.user?.name ?? "Deleted user",
    email: o.user?.email ?? "",
    status: o.status,
    paymentMethod: o.payment?.method ?? "",
    paymentStatus: o.payment?.status ?? "",
    items: o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
    subtotal: o.subtotal ?? o.total,
    discount: o.discount ?? 0,
    coupon: o.couponCode ?? "",
    shipping: o.shippingFee ?? 0,
    tax: o.tax ?? 0,
    total: o.total,
    city: o.shippingAddress?.city ?? "",
    phone: o.shippingAddress?.phone ?? "",
  }));
  const csv = toCsv(rows, [
    { key: "id", label: "Order" }, { key: "date", label: "Date" }, { key: "customer", label: "Customer" },
    { key: "email", label: "Email" }, { key: "status", label: "Status" },
    { key: "paymentMethod", label: "Payment method" }, { key: "paymentStatus", label: "Payment status" },
    { key: "items", label: "Items" }, { key: "subtotal", label: "Subtotal" }, { key: "discount", label: "Discount" },
    { key: "coupon", label: "Coupon" }, { key: "shipping", label: "Shipping" }, { key: "tax", label: "Tax" },
    { key: "total", label: "Total" }, { key: "city", label: "City" }, { key: "phone", label: "Phone" },
  ]);
  audit(req, "order.export", { type: "order" }, { rows: rows.length });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
  res.send(csv);
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const order = await Order.findById(req.params.id).populate("user", "name email prefs");
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === status) return res.json({ order });
  if (order.status === "cancelled")
    return res.status(400).json({ message: "Cancelled orders can't be reopened" });

  const from = order.status;

  if (status === "cancelled") {
    await restoreStock(order, { user: req.user, reason: `Order #${shortId(order._id)} cancelled by staff` });
    if (order.payment?.status === "paid") {
      const r = await refund({ amount: order.total });
      order.payment.status = "refunded";
      order.payment.refundedAt = new Date();
      order.payment.refundRef = r.ref;
    }
  }
  // Cash on delivery is collected when the order is delivered
  if (status === "delivered" && order.payment?.method === "cod" && order.payment.status === "unpaid") {
    order.payment.status = "paid";
    order.payment.paidAt = new Date();
  }

  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
  await order.save();

  audit(req, "order.status", { type: "order", id: order._id, label: `#${shortId(order._id)}` }, { from, to: status });

  if (order.user?.email && order.user.prefs?.orderEmails !== false && status !== "pending")
    sendMailSafe({ to: order.user.email, ...orderStatusMail(order, order.user.name) });

  res.json({ order });
};