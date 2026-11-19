import InventoryLog from "../models/InventoryLog.js";
import Product from "../models/Product.js";
import { logStock } from "../lib/inventory.js";
import { audit } from "../lib/audit.js";

const TYPES = ["sale", "cancel", "manual", "edit", "import", "return"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listInventory = async (req, res) => {
  const { type, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (TYPES.includes(type)) filter.type = type;
  if (typeof q === "string" && q.trim()) filter.productName = new RegExp(escapeRegex(q.trim()), "i");

  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 20, 1), 100);
  const [logs, total] = await Promise.all([
    InventoryLog.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    InventoryLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};

// POST /api/admin/products/:id/stock  { mode: "add" | "set", quantity, reason }
export const adjustStock = async (req, res) => {
  const { mode, quantity, reason } = req.body;
  const qty = Number(quantity);
  if (!["add", "set"].includes(mode)) return res.status(400).json({ message: "Invalid mode" });
  if (!Number.isInteger(qty)) return res.status(400).json({ message: "Quantity must be a whole number" });
  if (mode === "set" && qty < 0) return res.status(400).json({ message: "Stock can't be negative" });
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.length > 200)
    return res.status(400).json({ message: "Add a short reason (3 to 200 characters)" });

  let product;
  let before;
  let after;
  if (mode === "set") {
    const old = await Product.findOneAndUpdate({ _id: req.params.id }, { $set: { stock: qty } }, { new: false });
    if (!old) return res.status(404).json({ message: "Product not found" });
    product = old;
    before = old.stock;
    after = qty;
  } else {
    const p = await Product.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: -qty } },
      { $inc: { stock: qty } },
      { new: true }
    );
    if (!p) return res.status(400).json({ message: "Stock can't go below zero" });
    product = p;
    after = p.stock;
    before = after - qty;
  }

  if (after !== before) {
    await logStock({
      product: product._id, productName: product.name, type: "manual", delta: after - before,
      before, after, reason: reason.trim(), user: req.user._id, userName: req.user.name,
    });
    audit(req, "inventory.adjust", { type: "product", id: product._id, label: product.name }, { before, after, reason: reason.trim() });
  }
  res.json({ stock: after });
};