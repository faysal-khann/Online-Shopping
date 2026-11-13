import { Router } from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/", getCart);
r.post("/", addToCart);
r.delete("/:itemId", removeFromCart);
export default r;