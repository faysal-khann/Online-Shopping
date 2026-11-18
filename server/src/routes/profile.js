import { Router } from "express";
import {
  getProfile, updateProfile, changePassword, unlinkGoogle,
  requestEmailChange, confirmEmailChange,
  addAddress, updateAddress, setDefaultAddress, deleteAddress,
  exportData, deleteAccount
} from "../controllers/profileController.js";
import { protect } from "../middleware/auth.js";

import {
  overview, updatePreferences, listSessions, revokeSession, revokeOtherSessions,
} from "../controllers/dashboardController.js";

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




r.put("/preferences", updatePreferences);
r.get("/sessions", listSessions);
r.post("/sessions/revoke-others", revokeOtherSessions);
r.delete("/sessions/:id", revokeSession);
export default r;