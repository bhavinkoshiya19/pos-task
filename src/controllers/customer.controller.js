const customerService = require('../services/customer.service');

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

const getAllCustomer = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await customerService.getAllCustomer({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

const getCustomerProfile = async (req, res, next) => {
  try {
    const profile = await customerService.getCustomerById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCustomer,
  getAllCustomer,
  getCustomerById,
  updateCustomer,
  getCustomerProfile,
};
