import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const img = (seed, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const categoriesData = [
  { name: "Men", slug: "men" },
  { name: "Women", slug: "women" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home & Living", slug: "home-living" },
  { name: "Accessories", slug: "accessories" },
].map((c) => ({ ...c, image: img(`cat-${c.slug}`, 600, 800) }));

const lorem =
  "A product description is marketing copy that explains what a product is, highlights its features and benefits, and helps shoppers make informed decisions.";

const productsData = [
  ["Classic Cotton T-Shirt", "men", 25, 20, ["S", "M", "L", "XL"], ["#f87171", "#1e3a8a", "#22c55e"]],
  ["Slim Fit Denim Jacket", "men", 85, 70, ["M", "L", "XL"], ["#1e3a8a"]],
  ["Casual Sneakers", "men", 60, null, ["40", "41", "42", "43"], ["#111827", "#ffffff"]],
  ["Floral Summer Dress", "women", 55, 45, ["S", "M", "L"], ["#f472b6", "#fde68a"]],
  ["Leather Handbag", "women", 120, 99, [], ["#78350f", "#111827"]],
  ["Wireless Earbuds", "electronics", 49, 39, [], ["#111827", "#ffffff"]],
  ["Smart Watch Series X", "electronics", 199, 169, [], ["#111827", "#9ca3af"]],
  ["Bluetooth Speaker", "electronics", 70, null, [], ["#2563eb", "#111827"]],
  ["Ceramic Coffee Mug Set", "home-living", 30, 24, [], ["#ffffff"]],
  ["Cozy Throw Blanket", "home-living", 40, null, [], ["#f87171", "#6b7280"]],
  ["Minimal Desk Lamp", "home-living", 35, 28, [], ["#ffffff", "#111827"]],
  ["Aviator Sunglasses", "accessories", 45, 35, [], ["#111827"]],
  ["Canvas Backpack", "accessories", 65, 55, [], ["#166534", "#111827"]],
  ["E-Book: Learn MERN Stack", "accessories", 15, 9, [], []],
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Category.deleteMany(), Product.deleteMany()]);

  const cats = await Category.insertMany(categoriesData);
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  await Product.insertMany(
    productsData.map(([name, cat, price, discountPrice, sizes, colors]) => {
      const slug = slugify(name);
      return {
        name,
        slug,
        description: lorem,
        price,
        discountPrice: discountPrice ?? undefined,
        images: [img(`${slug}-1`), img(`${slug}-2`)],
        category: bySlug[cat],
        type: name.startsWith("E-Book") ? "digital" : "physical",
        colors,
        sizes,
        stock: name.startsWith("E-Book") ? 999 : 10,
        additionalInfo: [
          { title: "Product Info", text: lorem },
          { title: "Return & Refund Policy", text: lorem },
          { title: "Shipping Info", text: lorem },
        ],
      };
    })
  );

  if (!(await User.findOne({ email: "admin@cartiva.com" }))) {
    await User.create({
      name: "Cartiva Admin",
      email: "admin@cartiva.com",
      password: "admin123",
      role: "admin",
    });
  }

  console.log(`Seeded ${cats.length} categories and ${productsData.length} products.`);
  console.log("Admin login: admin@cartiva.com / admin123  (change this before deploying!)");
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});