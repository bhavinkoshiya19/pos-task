const { Router } = require('express');
const customerController = require('../controllers/customer.controller');
const { createCustomerSchema, updateCustomerSchema, idParamSchema } = require('../validators/customer.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.post('/add', validate(createCustomerSchema), customerController.createCustomer);
router.get('/all', customerController.getAllCustomer);
router.get('/:id', validate(idParamSchema, 'params'), customerController.getCustomerById);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateCustomerSchema), customerController.updateCustomer);
router.get('/:id/profile', validate(idParamSchema, 'params'), customerController.getCustomerProfile);

module.exports = router;
