// lib/mailer.js
// A single choke point for every transactional email in the app.
//
// Supports two ways to actually send mail — configure whichever you
// have credentials for:
//
//   1) Resend (recommended): set RESEND_API_KEY (and optionally
//      RESEND_FROM). Resend sends over a plain HTTPS API call, so it
//      works everywhere — including serverless hosts like Vercel that
//      block outbound SMTP ports (25/465/587). This is the #1 reason
//      "the email never arrives" even though the code runs without
//      error: the SMTP connection times out or is silently dropped by
//      the platform's network layer, and with the old implementation
//      that failure was only visible in server logs.
//
//   2) SMTP via nodemailer: set SMTP_HOST, SMTP_PORT, SMTP_USER,
//      SMTP_PASSWORD, SMTP_FROM. Works with Gmail (App Password),
//      Outlook/Office365, SendGrid's SMTP relay, Mailgun's SMTP relay,
//      Amazon SES SMTP, etc. Best used when self-hosting somewhere that
//      doesn't block outbound SMTP (a VPS, Railway, Render, etc.).
//
// If neither is configured, sendEmail() logs the email to the console
// instead of throwing, so every other feature (signup, checkout, etc.)
// keeps working during local development without any setup.
import nodemailer from 'nodemailer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function getProvider() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  return 'console';
}

// Log which provider is active exactly once per server process — the
// single most useful line for diagnosing "I never got the email",
// since it tells you immediately whether the app even attempted to
// send anything.
let announced = false;
function announceProvider() {
  if (announced) return;
  announced = true;
  const provider = getProvider();
  if (provider === 'console') {
    console.warn('[email] No RESEND_API_KEY or SMTP_HOST configured — emails will be logged to the console instead of sent. See .env.example.');
  } else {
    console.log(`[email] Sending via ${provider === 'resend' ? 'Resend' : `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`}.`);
  }
}

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      // Port 465 is implicit TLS; everything else (587, 25) starts
      // plaintext and upgrades via STARTTLS, which nodemailer does
      // automatically when `secure` is false.
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

async function sendViaResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Field & Co <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API responded ${res.status}: ${body || res.statusText}`);
  }
}

async function sendViaSmtp({ to, subject, html }) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export async function sendEmail({ to, subject, html }) {
  announceProvider();
  const provider = getProvider();

  if (provider === 'console') {
    console.log(`\n[email] Not configured — logging instead of sending.\n[email] To: ${to}\n[email] Subject: ${subject}\n[email] Body:\n${html}\n`);
    return { ok: true, sent: false };
  }

  try {
    if (provider === 'resend') {
      await sendViaResend({ to, subject, html });
    } else {
      await sendViaSmtp({ to, subject, html });
    }
    return { ok: true, sent: true };
  } catch (err) {
    // A failed email should never crash the request that triggered it
    // (signup, checkout, password reset all still need to succeed) —
    // log it loudly so it's impossible to miss in server logs.
    console.error(`[email] FAILED to send via ${provider}`, { to, subject, error: err.message });
    return { ok: false, sent: false, error: err.message };
  }
}

export async function sendPasswordResetEmail(email, token) {
  const link = `${SITE_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Reset your Field & Co password',
    html: `<p>Someone requested a password reset for this account.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendEmailChangeVerification(newEmail, token) {
  const link = `${SITE_URL}/account/verify-email?token=${token}`;
  return sendEmail({
    to: newEmail,
    subject: 'Confirm your new email address',
    html: `<p>Confirm this is your new email address for your Field & Co account.</p><p><a href="${link}">Confirm email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendWelcomeEmail(email, firstName) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Field & Co',
    html: `<p>Hi ${firstName}, welcome to Field & Co — your account is ready.</p>`,
  });
}

export async function sendOrderConfirmationEmail(email, order) {
  return sendEmail({
    to: email,
    subject: `Order confirmed — #${order.id.slice(0, 8)}`,
    html: `<p>Thanks for your order! We're getting it ready.</p><p>Order total: $${Number(order.total).toFixed(2)}</p>`,
  });
}

export async function sendOrderStatusEmail(email, order, status) {
  return sendEmail({
    to: email,
    subject: `Order update — #${order.id?.slice(0, 8) || ''}`,
    html: `<p>Your order status changed to: <strong>${status}</strong>.</p>`,
  });
}

export async function sendContactMessageNotification(message) {
  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
  if (!notifyTo) return;
  return sendEmail({
    to: notifyTo,
    subject: `New contact message: ${message.subject || 'General inquiry'}`,
    html: `<p><strong>${message.name}</strong> (${message.email}) wrote:</p><p>${message.message}</p>`,
  });
}
