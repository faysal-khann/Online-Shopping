import { Router } from "express";
import { createReview, myReviews, productReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.get("/product/:productId", productReviews);
r.get("/mine", protect, myReviews);
r.post("/", protect, createReview);
export default r;