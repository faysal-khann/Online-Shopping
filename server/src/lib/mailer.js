import nodemailer from "nodemailer";

let transporter;
const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

// "Cartiva <me@gmail.com>" -> { name, email }
const parseFrom = (s = "") => {
  const v = s.trim().replace(/^"(.*)"$/, "$1");
  const m = /^(.*?)\s*<([^>]+)>$/.exec(v);
  if (m) return { name: m[1].replace(/"/g, "").trim() || "Cartiva", email: m[2].trim() };
  return { name: "Cartiva", email: v };
};

export const sendMail = async ({ to, subject, html, text }) => {
  // 1. HTTPS API (works on hosts that block SMTP)
  if (process.env.BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: parseFrom(process.env.MAIL_FROM || process.env.SMTP_USER),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    return;
  }

  // 2. SMTP
  const t = getTransporter();
  if (t) {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, text });
    return;
  }

  // 3. Dev: print to the terminal
  console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
};

export const sendMailSafe = (opts) =>
  sendMail(opts).catch((e) => console.error("Email failed:", e.message));