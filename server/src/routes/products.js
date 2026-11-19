import { Router } from "express";
import {
  getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct,
} from "../controllers/productController.js";
import { protect, canWrite, adminOnly } from "../middleware/auth.js";

const r = Router();
r.get("/", getProducts);
r.get("/:slug", getProductBySlug);
r.post("/", protect, canWrite, createProduct);
r.put("/:id", protect, canWrite, updateProduct);
r.delete("/:id", protect, adminOnly, deleteProduct);
export default r;