import { Router } from "express";
import { publicBanners } from "../controllers/bannerController.js";

const r = Router();
r.get("/", publicBanners);
export default r;