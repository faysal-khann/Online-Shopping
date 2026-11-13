import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const loadCart = async (userId) =>
  (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));

const populated = (cart) =>
  cart.populate("items.product", "name slug price discountPrice images stock");

export const getCart = async (req, res) => {
  const cart = await populated(await loadCart(req.user._id));
  res.json({ cart });
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1, color, size } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find(
    (i) => i.product.equals(productId) && i.color === color && i.size === size
  );
  const newQty = (existing?.quantity || 0) + Math.max(+quantity || 1, 1);
  if (newQty > product.stock)
    return res.status(400).json({ message: `Only ${product.stock} in stock` });

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity: newQty, color, size });

  await cart.save();
  res.json({ cart: await populated(cart) });
};

export const removeFromCart = async (req, res) => {
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  res.json({ cart: await populated(cart) });
};