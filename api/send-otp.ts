import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

const APPROVED_EMAILS = new Set([
  'abdurrehman200khan@gmail.com',
  'arkmfk27@gmail.com',
  'bf25pwcs1458@uetpeshawar.edu.pk',
  'its.misbah.kx@gmail.com',
  'csworking1122@gmail.com',
  'kgraana@gmail.com',
  'maryampervaiz559@gmail.com',
  'uroojkhanum.safi@gmail.com',
  'elena.vance@university.edu',
  'marcus.thorne@university.edu',
  'sarah.jenkins@university.edu',
]);

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  const staffName = String(body.staffName || 'Staff Member').trim().slice(0, 120);

  if (!APPROVED_EMAILS.has(email)) {
    return res.status(403).json({ success: false, error: 'Access restricted to approved staff accounts only.' });
  }
  if (!/^\d{5}$/.test(code)) {
    return res.status(400).json({ success: false, error: 'Invalid 5-digit verification code payload.' });
  }

  const normalizeValue = (value: string | undefined) =>
    value?.trim().replace(/^(["']).*\1$/, (quoted) => quoted.slice(1, -1).trim());
  const host = normalizeValue(process.env.SMTP_HOST);
  const user = normalizeValue(process.env.SMTP_USER)?.toLowerCase();
  const passwordValue = normalizeValue(process.env.SMTP_PASSWORD);
  const password = host?.toLowerCase() === 'smtp.gmail.com'
    ? passwordValue?.replace(/\s+/g, '')
    : passwordValue;
  const port = Number.parseInt(normalizeValue(process.env.SMTP_PORT) || '587', 10);

  if (!host || !user || !password) {
    return res.status(503).json({
      success: false,
      error: 'Email delivery is not configured on the server. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in Vercel environment variables.',
    });
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return res.status(503).json({ success: false, error: 'SMTP_PORT is invalid on the server.' });
  }

  const safeName = escapeHtml(staffName);
  const fromName = normalizeValue(process.env.SMTP_FROM_NAME) || 'ARK Ecosystem — CaseBridge';
  // Gmail and most SMTP providers require the sender to match the authenticated account.
  const fromEmail = normalizeValue(process.env.SMTP_FROM_EMAIL)?.toLowerCase() || user;
  if (fromEmail !== user) {
    return res.status(503).json({
      success: false,
      error: 'SMTP_FROM_EMAIL must match SMTP_USER for this mail provider.',
    });
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'CaseBridge Staff Portal Verification Code',
      text: `Hello ${staffName},\n\nYour CaseBridge verification code is ${code}. It expires in 5 minutes.`,
      html: `<p>Hello <strong>${safeName}</strong>,</p><p>Your CaseBridge verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:.2em">${code}</p><p>This code expires in 5 minutes.</p>`,
    });
    return res.status(200).json({ success: true, message: 'Verification code successfully dispatched to your email.' });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    console.error('[Email Dispatch Error]', error instanceof Error ? error.name : 'UnknownError');

    if (message.includes('authentication') || message.includes('invalid login') || message.includes('535')) {
      return res.status(502).json({
        success: false,
        error: 'SMTP authentication was rejected. For Gmail, use the SMTP_USER account and its Google App Password in SMTP_PASSWORD.',
      });
    }
    if (message.includes('enotfound') || message.includes('getaddrinfo')) {
      return res.status(502).json({ success: false, error: 'SMTP_HOST could not be resolved. Check the SMTP host name.' });
    }
    if (message.includes('timeout') || message.includes('econnrefused') || message.includes('connect')) {
      return res.status(502).json({ success: false, error: 'The SMTP server could not be reached. Check SMTP_HOST and SMTP_PORT.' });
    }
    return res.status(502).json({ success: false, error: 'The SMTP provider rejected this email. Check the SMTP account and sender settings.' });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
            
