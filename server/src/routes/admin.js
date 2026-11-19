import express, { Router } from "express";
import { protect, staffOnly, canWrite, adminOnly } from "../middleware/auth.js";
import { stats, listOrders, getOrder, exportOrders, updateOrderStatus } from "../controllers/adminController.js";
import {
  listCustomers, getCustomer, exportCustomers, setBlocked, setRole,
} from "../controllers/customerController.js";
import { listInventory, adjustStock } from "../controllers/inventoryController.js";
import { exportProducts, importProducts } from "../controllers/csvController.js";
import { upload, uploadImages } from "../controllers/uploadController.js";
import { adminReturns, updateReturn } from "../controllers/returnController.js";
import {
  listCoupons, createCoupon, updateCoupon, deleteCoupon,
} from "../controllers/couponController.js";
import {
  listBanners, createBanner, updateBanner, deleteBanner,
} from "../controllers/bannerController.js";
import { listAudit } from "../controllers/auditController.js";

const r = Router();
r.use(protect, staffOnly); // admin, staff and viewer can read

// ----- read -----
r.get("/stats", stats);
r.get("/orders", listOrders);
r.get("/orders/export", canWrite, exportOrders);
r.get("/orders/:id", getOrder);
r.get("/customers", listCustomers);
r.get("/customers/export", canWrite, exportCustomers);
r.get("/customers/:id", getCustomer);
r.get("/inventory", listInventory);
r.get("/returns", adminReturns);
r.get("/coupons", listCoupons);
r.get("/banners", listBanners);
r.get("/audit", adminOnly, listAudit);
r.get("/products/export", canWrite, exportProducts);

// ----- write (admin + staff) -----
r.patch("/orders/:id", canWrite, updateOrderStatus);
r.post("/products/:id/stock", canWrite, adjustStock);
r.post("/products/import", canWrite, express.text({ type: ["text/csv", "text/plain"], limit: "2mb" }), importProducts);
r.post("/upload", canWrite, upload.array("files", 8), uploadImages);
r.patch("/returns/:id", canWrite, updateReturn);
r.post("/coupons", canWrite, createCoupon);
r.put("/coupons/:id", canWrite, updateCoupon);
r.post("/banners", canWrite, createBanner);
r.put("/banners/:id", canWrite, updateBanner);

// ----- admin only -----
r.delete("/coupons/:id", adminOnly, deleteCoupon);
r.delete("/banners/:id", adminOnly, deleteBanner);
r.patch("/customers/:id/block", adminOnly, setBlocked);
r.patch("/customers/:id/role", adminOnly, setRole);

export default r;