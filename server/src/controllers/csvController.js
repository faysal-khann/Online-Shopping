import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { toCsv, parseCsv } from "../lib/csv.js";
import { slugify, uniqueProductSlug } from "../lib/slug.js";
import { logStock } from "../lib/inventory.js";
import { audit } from "../lib/audit.js";

const COLUMNS = [
  { key: "slug", label: "slug" }, { key: "name", label: "name" }, { key: "description", label: "description" },
  { key: "price", label: "price" }, { key: "discountPrice", label: "discountPrice" }, { key: "stock", label: "stock" },
  { key: "category", label: "category" }, { key: "type", label: "type" }, { key: "colors", label: "colors" },
  { key: "sizes", label: "sizes" }, { key: "images", label: "images" },
];

export const exportProducts = async (req, res) => {
  const products = await Product.find().populate("category", "slug").sort({ name: 1 }).lean();
  const rows = products.map((p) => ({
    slug: p.slug, name: p.name, description: p.description, price: p.price,
    discountPrice: p.discountPrice ?? "", stock: p.stock, category: p.category?.slug ?? "", type: p.type,
    colors: (p.colors || []).join("|"), sizes: (p.sizes || []).join("|"), images: (p.images || []).join("|"),
  }));
  audit(req, "product.export", { type: "product" }, { rows: rows.length });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="products.csv"');
  res.send(toCsv(rows, COLUMNS));
};

// POST /api/admin/products/import  (raw CSV text)
// A row whose slug already exists updates that product; otherwise a new one is created.
export const importProducts = async (req, res) => {
  const text = typeof req.body === "string" ? req.body : "";
  if (!text.trim()) return res.status(400).json({ message: "Upload a CSV file" });
  const rows = parseCsv(text);
  if (!rows.length) return res.status(400).json({ message: "The file has no data rows" });
  if (rows.length > 500) return res.status(400).json({ message: "Import up to 500 rows at a time" });

  const cats = await Category.find().lean();
  const bySlug = new Map(cats.map((c) => [c.slug, c._id]));
  const split = (s) => (s ? s.split("|").map((x) => x.trim()).filter(Boolean) : []);
  const result = { created: 0, updated: 0, errors: [] };

  for (const [idx, row] of rows.entries()) {
    const fail = (message) => result.errors.push({ row: idx + 2, message });

    if (!row.name) { fail("Name is required"); continue; }
    const price = Number(row.price);
    if (row.price === "" || row.price == null || isNaN(price) || price < 0) { fail("Invalid price"); continue; }
    const discount = row.discountprice === "" || row.discountprice == null ? null : Number(row.discountprice);
    if (discount !== null && (isNaN(discount) || discount < 0 || discount >= price)) {
      fail("Discount price must be lower than the price"); continue;
    }
    const stock = row.stock === "" || row.stock == null ? 0 : Number(row.stock);
    if (!Number.isInteger(stock) || stock < 0) { fail("Stock must be a whole number"); continue; }
    const type = row.type || "physical";
    if (!["physical", "digital"].includes(type)) { fail('Type must be "physical" or "digital"'); continue; }

    let category;
    if (row.category) {
      category = bySlug.get(row.category.toLowerCase());
      if (!category) { fail(`Unknown category "${row.category}"`); continue; }
    }
    const images = split(row.images);
    if (images.some((u) => !/^(https?:\/\/|\/)/.test(u))) { fail("Images must be URLs, separated by |"); continue; }

    const data = {
      name: row.name, description: row.description || "", price, type, stock,
      colors: split(row.colors), sizes: split(row.sizes), images,
    };

    try {
      const slug = row.slug ? slugify(row.slug) : "";
      const existing = slug ? await Product.findOne({ slug }) : null;

      if (existing) {
        const update = { $set: { ...data, ...(category ? { category } : {}) } };
        if (discount === null) update.$unset = { discountPrice: 1 };
        else update.$set.discountPrice = discount;
        await Product.updateOne({ _id: existing._id }, update);
        if (existing.stock !== stock)
          await logStock({
            product: existing._id, productName: data.name, type: "import", delta: stock - existing.stock,
            before: existing.stock, after: stock, reason: "CSV import", user: req.user._id, userName: req.user.name,
          });
        result.updated++;
      } else {
        const created = await Product.create({
          ...data,
          slug: slug || (await uniqueProductSlug(data.name)),
          ...(discount !== null ? { discountPrice: discount } : {}),
          ...(category ? { category } : {}),
        });
        if (stock > 0)
          await logStock({
            product: created._id, productName: created.name, type: "import", delta: stock,
            before: 0, after: stock, reason: "CSV import", user: req.user._id, userName: req.user.name,
          });
        result.created++;
      }
    } catch (e) {
      fail(e.message);
    }
  }

  audit(req, "product.import", { type: "product" }, { created: result.created, updated: result.updated, errors: result.errors.length });
  res.json(result);
};