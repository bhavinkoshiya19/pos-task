const billingService = require('../services/billing.service');
const notificationService = require('../services/notification.service');

const billingCheckout = async (req, res, next) => {
  try {
    const result = await billingService.checkout({
      ...req.body,
      processedByUserId: req.user.id,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }

    if (result.summary.pointsEarned > 0 && req.body.customerId) {
      notificationService.sendPointsEarnedNotification(req.body.customerId, result.summary.pointsEarned);
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const billingPreview = async (req, res, next) => {
  try {
    const result = await billingService.billingPreview(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  billingCheckout,
  billingPreview,
};
