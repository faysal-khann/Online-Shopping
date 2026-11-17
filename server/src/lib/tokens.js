import crypto from "node:crypto";

export const hashToken = (raw) =>
  crypto.createHash("sha256").update(String(raw)).digest("hex");

export const createToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
};

export const hashOtp = (code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(code)).digest("hex");

export const createOtp = () => {
  const code = String(crypto.randomInt(100000, 1000000));
  return { code, hash: hashOtp(code) };
};