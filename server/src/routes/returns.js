import { Router } from "express";
import { createReturn, myReturns } from "../controllers/returnController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);
r.post("/", createReturn);
r.get("/", myReturns);
export default r;