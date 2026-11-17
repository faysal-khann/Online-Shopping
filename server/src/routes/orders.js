import { Router } from "express";
import { createOrder, myOrders, getOrder } from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.post("/", createOrder);
r.get("/", myOrders);
r.get("/:id", getOrder);
export default r;