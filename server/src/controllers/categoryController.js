import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
};

export const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ category });
};