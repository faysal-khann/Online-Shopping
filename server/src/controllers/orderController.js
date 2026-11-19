import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { sendMailSafe } from "../lib/mailer.js";
import { orderStatusMail } from "../lib/emailTemplates.js";
import { restoreStock } from "../lib/inventory.js";
import { refund } from "../lib/gateway.js";
const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wantsOrderEmails = (u) => u?.prefs?.orderEmails !== false;

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
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: `${term}$`,
            options: "i",
          },
        },
      },
    ];
  }

  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 10, 1), 50);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({
    orders,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
};

export const getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};

export const cancelOrder = async (req, res) => {
  // The status filter makes this atomic, so stock can't be restored twice
  let order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ["pending", "paid"] },
    },
    {
      $set: { status: "cancelled" },
      $push: { statusHistory: { status: "cancelled", at: new Date() } },
    },
    { new: true },
  );
  if (!order)
    return res
      .status(400)
      .json({ message: "This order can no longer be cancelled" });

  await restoreStock(order, {
    user: req.user,
    reason: `Order #${String(order._id).slice(-8)} cancelled by customer`,
  });

  if (order.payment?.status === "paid") {
    const r = await refund({ amount: order.total });
    order = await Order.findByIdAndUpdate(
      order._id,
      {
        $set: {
          "payment.status": "refunded",
          "payment.refundedAt": new Date(),
          "payment.refundRef": r.ref,
        },
      },
      { new: true },
    );
  }

  if (wantsOrderEmails(req.user))
    sendMailSafe({
      to: req.user.email,
      ...orderStatusMail(order, req.user.name),
    });
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
    if (!product) {
      skipped++;
      continue;
    }
    const existing = cart.items.find(
      (c) =>
        c.product.equals(product._id) &&
        c.color === i.color &&
        c.size === i.size,
    );
    const qty = Math.min(i.quantity, product.stock - (existing?.quantity || 0));
    if (qty < 1) {
      skipped++;
      continue;
    }
    if (existing) existing.quantity += qty;
    else
      cart.items.push({
        product: product._id,
        quantity: qty,
        color: i.color,
        size: i.size,
      });
    added++;
  }
  await cart.save();
  res.json({ added, skipped });
};
