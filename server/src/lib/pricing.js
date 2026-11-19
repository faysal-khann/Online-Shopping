export const SHIPPING_METHODS = {
  standard: { key: "standard", label: "Standard delivery", eta: "3-5 business days", fee: 5, freeOver: 100 },
  express: { key: "express", label: "Express delivery", eta: "1-2 business days", fee: 12, freeOver: null },
};

export const TAX_RATE = 0.05;

const round = (n) => Math.round(n * 100) / 100;
const hasMethod = (k) => typeof k === "string" && Object.hasOwn(SHIPPING_METHODS, k);
export const isShippingMethod = hasMethod;

const feeFor = (m, subtotal) => (m.freeOver != null && subtotal >= m.freeOver ? 0 : m.fee);

export const listMethods = (subtotal) =>
  Object.values(SHIPPING_METHODS).map((m) => {
    const fee = feeFor(m, subtotal);
    return { key: m.key, label: m.label, eta: m.eta, fee, free: fee === 0 };
  });

// items: [{ price, quantity }]
export function priceCart(items, methodKey, shippable = true) {
  const subtotal = round(items.reduce((s, i) => s + i.price * i.quantity, 0));
  let shippingFee = 0;
  let method = { key: "digital", label: "Digital delivery", eta: "Instant" };

  if (shippable) {
    if (!hasMethod(methodKey)) return null;
    const m = SHIPPING_METHODS[methodKey];
    method = { key: m.key, label: m.label, eta: m.eta };
    shippingFee = feeFor(m, subtotal);
  }
  const tax = round(subtotal * TAX_RATE);
  return {
    subtotal,
    shippingFee,
    tax,
    taxRate: TAX_RATE,
    total: round(subtotal + shippingFee + tax),
    method,
  };
}