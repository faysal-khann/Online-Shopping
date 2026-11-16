import { Router } from "express";
import { stats, listOrders, updateOrderStatus } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const r = Router();
r.use(protect, adminOnly);
r.get("/stats", stats);
r.get("/orders", listOrders);
r.patch("/orders/:id", updateOrderStatus);
export default r;