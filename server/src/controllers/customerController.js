import User from "../models/User.js";
import Order from "../models/Order.js";
import Session from "../models/Session.js";
import { toCsv } from "../lib/csv.js";
import { audit } from "../lib/audit.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ROLES = ["user", "staff", "viewer", "admin"];

const customerFilter = (query) => {
  const filter = query.role === "team" ? { role: { $in: ["admin", "staff", "viewer"] } } : { role: "user" };
  if (query.blocked === "1") filter.blocked = true;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  return filter;
};

const orderStats = async (ids) => {
  const rows = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$total"] } },
        last: { $max: "$createdAt" },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
};

const shape = (u, s) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  avatarUrl: u.avatarUrl,
  role: u.role,
  blocked: !!u.blocked,
  emailVerified: u.emailVerified,
  createdAt: u.createdAt,
  orders: s?.orders ?? 0,
  spent: Math.round((s?.spent ?? 0) * 100) / 100,
  lastOrder: s?.last ?? null,
});

export const listCustomers = async (req, res) => {
  const { page = 1, limit = 15 } = req.query;
  const filter = customerFilter(req.query);
  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 15, 1), 50);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await orderStats(users.map((u) => u._id));
  res.json({
    customers: users.map((u) => shape(u, stats.get(String(u._id)))),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
};

export const getCustomer = async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ message: "Customer not found" });
  const [stats, orders] = await Promise.all([
    orderStats([user._id]),
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(25).lean(),
  ]);
  res.json({
    customer: {
      ...shape(user, stats.get(String(user._id))),
      googleLinked: !!user.googleId,
      addresses: user.addresses || [],
    },
    orders: orders.map((o) => ({
      _id: o._id, total: o.total, status: o.status, createdAt: o.createdAt,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      paymentStatus: o.payment?.status,
    })),
  });
};

export const exportCustomers = async (req, res) => {
  const users = await User.find(customerFilter(req.query)).sort({ createdAt: -1 }).limit(5000).lean();
  const stats = await orderStats(users.map((u) => u._id));
  const rows = users.map((u) => {
    const c = shape(u, stats.get(String(u._id)));
    return { ...c, joined: new Date(u.createdAt).toISOString() };
  });
  const csv = toCsv(rows, [
    { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
    { key: "role", label: "Role" }, { key: "emailVerified", label: "Verified" }, { key: "blocked", label: "Blocked" },
    { key: "orders", label: "Orders" }, { key: "spent", label: "Total spent" }, { key: "joined", label: "Joined" },
  ]);
  audit(req, "customer.export", { type: "customer" }, { rows: rows.length });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
  res.send(csv);
};

export const setBlocked = async (req, res) => {
  const { blocked } = req.body;
  if (typeof blocked !== "boolean") return res.status(400).json({ message: "Invalid request" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Customer not found" });
  if (String(user._id) === String(req.user._id))
    return res.status(400).json({ message: "You can't block yourself" });
  if (user.role !== "user")
    return res.status(400).json({ message: "Change this person's role to Customer before blocking" });

  user.blocked = blocked;
  await user.save();
  if (blocked) await Session.deleteMany({ user: user._id });
  audit(req, blocked ? "customer.block" : "customer.unblock", { type: "customer", id: user._id, label: user.email });
  res.json({ blocked });
};

export const setRole = async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (String(user._id) === String(req.user._id))
    return res.status(400).json({ message: "You can't change your own role" });

  const from = user.role;
  user.role = role;
  if (role !== "user") user.blocked = false;
  await user.save();
  audit(req, "user.role", { type: "customer", id: user._id, label: user.email }, { from, to: role });
  res.json({ role });
};