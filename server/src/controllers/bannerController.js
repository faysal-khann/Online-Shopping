import Banner from "../models/Banner.js";
import { audit } from "../lib/audit.js";

const LINK_OK = /^(\/(?!\/)|https?:\/\/)/;
const IMG_OK = /^(\/(?!\/)|https?:\/\/)/;

const readBanner = (b) => {
  const title = String(b.title ?? "").trim();
  if (!title || title.length > 80) return { error: "Title is required (80 characters max)" };
  const image = String(b.image ?? "").trim();
  if (!IMG_OK.test(image)) return { error: "Add a banner image" };
  const link = String(b.link ?? "/list").trim() || "/list";
  if (!LINK_OK.test(link)) return { error: "Link must start with / or https://" };
  const position = Number(b.position ?? 0);
  if (!Number.isFinite(position)) return { error: "Position must be a number" };
  return {
    data: {
      title,
      subtitle: String(b.subtitle ?? "").trim().slice(0, 160),
      image,
      link,
      buttonText: String(b.buttonText ?? "Shop now").trim().slice(0, 24) || "Shop now",
      active: b.active !== false,
      position,
    },
  };
};

// Public: only active banners
export const publicBanners = async (req, res) => {
  const banners = await Banner.find({ active: true }).sort({ position: 1, createdAt: -1 }).limit(10).lean();
  res.json({ banners });
};

export const listBanners = async (req, res) => {
  const banners = await Banner.find().sort({ position: 1, createdAt: -1 }).lean();
  res.json({ banners });
};

export const createBanner = async (req, res) => {
  const { error, data } = readBanner(req.body);
  if (error) return res.status(400).json({ message: error });
  const banner = await Banner.create(data);
  audit(req, "banner.create", { type: "banner", id: banner._id, label: banner.title });
  res.status(201).json({ banner });
};

export const updateBanner = async (req, res) => {
  const { error, data } = readBanner(req.body);
  if (error) return res.status(400).json({ message: error });
  const banner = await Banner.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  audit(req, "banner.update", { type: "banner", id: banner._id, label: banner.title });
  res.json({ banner });
};

export const deleteBanner = async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  audit(req, "banner.delete", { type: "banner", id: banner._id, label: banner.title });
  res.json({ message: "Banner deleted" });
};