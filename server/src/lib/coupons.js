import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";

const round = (n) => Math.round(n * 100) / 100;

export const couponStatus = (c, now = new Date()) => {
  if (!c.active) return "disabled";
  if (c.startsAt && c.startsAt > now) return "scheduled";
  if (c.expiresAt && c.expiresAt <= now) return "expired";
  if (c.maxUses != null && c.used >= c.maxUses) return "exhausted";
  return "active";
};

const MESSAGES = {
  disabled: "That coupon code isn't valid",
  scheduled: "This coupon isn't active yet",
  expired: "This coupon has expired",
  exhausted: "This coupon has been fully redeemed",
};

export async function evaluateCoupon(code, subtotal, userId) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) return { error: "That coupon code isn't valid" };

  const status = couponStatus(coupon);
  if (status !== "active") return { error: MESSAGES[status] };
  if (subtotal < coupon.minSubtotal)
    return { error: `Spend at least $${coupon.minSubtotal.toFixed(2)} to use this coupon` };

  const timesUsed = await Order.countDocuments({
    user: userId,
    couponCode: coupon.code,
    status: { $ne: "cancelled" },
  });
  if (timesUsed >= (coupon.perUserLimit || 1)) return { error: "You have already used this coupon" };

  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.type === "percent" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = round(Math.min(discount, subtotal));
  if (discount <= 0) return { error: "This coupon doesn't apply to your order" };

  return { coupon, discount };
}