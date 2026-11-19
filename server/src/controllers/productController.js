import Product from "../models/Product.js";
import Category from "../models/Category.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Only these fields can be written through the API (prevents mass assignment)
const FIELDS = [
  "name", "description", "price", "discountPrice", "images",
  "category", "type", "colors", "sizes", "stock", "additionalInfo",
];

const clean = (body) => {
  const set = {};
  const unset = {};
  for (const k of FIELDS) {
    if (!(k in body)) continue;
    if ((k === "discountPrice" || k === "category") && (body[k] === null || body[k] === ""))
      unset[k] = 1;
    else set[k] = body[k];
  }
  return { set, unset };
};

const uniqueSlug = async (name) => {
  const base = slugify(name) || "product";
  let slug = base;
  let n = 1;
  while (await Product.exists({ slug })) slug = `${base}-${++n}`;
  return slug;
};

// GET /api/products?name=&type=&min=&max=&cat=<category slug>&sort=&page=&limit=
export const getProducts = async (req, res) => {
  const { name, type, min, max, cat, sort, deals, page = 1, limit = 8 } = req.query;
  const q = {};

  if (name) q.name = new RegExp(escapeRegex(String(name)), "i");
  if (type === "physical" || type === "digital") q.type = type;
  if (deals === "1") {
  q.discountPrice = { $exists: true, $ne: null };
}
  if (min || max) {
    q.price = {};
    if (min && !isNaN(+min)) q.price.$gte = +min;
    if (max && !isNaN(+max)) q.price.$lte = +max;
    if (Object.keys(q.price).length === 0) delete q.price;
  }
  if (cat) {
    const category = await Category.findOne({ slug: String(cat) });
    q.category = category ? category._id : null; // unknown category -> no results
  }

  const sortMap = {
    "asc price": { price: 1 },
    "desc price": { price: -1 },
    "asc lastUpdated": { updatedAt: 1 },
    "desc lastUpdated": { updatedAt: -1 },
  };

  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 8, 1), 50);

  const [products, total] = await Promise.all([
    Product.find(q)
      .populate("category", "name slug")
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(q),
  ]);

  res.json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
};

// Admin only
export const createProduct = async (req, res) => {
  const { set } = clean(req.body);
  if (!set.name?.trim()) return res.status(400).json({ message: "Name is required" });
  if (set.discountPrice != null && +set.discountPrice >= +set.price)
    return res.status(400).json({ message: "Discount price must be lower than price" });
  const product = await Product.create({ ...set, slug: await uniqueSlug(set.name) });
  res.status(201).json({ product });
};

// The slug never changes on edit, so existing product links keep working
export const updateProduct = async (req, res) => {
  const { set, unset } = clean(req.body);
  if (set.discountPrice != null && set.price != null && +set.discountPrice >= +set.price)
    return res.status(400).json({ message: "Discount price must be lower than price" });
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  const product = await Product.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
};