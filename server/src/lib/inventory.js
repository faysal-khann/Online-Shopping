import InventoryLog from "../models/InventoryLog.js";
import Product from "../models/Product.js";

export const logStock = (entry) =>
  InventoryLog.create(entry).catch((e) => console.error("Inventory log failed:", e.message));

// Returns an order's items to stock, with one log entry per item
export async function restoreStock(order, { type = "cancel", user, reason } = {}) {
  for (const i of order.items) {
    if (!i.product) continue;
    const p = await Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity } }, { new: true });
    if (!p) continue;
    await logStock({
      product: p._id,
      productName: p.name,
      type,
      delta: i.quantity,
      before: p.stock - i.quantity,
      after: p.stock,
      reason: reason || `Order #${String(order._id).slice(-8)} cancelled`,
      order: order._id,
      user: user?._id,
      userName: user?.name,
    });
  }
}