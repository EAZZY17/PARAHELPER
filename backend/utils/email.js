const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'test@ethereal.email', pass: 'testpass' }
    });
    console.log('[Email] No SendGrid key - using ethereal fallback');
  }
  return transporter;
}

async function sendFormEmail({ to, subject, body, attachments }) {
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: '"ParaHelper" <parahelper@effectiveai.net>',
      to: to || 'team01@effectiveai.net',
      subject: subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;">${body.replace(/\n/g, '<br>')}</div>`,
      attachments: attachments || []
    });
    console.log(`[Email] Sent: ${subject} -> ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendFormEmail };
