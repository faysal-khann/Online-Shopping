import AuditLog from "../models/AuditLog.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listAudit = async (req, res) => {
  const { group, q, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (typeof group === "string" && /^[a-z]+$/.test(group)) filter.action = new RegExp(`^${group}\\.`);
  if (typeof q === "string" && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ userName: rx }, { "target.label": rx }, { action: rx }];
  }
  const pageNum = Math.max(+page || 1, 1);
  const limitNum = Math.min(Math.max(+limit || 25, 1), 100);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
};