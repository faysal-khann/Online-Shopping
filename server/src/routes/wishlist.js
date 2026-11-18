import { Router } from "express";
import { getWishlist, wishlistIds, addToWishlist, removeFromWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/", getWishlist);
r.get("/ids", wishlistIds);
r.post("/:productId", addToWishlist);
r.delete("/:productId", removeFromWishlist);
export default r;