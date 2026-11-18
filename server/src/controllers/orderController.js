import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendMailSafe } from "../lib/mailer.js";
import { orderPlacedMail, orderStatusMail } from "../lib/emailTemplates.js";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wantsOrderEmails = (u) => u?.prefs?.orderEmails !== false;

export const createOrder = async (req, res) => {
  if (!req.user.emailVerified)
    return res.status(403).json({ message: "Please verify your email before checking out" });

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ message: "Cart is empty" });

  for (const i of cart.items) {
    if (!i.product)
      return res.status(400).json({ message: "A product in your cart no longer exists" });
    if (i.quantity > i.product.stock)
      return res.status(400).json({ message: `Not enough stock for ${i.product.name}` });
  }

  const items = cart.items.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    price: i.product.discountPrice ?? i.product.price,
    quantity: i.quantity,
    color: i.color,
    size: i.size,
  }));
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    user: req.user._id,
    items,
    total,
    statusHistory: [{ status: "pending", at: new Date() }],
  });

  for (const i of cart.items) {
    i.product.stock -= i.quantity;
    await i.product.save();
  }
  cart.items = [];
  await cart.save();

  if (wantsOrderEmails(req.user))
    sendMailSafe({ to: req.user.email, ...orderPlacedMail(order, req.user.name) });
  res.status(201).json({ order });
};

// GET /api/orders?status=&q=&from=&to=&page=&limit=
export const myOrders = async (req, res) => {
  const { status, q, from, to, page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id };

  if (STATUSES.includes(status)) filter.status = status;

  const range = {};
  if (from && !isNaN(Date.parse(from))) range.$gte = new Date(from);
  if (to && !isNaN(Date.parse(to))) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  if (Object.keys(range).length) filter.createdAt = range;

  if (typeof q === "string" && q.trim()) {
    const term = escapeRegex(q.trim().replace(/^#/, ""));
    filter.$or = [
      { "items.name": new RegExp(term, "i") },
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${term}$`, options: "i" } } },
    ];
  }

  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 10, 1), 50);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};

export const getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};

// Customers can cancel only while the order is still pending
export const cancelOrder = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: "pending" },
    { $set: { status: "cancelled" }, $push: { statusHistory: { status: "cancelled", at: new Date() } } },
    { new: true }
  );
  if (!order) return res.status(400).json({ message: "Only pending orders can be cancelled" });

  for (const i of order.items) {
    if (i.product) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } });
  }
  if (wantsOrderEmails(req.user))
    sendMailSafe({ to: req.user.email, ...orderStatusMail(order, req.user.name) });
  res.json({ order });
};

// "Buy again": puts the old items back in the cart, limited by current stock
export const reorder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const cart =
    (await Cart.findOne({ user: req.user._id })) ||
    (await Cart.create({ user: req.user._id, items: [] }));

  let added = 0;
  let skipped = 0;
  for (const i of order.items) {
    const product = i.product ? await Product.findById(i.product) : null;
    if (!product) { skipped++; continue; }
    const existing = cart.items.find(
      (c) => c.product.equals(product._id) && c.color === i.color && c.size === i.size
    );
    const qty = Math.min(i.quantity, product.stock - (existing?.quantity || 0));
    if (qty < 1) { skipped++; continue; }
    if (existing) existing.quantity += qty;
    else cart.items.push({ product: product._id, quantity: qty, color: i.color, size: i.size });
    added++;
  }
  await cart.save();
  res.json({ added, skipped });
};