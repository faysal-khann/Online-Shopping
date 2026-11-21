export const CURRENCY = "৳";

export const money = (n) => {
  const v = Number(n) || 0;
  return `${CURRENCY}${v.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};