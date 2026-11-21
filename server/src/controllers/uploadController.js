import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { audit } from "../lib/audit.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const toCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "cartiva", resource_type: "image" }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(buffer);
  });

export const uploadImages = async (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET)
    return res.status(501).json({ message: "Image uploads are not configured" });

  const files = req.files || [];
  if (!files.length) return res.status(400).json({ message: "Choose at least one image" });

  const bad = files.find((f) => !sniff(f.buffer));
  if (bad) return res.status(400).json({ message: `${bad.originalname} isn't a JPG, PNG, GIF or WebP image` });

    const urls = [];
  try {
    for (const f of files) {
      const result = await toCloudinary(f.buffer);
      urls.push(result.secure_url);
    }
  } catch (e) {
    console.error("Cloudinary upload failed:", e?.message, e?.http_code, e?.error?.message);
    return res.status(502).json({ message: e?.message || "Image upload failed" });
  }
  audit(req, "upload.images", { type: "upload" }, { count: urls.length });
  res.status(201).json({ urls });
};