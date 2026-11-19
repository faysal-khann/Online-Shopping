import { Router } from "express";
import { quote, placeOrder } from "../controllers/checkoutController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/quote", quote);
r.post("/", placeOrder);
export default r;