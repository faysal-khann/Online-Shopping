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

export const sendMail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[mail:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};

// Fire-and-forget: a mail failure must never break signup or checkout
export const sendMailSafe = (opts) =>
  sendMail(opts).catch((e) => console.error("Email failed:", e.message));