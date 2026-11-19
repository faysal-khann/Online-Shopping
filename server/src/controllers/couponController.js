import Coupon from "../models/Coupon.js";
import { couponStatus } from "../lib/coupons.js";
import { audit } from "../lib/audit.js";

const num = (v, fallback = null) => (v === "" || v == null ? fallback : Number(v));

const readCoupon = (b, creating) => {
  const code = String(b.code ?? "").trim().toUpperCase();
  if (creating && !/^[A-Z0-9_-]{3,24}$/.test(code))
    return { error: "Code must be 3 to 24 letters, numbers, - or _" };
  if (!["percent", "fixed"].includes(b.type)) return { error: "Choose percent or fixed" };

  const value = Number(b.value);
  if (!(value > 0)) return { error: "Value must be greater than 0" };
  if (b.type === "percent" && value > 100) return { error: "A percentage can't be over 100" };

  const minSubtotal = num(b.minSubtotal, 0);
  if (isNaN(minSubtotal) || minSubtotal < 0) return { error: "Minimum spend is invalid" };
  const maxDiscount = num(b.maxDiscount);
  if (maxDiscount !== null && (isNaN(maxDiscount) || maxDiscount <= 0)) return { error: "Max discount is invalid" };
  const maxUses = num(b.maxUses);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: "Total uses must be a whole number" };
  const perUserLimit = num(b.perUserLimit, 1);
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1) return { error: "Uses per customer must be at least 1" };

  const startsAt = b.startsAt ? new Date(b.startsAt) : null;
  const expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
  if ((startsAt && isNaN(startsAt)) || (expiresAt && isNaN(expiresAt))) return { error: "A date is invalid" };
  if (startsAt && expiresAt && expiresAt <= startsAt) return { error: "The end date must be after the start date" };

  const data = {
    type: b.type, value, minSubtotal, maxDiscount, maxUses, perUserLimit, startsAt, expiresAt,
    description: String(b.description ?? "").trim().slice(0, 200),
    active: b.active !== false,
  };
  if (creating) data.code = code;
  return { data };
};

export const listCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json({ coupons: coupons.map((c) => ({ ...c, status: couponStatus(c) })) });
};

export const createCoupon = async (req, res) => {
  const { error, data } = readCoupon(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const coupon = await Coupon.create(data);
  audit(req, "coupon.create", { type: "coupon", id: coupon._id, label: coupon.code });
  res.status(201).json({ coupon });
};

export const updateCoupon = async (req, res) => {
  const { error, data } = readCoupon(req.body, false);
  if (error) return res.status(400).json({ message: error });
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  audit(req, "coupon.update", { type: "coupon", id: coupon._id, label: coupon.code });
  res.json({ coupon });
};

export const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });
  audit(req, "coupon.delete", { type: "coupon", id: coupon._id, label: coupon.code });
  res.json({ message: "Coupon deleted" });
};