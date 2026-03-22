const notificationService = require('../services/notification.service');

const getCustomerNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getCustomerNotifications(req.params.customerId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const sendPromotionalNotification = async (req, res, next) => {
  try {
    const { customerId, title, message } = req.body;
    const notifications = await notificationService.sendPromotional(customerId, title, message);
    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

const retryFailedNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.retryFailedNotifications();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomerNotifications,
  sendPromotionalNotification,
  retryFailedNotifications,
};
