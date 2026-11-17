import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { sendMailSafe } from "../lib/mailer.js";
import { orderPlacedMail } from "../lib/emailTemplates.js";

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

  sendMailSafe({ to: req.user.email, ...orderPlacedMail(order, req.user.name) });
  res.status(201).json({ order });
};

export const myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};

export const getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ order });
};