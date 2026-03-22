const loyaltyService = require('../services/loyalty.service');
const notificationService = require('../services/notification.service');

const getLoyaltyProgram = async (req, res, next) => {
  try {
    const program = await loyaltyService.getLoyaltyProgram();
    res.json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
};

const configureLoyaltyProgram = async (req, res, next) => {
  try {
    const program = await loyaltyService.configureProgram(req.body);
    res.json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
};

const getLoyaltyWallet = async (req, res, next) => {
  try {
    const wallet = await loyaltyService.getWallet(req.params.customerId);
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    res.json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
};

const getLoyaltyPointsHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await loyaltyService.getPointsHistory(req.params.customerId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const redeemLoyaltyPoints = async (req, res, next) => {
  try {
    const result = await loyaltyService.redeemPoints(req.body.customerId, req.body.points, req.user.id);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const awardLoyaltyBirthdayBonus = async (req, res, next) => {
  try {
    const points = await loyaltyService.awardBirthdayBonus(req.params.customerId);
    if (points > 0) {
      notificationService.sendBirthdayReward(req.params.customerId, points);
    }
    res.json({ success: true, data: { pointsAwarded: points } });
  } catch (err) {
    next(err);
  }
};

const awardLoyaltyReferralBonus = async (req, res, next) => {
  try {
    const points = await loyaltyService.awardReferralBonus(req.params.customerId);
    res.json({ success: true, data: { pointsAwarded: points } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLoyaltyProgram,
  configureLoyaltyProgram,
  getLoyaltyWallet,
  getLoyaltyPointsHistory,
  redeemLoyaltyPoints,
  awardLoyaltyBirthdayBonus,
  awardLoyaltyReferralBonus,
};
