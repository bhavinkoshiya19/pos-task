const Joi = require('joi');

const createPlanSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('INR'),
  durationType: Joi.string().valid('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM').required(),
  customDays: Joi.number().integer().min(1).when('durationType', {
    is: 'CUSTOM', then: Joi.required(), otherwise: Joi.optional(),
  }),
  serviceDiscountPercent: Joi.number().min(0).max(100).default(0),
  productDiscountPercent: Joi.number().min(0).max(100).default(0),
  flatDiscountPerBill: Joi.number().min(0).default(0),
  freeServiceCredits: Joi.number().integer().min(0).default(0),
  freeProductCredits: Joi.number().integer().min(0).default(0),
  rewardPointsMultiplier: Joi.number().min(1).default(1),
  memberOnlyPricing: Joi.boolean().default(false),
  maxServicesPerMonth: Joi.number().integer().min(0),
  maxDiscountsPerBill: Joi.number().integer().min(0),
  totalUsageCap: Joi.number().integer().min(0),
  applicableOutlets: Joi.array().items(Joi.string()).default([]),
  applicableCategories: Joi.array().items(Joi.string()).default([]),
  applicableStaff: Joi.array().items(Joi.string()).default([]),
  autoRenew: Joi.boolean().default(false),
  renewalReminderDays: Joi.number().integer().min(1).default(7),
}).required();

const enrollSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  planId: Joi.string().uuid().required(),
  paymentMethod: Joi.string().allow('', null),
}).required();

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
}).required();

module.exports = { createPlanSchema, enrollSchema, idParamSchema };
