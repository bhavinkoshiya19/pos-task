const { Router } = require('express');
const billingController = require('../controllers/billing.controller');
const { checkoutSchema } = require('../validators/billing.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.post('/checkout', validate(checkoutSchema), billingController.billingCheckout);
router.post('/preview', billingController.billingPreview);

module.exports = router;
