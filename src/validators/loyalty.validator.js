const Joi = require('joi');

const configureProgramSchema = Joi.object({
  pointsPerSpendRatio: Joi.number().min(0),
  spendAmountForRatio: Joi.number().min(1),
  pointToCurrencyRate: Joi.number().min(0),
  minRedeemablePoints: Joi.number().integer().min(0),
  maxRedeemablePerBill: Joi.number().min(0),
  partialRedemptionAllowed: Joi.boolean(),
  pointsValidityDays: Joi.number().integer().min(1),
  expiryNotificationDays: Joi.number().integer().min(1),
  gracePeriodDays: Joi.number().integer().min(0),
  doublePointsDays: Joi.array().items(Joi.string()),
  birthdayBonusPoints: Joi.number().integer().min(0),
  referralBonusPoints: Joi.number().integer().min(0),
  firstPurchaseBonusPoints: Joi.number().integer().min(0),
}).required();

const redeemPointsSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  points: Joi.number().integer().min(1).required(),
}).required();

module.exports = { configureProgramSchema, redeemPointsSchema };
