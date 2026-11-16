import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

// POST /api/orders: turns the logged-in user's cart into an order
export const createOrder = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ message: "Cart is empty" });

  // Re-check stock; prices always come from the server, never the client
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

  const order = await Order.create({ user: req.user._id, items, total });

  for (const i of cart.items) {
    i.product.stock -= i.quantity;
    await i.product.save();
  }
  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
};

export const myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
};