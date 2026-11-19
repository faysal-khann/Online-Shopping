import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { UPLOAD_DIR } from "../lib/paths.js";
import { audit } from "../lib/audit.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

// Decide the file type from its first bytes, never from the name the client sent
const sniff = (b) => {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString("ascii") === "GIF8") return "gif";
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
};

export const uploadImages = async (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ message: "Choose at least one image" });

  const typed = files.map((f) => ({ f, ext: sniff(f.buffer) }));
  const bad = typed.find((t) => !t.ext);
  if (bad) return res.status(400).json({ message: `${bad.f.originalname} isn't a JPG, PNG, GIF or WebP image` });

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const base = (process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  const urls = [];
  for (const { f, ext } of typed) {
    const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), f.buffer);
    urls.push(`${base}/uploads/${name}`);
  }
  audit(req, "upload.images", { type: "upload" }, { count: urls.length });
  res.status(201).json({ urls });
};