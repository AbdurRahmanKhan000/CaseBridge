import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import nodemailer, { type Transporter } from 'nodemailer';

function getTransporter() {
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
    pool: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function otpMailPlugin(): Plugin {
  return {
    name: 'otp-mail-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { email, code, staffName } = data;

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

              const cleanEmail = (email || '').trim().toLowerCase();
              if (!cleanEmail || !APPROVED_EMAILS.includes(cleanEmail)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Access restricted to approved staff accounts only.' }));
                return;
              }

              if (!code || code.length !== 5) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid verification code payload.' }));
                return;
              }

              const mailOptions = {
                from: `"${process.env.SMTP_FROM_NAME || 'ARK Ecosystem — CaseBridge'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'abdurrehman200khan@gmail.com'}>`,
                to: cleanEmail,
                subject: `CaseBridge Verification Code: ${code}`,
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
              };

              try {
                const transporter = getTransporter();
                await transporter.sendMail(mailOptions);
              } catch (initialErr) {
                console.warn('Initial direct send failed, retrying once...', initialErr);
                const freshTransporter = getTransporter();
                await freshTransporter.sendMail(mailOptions);
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Verification code successfully dispatched to your email.' }));
            } catch (err: any) {
              console.error('Failed to send verification email:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Failed to deliver email: ' + (err?.message || 'SMTP delivery error') }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), otpMailPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

