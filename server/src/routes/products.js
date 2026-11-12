import { Router } from "express";
import {
  getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const r = Router();
r.get("/", getProducts);
r.get("/:slug", getProductBySlug);
r.post("/", protect, adminOnly, createProduct);
r.put("/:id", protect, adminOnly, updateProduct);
r.delete("/:id", protect, adminOnly, deleteProduct);
export default r;