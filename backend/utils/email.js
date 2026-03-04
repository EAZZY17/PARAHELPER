const nodemailer = require('nodemailer');

let transporter;

const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'parahelper@effectiveai.net';
const SENDER_NAME = process.env.SENDER_NAME || 'ParaHelper';

function getTransporter() {
  if (transporter) return transporter;

  // Gmail SMTP - reliable for demos (use App Password with 2FA)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    console.log(`[Email] Using Gmail SMTP (${process.env.GMAIL_USER})`);
    return transporter;
  }

  // SendGrid - requires SENDER_EMAIL to be verified in SendGrid dashboard
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    console.log(`[Email] Using SendGrid (from: ${SENDER_EMAIL})`);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: 'test@ethereal.email', pass: 'testpass' }
  });
  console.log('[Email] WARNING: No email keys - using Ethereal test (emails not delivered)');
  return transporter;
}

async function sendFormEmail({ to, subject, body, attachments }) {
  const recipient = to || process.env.FORM_RECIPIENT_EMAIL || 'Hillsidesplc@gmail.com';
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: recipient,
      subject: subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;">${body.replace(/\n/g, '<br>')}</div>`,
      attachments: attachments || []
    });
    console.log(`[Email] Sent: ${subject} -> ${recipient} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] FAILED to ${recipient}:`, error.message);
    if (error.response) console.error('[Email] Response:', error.response);
    return { success: false, error: error.message };
  }
}

module.exports = { sendFormEmail };
