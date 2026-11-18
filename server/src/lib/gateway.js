import crypto from "node:crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const makeRef = (prefix) => `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
const fail = (code, message) => ({ ok: false, code, message });

export const luhnValid = (digits) => {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const brandOf = (n) =>
  /^4/.test(n) ? "visa"
  : /^(5[1-5]|2[2-7])/.test(n) ? "mastercard"
  : /^3[47]/.test(n) ? "amex"
  : /^(6011|65|64[4-9])/.test(n) ? "discover"
  : "card";

const TEST_FAILURES = {
  "4000000000000002": ["card_declined", "Your card was declined."],
  "4000000000009995": ["insufficient_funds", "Your card has insufficient funds."],
  "4000000000000069": ["expired_card", "Your card has expired."],
};

export async function charge({ method, amount, card, mobile }) {
  await sleep(1200); // feels like a real network round trip
  if (!(amount > 0)) return fail("invalid_amount", "Invalid amount.");

  if (method === "card") {
    const number = String(card?.number ?? "").replace(/\D/g, "");
    const brand = brandOf(number);
    const month = Number(card?.expMonth);
    const year = Number(card?.expYear);
    const cvc = String(card?.cvc ?? "");

    if (String(card?.name ?? "").trim().length < 2) return fail("invalid_name", "Enter the name on the card.");
    if (!luhnValid(number)) return fail("invalid_number", "Your card number is invalid.");
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year))
      return fail("invalid_expiry", "Your card's expiry date is invalid.");
    if (new Date(year, month, 1) <= new Date()) return fail("expired_card", "Your card has expired.");
    if (!new RegExp(`^\\d{${brand === "amex" ? 4 : 3}}$`).test(cvc))
      return fail("invalid_cvc", "Your card's security code is invalid.");
    if (TEST_FAILURES[number]) return fail(...TEST_FAILURES[number]);

    return { ok: true, ref: makeRef("ch"), brand, last4: number.slice(-4) };
  }

  if (method === "mobile") {
    const provider = mobile?.provider;
    const number = String(mobile?.number ?? "").replace(/[\s-]/g, "");
    const code = String(mobile?.code ?? "");

    if (!["bkash", "nagad"].includes(provider)) return fail("invalid_provider", "Choose bKash or Nagad.");
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(number))
      return fail("invalid_number", "Enter a valid mobile number, like 01XXXXXXXXX.");
    if (!/^\d{6}$/.test(code)) return fail("invalid_code", "Enter the 6-digit verification code.");
    if (code === "000000") return fail("insufficient_funds", "Insufficient balance in your account.");
    if (code !== "123456") return fail("wrong_code", "The verification code is incorrect.");

    return { ok: true, ref: makeRef("mp"), provider, last4: number.slice(-4) };
  }

  return fail("invalid_method", "Unsupported payment method.");
}

export async function refund({ amount }) {
  await sleep(300);
  return { ok: true, ref: makeRef("re"), amount };
}