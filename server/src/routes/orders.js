import { Router } from "express";
import { myOrders, getOrder, cancelOrder, reorder } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.get("/", myOrders);
r.get("/:id", getOrder);
r.post("/:id/cancel", cancelOrder);
r.post("/:id/reorder", reorder);
export default r;