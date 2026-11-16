import Category from "../models/Category.js";
import Product from "../models/Product.js";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
};

export const createCategory = async (req, res) => {
  const { name, image } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
  const category = await Category.create({ name, image, slug: slugify(name) });
  res.status(201).json({ category });
};

// The slug stays the same so /list?cat=... links keep working
export const updateCategory = async (req, res) => {
  const { name, image } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, image },
    { new: true, runValidators: true }
  );
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json({ category });
};

export const deleteCategory = async (req, res) => {
  if (await Product.exists({ category: req.params.id }))
    return res
      .status(409)
      .json({ message: "This category has products. Move or delete them first." });
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.json({ message: "Category deleted" });
};