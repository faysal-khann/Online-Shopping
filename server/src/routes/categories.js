import { Router } from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const r = Router();
r.get("/", getCategories);
r.post("/", protect, adminOnly, createCategory);
export default r;