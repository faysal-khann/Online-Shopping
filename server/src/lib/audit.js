import AuditLog from "../models/AuditLog.js";

// Fire and forget: a logging failure must never break the action itself
export const audit = (req, action, target = {}, meta = {}) =>
  AuditLog.create({
    user: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action,
    target: { type: target.type, id: target.id ? String(target.id) : undefined, label: target.label },
    meta,
    ip: req.ip,
  }).catch((e) => console.error("Audit failed:", e.message));