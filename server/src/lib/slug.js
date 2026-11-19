import Product from "../models/Product.js";

export const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const uniqueProductSlug = async (name) => {
  const base = slugify(name) || "product";
  let slug = base;
  let n = 1;
  while (await Product.exists({ slug })) slug = `${base}-${++n}`;
  return slug;
};