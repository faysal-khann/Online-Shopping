const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const money = (n) => `$${Number(n).toFixed(2)}`;
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:3000";

const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#f35c7a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${esc(label)}</a></p>`;

const layout = (body) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#111827;line-height:1.5">
  <h2 style="color:#f35c7a;margin:0 0 20px">Cartiva</h2>
  ${body}
  <p style="color:#9ca3af;font-size:12px;margin-top:32px">You received this email because of activity on your Cartiva account.</p>
</div>`;

const itemsTable = (order) => {
  const rows = order.items
    .map(
      (i) => `<tr>
    <td style="padding:6px 0">${esc(i.name)} × ${i.quantity}${
        [i.color, i.size].filter(Boolean).length ? ` (${esc([i.color, i.size].filter(Boolean).join(" / "))})` : ""
      }</td>
    <td style="padding:6px 0;text-align:right">${money(i.price * i.quantity)}</td></tr>`
    )
    .join("");

  const line = (label, value) =>
    `<tr><td style="padding:3px 0;color:#6b7280">${label}</td><td style="padding:3px 0;text-align:right;color:#6b7280">${value}</td></tr>`;
  const breakdown =
    order.subtotal != null
      ? `<tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding-top:6px"></td></tr>
         ${line("Subtotal", money(order.subtotal))}
         ${order.discount ? line("Discount", "-" + money(order.discount)) : ""}
         ${line("Shipping", order.shippingFee ? money(order.shippingFee) : "Free")}
         ${line("Tax", money(order.tax))}`
      : "";

  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
  ${rows}${breakdown}
  <tr><td style="padding-top:10px;border-top:1px solid #e5e7eb"><strong>Total</strong></td>
  <td style="padding-top:10px;border-top:1px solid #e5e7eb;text-align:right"><strong>${money(order.total)}</strong></td></tr>
</table>`;
};

export const verifyEmailMail = (name, link) => ({
  subject: "Verify your Cartiva email",
  text: `Hi ${name}, confirm your email: ${link} (valid for 24 hours)`,
  html: layout(`<p>Hi ${esc(name)},</p><p>Confirm your email address to start placing orders.</p>${button(link, "Verify email")}<p style="font-size:13px;color:#6b7280">This link expires in 24 hours.</p>`),
});

export const resetPasswordMail = (name, link) => ({
  subject: "Reset your Cartiva password",
  text: `Hi ${name}, reset your password: ${link} (valid for 1 hour). Ignore this email if it wasn't you.`,
  html: layout(`<p>Hi ${esc(name)},</p><p>We received a request to reset your password.</p>${button(link, "Reset password")}<p style="font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>`),
});

const payLabel = (p) =>
  !p ? ""
  : p.method === "cod" ? "Cash on delivery"
  : p.method === "card" ? `${p.brand || "Card"} ending ${p.last4}`
  : `${p.provider === "nagad" ? "Nagad" : "bKash"} ${p.last4 ? `(…${p.last4})` : ""}`;

export const orderPlacedMail = (order, name) => {
  const link = `${clientUrl()}/orders/${order._id}`;
  const a = order.shippingAddress;
  const ship = a?.line1
    ? `<p style="font-size:13px;color:#6b7280">Shipping to: ${esc(a.fullName)}, ${esc(a.line1)}, ${esc(a.city)}${
        order.shippingMethod?.label ? ` · ${esc(order.shippingMethod.label)}` : ""
      }<br>Payment: ${esc(payLabel(order.payment))}</p>`
    : `<p style="font-size:13px;color:#6b7280">Payment: ${esc(payLabel(order.payment))}</p>`;
  return {
    subject: `Order confirmed #${String(order._id).slice(-8)}`,
    text: `Hi ${name}, thanks for your order (total ${money(order.total)}). Track it: ${link}`,
    html: layout(`<p>Hi ${esc(name)},</p><p>Thanks for your order! Here's a summary:</p>${itemsTable(order)}${ship}${button(link, "View order")}`),
  };
};
const STATUS_COPY = {
  paid: ["We've received your payment", "Payment confirmed. We're getting your order ready."],
  shipped: ["Your order has shipped", "Good news, your order is on its way."],
  delivered: ["Your order was delivered", "Your order has been delivered. We hope you love it!"],
  cancelled: ["Your order was cancelled", "Your order has been cancelled and the items returned to stock."],
};

export const orderStatusMail = (order, name) => {
  const [subject, message] = STATUS_COPY[order.status] || ["Order update", `Your order is now ${order.status}.`];
  const link = `${clientUrl()}/orders/${order._id}`;
  return {
    subject: `${subject} #${String(order._id).slice(-8)}`,
    text: `Hi ${name}, ${message} Details: ${link}`,
    html: layout(`<p>Hi ${esc(name)},</p><p>${esc(message)}</p>${itemsTable(order)}${button(link, "View order")}`),
  };
};

export const verifyOtpMail = (name, code) => ({
  subject: `${code} is your Cartiva verification code`,
  text: `Hi ${name}, your Cartiva verification code is ${code}. It expires in 10 minutes.`,
  html: layout(`<p>Hi ${esc(name)},</p><p>Your verification code is:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${esc(code)}</p>
    <p style="font-size:13px;color:#6b7280">It expires in 10 minutes. If you didn't sign up, ignore this email.</p>`),
});

export const emailChangeOtpMail = (name, code) => ({
  subject: `${code} is your Cartiva email change code`,
  text: `Hi ${name}, use ${code} to confirm your new email address. It expires in 10 minutes.`,
  html: layout(`<p>Hi ${esc(name)},</p><p>Use this code to confirm your new email address:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0">${esc(code)}</p>
    <p style="font-size:13px;color:#6b7280">It expires in 10 minutes. If you didn't ask for this, ignore this email.</p>`),
});