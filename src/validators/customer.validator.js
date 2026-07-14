const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().required(),
  mobile: Joi.string().trim().required(),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  dateOfBirth: Joi.date().iso().allow(null),
}).required();

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim(),
  mobile: Joi.string().trim(),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  dateOfBirth: Joi.date().iso().allow(null),
}).required();

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
}).required();

module.exports = { createCustomerSchema, updateCustomerSchema, idParamSchema };
