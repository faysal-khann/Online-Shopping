import { Router } from "express";
import {
  getProfile, updateProfile, changePassword, unlinkGoogle,
  requestEmailChange, confirmEmailChange,
  addAddress, updateAddress, setDefaultAddress, deleteAddress,
  exportData, deleteAccount,overview
} from "../controllers/profileController.js";
import { protect } from "../middleware/auth.js";

const r = Router();
r.use(protect);

r.get("/", getProfile);
r.put("/", updateProfile);
r.put("/password", changePassword);
r.post("/unlink-google", unlinkGoogle);

r.post("/email/request", requestEmailChange);
r.post("/email/confirm", confirmEmailChange);
r.get("/overview", overview);
r.post("/addresses", addAddress);
r.put("/addresses/:id", updateAddress);
r.patch("/addresses/:id/default", setDefaultAddress);
r.delete("/addresses/:id", deleteAddress);

r.get("/export", exportData);
r.delete("/", deleteAccount);
export default r;