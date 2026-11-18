import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { priceCart, listMethods, isShippingMethod } from "../lib/pricing.js";
import { charge, refund } from "../lib/gateway.js";
import { sendMailSafe } from "../lib/mailer.js";
import { orderPlacedMail } from "../lib/emailTemplates.js";

const isStr = (v) => typeof v === "string" && v.length > 0;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;

const cartProblem = (cart) => {
  if (!cart || cart.items.length === 0) return "Your cart is empty";
  for (const i of cart.items) {
    if (!i.product) return "A product in your cart no longer exists";
    if (i.quantity > i.product.stock) return `Not enough stock for ${i.product.name}`;
  }
  return null;
};

const toOrderItems = (cart) =>
  cart.items.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    price: i.product.discountPrice ?? i.product.price,
    quantity: i.quantity,
    color: i.color,
    size: i.size,
  }));

const isShippable = (cart) => cart.items.some((i) => i.product.type !== "digital");

const readAddress = (b) => {
  const get = (k) => (isStr(b?.[k]) ? b[k].trim() : "");
  const a = {
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

// GET /api/checkout/quote?shipping=standard
export const quote = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  const problem = cartProblem(cart);
  if (problem) return res.status(400).json({ message: problem });

  const items = toOrderItems(cart);
  const shippable = isShippable(cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const key = shippable ? (isShippingMethod(req.query.shipping) ? req.query.shipping : "standard") : "digital";

  res.json({
    shippable,
    codAllowed: shippable,
    methods: shippable ? listMethods(subtotal) : [],
    pricing: priceCart(items, key, shippable),
    items: cart.items.map((i) => ({
      name: i.product.name,
      slug: i.product.slug,
      image: i.product.images?.[0],
      price: i.product.discountPrice ?? i.product.price,
      quantity: i.quantity,
      color: i.color,
      size: i.size,
    })),
  });
};

// POST /api/checkout
export const placeOrder = async (req, res) => {
  const { idempotencyKey, shippingMethod, addressId, address, saveAddress, payment } = req.body || {};
  const user = req.user;

  // The same key always returns the same order, so a double click can't order twice
  if (isStr(idempotencyKey)) {
    const existing = await Order.findOne({ user: user._id, idempotencyKey });
    if (existing) return res.json({ order: existing });
  }

  if (!user.emailVerified)
    return res.status(403).json({ message: "Please verify your email before checking out" });

  const cart = await Cart.findOne({ user: user._id }).populate("items.product");
  const problem = cartProblem(cart);
  if (problem) return res.status(400).json({ message: problem });

  const shippable = isShippable(cart);
  const items = toOrderItems(cart);

  let shippingAddress;
  if (shippable) {
    if (isStr(addressId)) {
      const a = user.addresses.id(addressId);
      if (!a) return res.status(400).json({ message: "Saved address not found" });
      shippingAddress = {
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        city: a.city,
        postalCode: a.postalCode,
      };
    } else {
      const r = readAddress(address);
      if (r.error) return res.status(400).json({ message: r.error });
      shippingAddress = r.data;
    }
  }

  const pricing = priceCart(items, shippingMethod, shippable);
  if (!pricing) return res.status(400).json({ message: "Choose a shipping method" });

  const method = payment?.method;
  if (!["card", "mobile", "cod"].includes(method))
    return res.status(400).json({ message: "Choose a payment method" });
  if (method === "cod" && !shippable)
    return res.status(400).json({ message: "Cash on delivery is only available for physical items" });

  // 1. Reserve stock atomically: it only succeeds while enough is left
  const reserved = [];
  const release = () =>
    Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));

  for (const i of items) {
    const r = await Product.updateOne(
      { _id: i.product, stock: { $gte: i.quantity } },
      { $inc: { stock: -i.quantity } }
    );
    if (r.modifiedCount !== 1) {
      await release();
      return res.status(409).json({ message: `Not enough stock for ${i.name}` });
    }
    reserved.push({ id: i.product, qty: i.quantity });
  }

  // 2. Charge
  let charged = null;
  try {
    if (method !== "cod") {
      charged = await charge({
        method,
        amount: pricing.total,
        card: payment.card,
        mobile: payment.mobile,
      });
      if (!charged.ok) {
        await release();
        return res.status(402).json({ message: charged.message, code: charged.code });
      }
    }

    // 3. Create the order
    const now = new Date();
    const paid = method !== "cod";
    const order = await Order.create({
      user: user._id,
      items,
      subtotal: pricing.subtotal,
      shippingFee: pricing.shippingFee,
      tax: pricing.tax,
      total: pricing.total,
      shippingMethod: pricing.method,
      shippingAddress,
      payment: {
        method,
        status: paid ? "paid" : "unpaid",
        brand: charged?.brand,
        last4: charged?.last4,
        provider: charged?.provider,
        ref: charged?.ref,
        paidAt: paid ? now : undefined,
      },
      idempotencyKey: isStr(idempotencyKey) ? idempotencyKey : undefined,
      status: paid ? "paid" : "pending",
      statusHistory: paid
        ? [{ status: "pending", at: now }, { status: "paid", at: now }]
        : [{ status: "pending", at: now }],
    });

    // 4. Optionally remember the address
    if (saveAddress === true && !isStr(addressId) && shippable && user.addresses.length < 5) {
      await User.updateOne(
        { _id: user._id },
        { $push: { addresses: { label: "home", ...shippingAddress, isDefault: user.addresses.length === 0 } } }
      );
    }

    cart.items = [];
    await cart.save();

    if (user.prefs?.orderEmails !== false)
      sendMailSafe({ to: user.email, ...orderPlacedMail(order, user.name) });

    return res.status(201).json({ order });
  } catch (err) {
    await release();
    if (charged?.ok) await refund({ amount: pricing.total }).catch(() => {});
    if (err.code === 11000 && isStr(idempotencyKey)) {
      const existing = await Order.findOne({ user: user._id, idempotencyKey });
      if (existing) return res.json({ order: existing });
    }
    throw err;
  }
};