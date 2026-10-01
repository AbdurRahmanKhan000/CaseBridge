import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// CRITICAL: Nginx listens on PORT (8080) and proxies to port 3000.
// Therefore, the Node app must always listen on DEFAULT_APP_PORT or 3000.
const PORT = parseInt(process.env.DEFAULT_APP_PORT || process.env.APP_PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production' || process.env.PUBLISHED === 'true';

app.use(express.json());

// List of approved institutional reviewer emails
const APPROVED_EMAILS = [
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
];

// Helper to create direct, fast, non-delayed Nodemailer transporter
function createDirectTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER || 'abdurrehman200khan@gmail.com',
      pass: process.env.SMTP_PASSWORD,
    },
    // CRITICAL: pool: false prevents connection queuing and idle timeouts (which caused the 3-4 minute delay)
    pool: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CaseBridge Backend' });
});

// API endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, code, staffName } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !APPROVED_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Access restricted to approved staff accounts only.',
      });
    }

    if (!code || code.length !== 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 5-digit verification code payload.',
      });
    }

    const transporter = createDirectTransporter();
    const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'abdurrehman200khan@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'ARK Ecosystem — CaseBridge';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: cleanEmail,
      subject: `CaseBridge Verification Code: ${code}`,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
      },
      text: `Hello ${staffName || 'Staff Member'},\n\nA Staff Portal sign-in was requested for your CaseBridge account.\n\nYour 5-digit verification code is:\n\n${code}\n\nThis code expires in 5 minutes and should not be shared with anyone.\n\nIf you did not request this sign-in, please notify your administrator.\n\nCaseBridge\nARK Ecosystem`,
      html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 20px;">
      <span style="font-size: 18px; font-weight: bold; color: #2563eb;">CaseBridge</span>
      <span style="font-size: 13px; color: #64748b; margin-left: 8px;">· ARK Ecosystem</span>
    </div>
    <p style="font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${staffName || 'Staff Member'}</strong>,</p>
    <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">A Staff Portal sign-in was requested for your CaseBridge approved staff account.</p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 20px 0;">
      <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #15803d; letter-spacing: 0.05em; margin-bottom: 6px;">Your 5-Digit Verification Code</span>
      <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 0.25em; color: #166534;">${code}</span>
    </div>
    <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">This code expires in <strong>5 minutes</strong> and should not be shared with anyone.</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 0 0 20px 0;">If you did not request this sign-in, you can safely ignore this email.</p>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 12px; color: #64748b;">
      <p style="margin: 0; font-weight: 600;">CaseBridge</p>
      <p style="margin: 2px 0 0 0; color: #94a3b8;">ARK Ecosystem</p>
    </div>
  </div>
</body>
</html>`,
    });

    console.log(`[Email Dispatched] To: ${cleanEmail}, MsgID: ${info.messageId}`);
    return res.status(200).json({
      success: true,
      message: 'Verification code successfully dispatched to your email.',
    });
  } catch (err: any) {
    console.error('[Email Dispatch Error]', err);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver email: ${err?.message || 'SMTP delivery error'}. Please try again.`,
    });
  }
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CaseBridge Server] running on http://0.0.0.0:${PORT} (Mode: ${isProd ? 'Production' : 'Development'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
