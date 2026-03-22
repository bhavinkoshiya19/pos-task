const logger = require('./logger');

let client = null;

function getTwilio() {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

function formatPhone(number) {
  return number.startsWith('+') ? number : `+91${number}`;
}

async function sendSMS(to, message) {
  const twilio = getTwilio();
  if (!twilio) {
    logger.warn(`[sms] Twilio not configured, skipping ${to}`);
    return { status: 'skipped' };
  }

  const result = await twilio.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formatPhone(to),
  });

  logger.info(`[sms] sent to ${to} (${result.sid})`);
  return result;
}

async function sendWhatsApp(to, message) {
  const twilio = getTwilio();
  if (!twilio) {
    logger.warn(`[whatsapp] Twilio not configured, skipping ${to}`);
    return { status: 'skipped' };
  }

  const result = await twilio.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${formatPhone(to)}`,
  });

  logger.info(`[whatsapp] sent to ${to} (${result.sid})`);
  return result;
}

module.exports = { sendSMS, sendWhatsApp };
