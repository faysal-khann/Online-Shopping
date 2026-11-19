export type Brand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function detectBrand(v: string): Brand {
  const n = digitsOnly(v);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "discover";
  return "unknown";
}

export function formatCardNumber(v: string) {
  const amex = detectBrand(v) === "amex";
  const n = digitsOnly(v).slice(0, amex ? 15 : 16);
  if (amex) return [n.slice(0, 4), n.slice(4, 10), n.slice(10)].filter(Boolean).join(" ");
  return n.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(v: string) {
  let d = digitsOnly(v).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = "0" + d;
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function parseExpiry(v: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  return m ? { month: Number(m[1]), year: 2000 + Number(m[2]) } : null;
}

export function luhn(num: string) {
  const n = digitsOnly(num);
  if (n.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export type CardErrors = Partial<Record<"name" | "number" | "expiry" | "cvc", string>>;

export function validateCard(v: { name: string; number: string; expiry: string; cvc: string }): CardErrors {
  const e: CardErrors = {};
  const brand = detectBrand(v.number);
  if (v.name.trim().length < 2) e.name = "Enter the name on the card";
  if (!luhn(v.number)) e.number = "Enter a valid card number";
  const exp = parseExpiry(v.expiry);
  if (!exp || exp.month < 1 || exp.month > 12) e.expiry = "Use MM/YY";
  else if (new Date(exp.year, exp.month, 1) <= new Date()) e.expiry = "This card has expired";
  const len = brand === "amex" ? 4 : 3;
  if (digitsOnly(v.cvc).length !== len) e.cvc = `${len} digits`;
  return e;
}