const prisma = require('../config/database');
const { sendEmail, generateEmailHTML } = require('../utils/emailSender');
const { sendSMS, sendWhatsApp } = require('../utils/smsSender');
const logger = require('../utils/logger');

async function createAndSend({ customerId, type, channel = 'EMAIL', title, message }) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    logger.warn(`Notification skipped — customer ${customerId} not found`);
    return null;
  }

  const notification = await prisma.notification.create({
    data: { customerId, type, channel, title, message },
  });

  try {
    await dispatch(notification, customer);
    await prisma.notification.update({
      where: { id: notification.id },
      data: { isSent: true, sentAt: new Date() },
    });
  } catch (err) {
    logger.error(`Failed to send ${channel} to ${customer.name}: ${err.message}`);
  }

  return notification;
}

async function dispatch(notification, customer) {
  switch (notification.channel) {
    case 'EMAIL':
      if (!customer.email) return;
      await sendEmail(
        customer.email, notification.title, notification.message,
        generateEmailHTML(notification.title, notification.message, customer.name)
      );
      break;
    case 'SMS':
      if (!customer.mobile) return;
      await sendSMS(customer.mobile, `${notification.title}\n\n${notification.message}`);
      break;
    case 'WHATSAPP':
      if (!customer.mobile) return;
      await sendWhatsApp(customer.mobile, `*${notification.title}*\n\n${notification.message}`);
      break;
  }
}

async function sendViaAllChannels(customerId, type, title, message) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return [];

  const results = [];

  if (customer.email) {
    const n = await createAndSend({ customerId, type, channel: 'EMAIL', title, message });
    if (n) results.push(n);
  }

  if (customer.mobile && process.env.TWILIO_ACCOUNT_SID) {
    const n = await createAndSend({ customerId, type, channel: 'SMS', title, message });
    if (n) results.push(n);
  }

  if (customer.mobile && process.env.TWILIO_WHATSAPP_NUMBER) {
    const n = await createAndSend({ customerId, type, channel: 'WHATSAPP', title, message });
    if (n) results.push(n);
  }

  return results;
}

const sendMembershipPurchaseNotification = (customerId, planName) =>
  sendViaAllChannels(customerId, 'MEMBERSHIP_PURCHASE', 'Membership Activated!',
    `Your ${planName} membership has been activated. Enjoy exclusive discounts and rewards on every visit!`);

const sendMembershipExpiryReminder = (customerId, planName, expiryDate) =>
  sendViaAllChannels(customerId, 'MEMBERSHIP_EXPIRY', 'Membership Expiring Soon',
    `Your ${planName} membership expires on ${expiryDate.toLocaleDateString()}. Renew now to keep your benefits!`);

const sendRenewalReminder = (customerId, planName) =>
  sendViaAllChannels(customerId, 'RENEWAL_REMINDER', 'Time to Renew!',
    `Your ${planName} membership is about to expire. Renew today!`);

const sendPointsEarnedNotification = (customerId, points) =>
  sendViaAllChannels(customerId, 'POINTS_EARNED', 'Points Earned!',
    `You earned ${points} loyalty points on your recent purchase.`);

const sendPointsExpiryReminder = (customerId, points, expiryDate) =>
  sendViaAllChannels(customerId, 'POINTS_EXPIRY', 'Points Expiring Soon',
    `${points} loyalty points will expire on ${expiryDate.toLocaleDateString()}. Use them before they expire!`);

const sendBirthdayReward = (customerId, points) =>
  sendViaAllChannels(customerId, 'BIRTHDAY_REWARD', 'Happy Birthday!',
    `We've credited ${points} bonus loyalty points to your wallet as a birthday gift. Enjoy!`);

const sendPromotional = (customerId, title, message) =>
  sendViaAllChannels(customerId, 'PROMOTIONAL', title, message);

async function getCustomerNotifications(customerId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.notification.count({ where: { customerId } }),
  ]);
  return { notifications, total, page, totalPages: Math.ceil(total / limit) };
}

async function retryFailedNotifications() {
  const failedNotification = await prisma.notification.findMany({
    where: { isSent: false },
    include: { customer: true },
    take: 50,
  });

  let retried = 0;
  for (const notification of failedNotification) {
    try {
      await dispatch(notification, notification.customer);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { isSent: true, sentAt: new Date() },
      });
      retried++;
    } catch (err) {
      logger.error(`Retry failedNotification for ${notification.id}: ${err.message}`);
    }
  }

  return { total: failedNotification.length, retried };
}

module.exports = {
  sendMembershipPurchaseNotification, sendMembershipExpiryReminder,
  sendRenewalReminder, sendPointsEarnedNotification,
  sendPointsExpiryReminder, sendBirthdayReward, sendPromotional,
  getCustomerNotifications, retryFailedNotifications,
};
