const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text, html) {
  const opts = {
    from: `"POS Loyalty System" <${process.env.SMTP_USER}>`,
    to, subject, text,
  };
  if (html) opts.html = html;

  const info = await transporter.sendMail(opts);
  logger.info(`[email] sent to ${to} (${info.messageId})`);
  return info;
}

function generateEmailHTML(title, message, customerName) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #2c3e50; color: #fff; padding: 20px; text-align: center; }
    .body { padding: 30px; color: #333; line-height: 1.6; }
    .highlight { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4caf50; }
    .footer { background: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>POS Membership & Loyalty</h1></div>
    <div class="body">
      <h2>${title}</h2>
      <p>Dear ${customerName || 'Customer'},</p>
      <div class="highlight"><p>${message}</p></div>
      <p>Thank you for being a valued customer!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} POS Membership & Loyalty System</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { sendEmail, generateEmailHTML };
