import { Router } from "express";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from "../controllers/categoryController.js";
import { protect, canWrite, adminOnly } from "../middleware/auth.js";

const r = Router();
r.get("/", getCategories);
r.post("/", protect, canWrite, createCategory);
r.put("/:id", protect, canWrite, updateCategory);
r.delete("/:id", protect, adminOnly, deleteCategory);
export default r;