import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const { id, iat, sid } = jwt.verify(token, process.env.JWT_SECRET);

    if (!sid) return res.status(401).json({ message: "Please log in again" });
    const session = await Session.findById(sid);
    if (!session || String(session.user) !== String(id))
      return res.status(401).json({ message: "This session has ended. Please log in again." });

    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    if (user.blocked) return res.status(403).json({ message: "This account has been suspended" });
    if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > iat)
      return res.status(401).json({ message: "Password changed. Please log in again." });

    if (Date.now() - session.lastSeenAt.getTime() > 60 * 1000)
      await Session.updateOne({ _id: sid }, { lastSeenAt: new Date() });

    req.user = user;
    req.sessionId = String(session._id);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// admin, staff and viewer can read the admin area
export const staffOnly = (req, res, next) =>
  ["admin", "staff", "viewer"].includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "Staff only" });

// admin and staff can change things; viewers are read-only
export const canWrite = (req, res, next) =>
  ["admin", "staff"].includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: "Your role is read-only" });

export const adminOnly = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ message: "Admins only" });