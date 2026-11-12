import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Fallback placeholder (text image) used only if a DummyJSON fetch fails
const placeholder = (text, w = 600, h = 800) =>
  `https://placehold.co/${w}x${h}/e5e7eb/374151/png?text=${encodeURIComponent(text)}`;

const categoriesData = [
  { name: "Men", slug: "men" },
  { name: "Women", slug: "women" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home & Living", slug: "home-living" },
  { name: "Accessories", slug: "accessories" },
];

const lorem =
  "A product description is marketing copy that explains what a product is, highlights its features and benefits, and helps shoppers make informed decisions.";

// [name, category slug, price, discountPrice, sizes, colors]
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

// product name -> [DummyJSON category, item index]
const photoMap = {
  "Classic Cotton T-Shirt": ["mens-shirts", 0],
  "Slim Fit Denim Jacket": ["mens-shirts", 1],
  "Casual Sneakers": ["mens-shoes", 0],
  "Floral Summer Dress": ["womens-dresses", 0],
  "Leather Handbag": ["womens-bags", 0],
  "Wireless Earbuds": ["mobile-accessories", 0],
  "Smart Watch Series X": ["mens-watches", 0],
  "Bluetooth Speaker": ["mobile-accessories", 1],
  "Ceramic Coffee Mug Set": ["kitchen-accessories", 0],
  "Cozy Throw Blanket": ["home-decoration", 0],
  "Minimal Desk Lamp": ["home-decoration", 1],
  "Aviator Sunglasses": ["sunglasses", 0],
  "Canvas Backpack": ["womens-bags", 1],
  "E-Book: Learn MERN Stack": ["laptops", 0],
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Fetch each DummyJSON category once
const loadPhotoCache = async () => {
  const cats = [...new Set(Object.values(photoMap).map(([cat]) => cat))];
  const cache = {};
  await Promise.all(
    cats.map(async (cat) => {
      try {
        const res = await fetch(
          `https://dummyjson.com/products/category/${cat}?select=title,images`
        );
        const data = await res.json();
        cache[cat] = data.products || [];
      } catch (e) {
        console.warn(`Could not load DummyJSON category "${cat}", using placeholder.`);
        cache[cat] = [];
      }
    })
  );
  return cache;
};

const getPhotos = (cache, name) => {
  const [cat, idx] = photoMap[name];
  const list = cache[cat] || [];
  if (!list.length) return [placeholder(name), placeholder(`${name} 2`)];
  return list[idx % list.length].images.slice(0, 2);
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // 1) Get real photos first
  const cache = await loadPhotoCache();
  const photos = productsData.map(([name]) => getPhotos(cache, name));

  // 2) Category image = first product photo in that category
  const catImage = {};
  productsData.forEach(([, catSlug], i) => {
    if (!catImage[catSlug]) catImage[catSlug] = photos[i][0];
  });

  // 3) Reset and insert
  await Promise.all([Category.deleteMany(), Product.deleteMany()]);

  const cats = await Category.insertMany(
    categoriesData.map((c) => ({
      ...c,
      image: catImage[c.slug] || placeholder(c.name),
    }))
  );
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c._id]));

  await Product.insertMany(
    productsData.map(([name, cat, price, discountPrice, sizes, colors], i) => {
      const digital = name.startsWith("E-Book");
      return {
        name,
        slug: slugify(name),
        description: lorem,
        price,
        discountPrice: discountPrice ?? undefined,
        images: photos[i],
        category: bySlug[cat],
        type: digital ? "digital" : "physical",
        colors,
        sizes,
        stock: digital ? 999 : 10,
        additionalInfo: [
          { title: "Product Info", text: lorem },
          { title: "Return & Refund Policy", text: lorem },
          { title: "Shipping Info", text: lorem },
        ],
      };
    })
  );

  // Admin account (needed later to create products through the API)
  if (!(await User.findOne({ email: "admin@cartiva.com" }))) {
    await User.create({
      name: "Cartiva Admin",
      email: "admin@cartiva.com",
      password: "admin123",
      role: "admin",
    });
  }

  console.log(`Seeded ${cats.length} categories and ${productsData.length} products.`);
  console.log("Admin login: admin@cartiva.com / admin123 (change before deploying!)");
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});