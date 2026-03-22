const cron = require('node-cron');
const membershipService = require('../services/membership.service');
const loyaltyService = require('../services/loyalty.service');
const notificationService = require('../services/notification.service');
const prisma = require('../config/database');
const logger = require('./logger');

function startCronJobs() {
  // run every dat at 12 AM
  cron.schedule('0 0 * * *', async () => {
    try {
      const expiredCount = await membershipService.expireOverdueMemberships();
      logger.info(`[cron] expired ${expiredCount} memberships`);

      const expiredPoints = await loyaltyService.expirePoints();
      logger.info(`[cron] expired ${expiredPoints} loyalty points`);

      // expiry reminders
      const expiringSoon = await membershipService.getMembershipsExpiringSoon(7);
      for (const data of expiringSoon) {
        await notificationService.sendMembershipExpiryReminder(data.customerId, data.plan.name, data.expiryDate);
      }

      // points expiry reminders
      const loyaltyProgram = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
      if (loyaltyProgram && loyaltyProgram.expiryNotificationDays) {
        const notifyBefore = new Date();
        notifyBefore.setDate(notifyBefore.getDate() + loyaltyProgram.expiryNotificationDays);

        const expiringPoints = await prisma.loyaltyPointsHistory.findMany({
          where: {
            type: 'EARNED',
            points: { gt: 0 },
            expiresAt: { gte: new Date(), lte: notifyBefore },
          },
        });

        const customerPointsMap = {};
        for (const record of expiringPoints) {
          if (!customerPointsMap[record.customerId]) {
            customerPointsMap[record.customerId] = { points: 0, expiresAt: record.expiresAt };
          }
          customerPointsMap[record.customerId].points += record.points;
        }

        for (const [customerId, data] of Object.entries(customerPointsMap)) {
          await notificationService.sendPointsExpiryReminder(customerId, data.points, data.expiresAt);
        }
        logger.info(`[cron] sent ${Object.keys(customerPointsMap).length} points expiry reminders`);
      }

      // birthday bonuses
      const today = new Date();
      const customers = await prisma.customer.findMany({
        where: { dateOfBirth: { not: null } },
      });

      for (const customer of customers) {
        const dob = new Date(customer.dateOfBirth);
        if (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) {
          const pts = await loyaltyService.awardBirthdayBonus(customer.id);
          if (pts > 0) await notificationService.sendBirthdayReward(customer.id, pts);
        }
      }

      logger.info('[cron] daily jobs done');
    } catch (err) {
      logger.error(`[cron] daily job error: ${err.message}`);
    }
  });

  // 1st date of every month — reset monthly counters
  cron.schedule('0 0 1 * *', async () => {
    try {
      await prisma.customerMembership.updateMany({
        where: { status: 'ACTIVE' },
        data: { servicesUsedThisMonth: 0 },
      });
      logger.info('[cron] monthly counters reset');
    } catch (err) {
      logger.error(`[cron] monthly reset error: ${err.message}`);
    }
  });

  logger.info('Cron jobs scheduled');
}

module.exports = { startCronJobs };
