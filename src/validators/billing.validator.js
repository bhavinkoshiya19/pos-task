const Joi = require('joi');

const itemSchema = Joi.object({
  itemType: Joi.string().valid('SERVICE', 'PRODUCT', 'PACKAGE').required(),
  itemName: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).default(1),
  unitPrice: Joi.number().min(0).required(),
});

const checkoutSchema = Joi.object({
  customerId: Joi.string().uuid().allow(null),
  items: Joi.array().items(itemSchema).min(1).required(),
  redeemPoints: Joi.number().integer().min(0).default(0),
  paymentMethod: Joi.string().allow('', null),
});

module.exports = { checkoutSchema };
