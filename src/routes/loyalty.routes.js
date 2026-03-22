const { Router } = require('express');
const loyaltyController = require('../controllers/loyalty.controller');
const { configureProgramSchema, redeemPointsSchema } = require('../validators/loyalty.validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', loyaltyController.getLoyaltyProgram);
router.put('/update', authorize('ADMIN'), validate(configureProgramSchema), loyaltyController.configureLoyaltyProgram);
router.get('/wallet/:customerId', loyaltyController.getLoyaltyWallet);
router.get('/history/:customerId', loyaltyController.getLoyaltyPointsHistory);
router.post('/redeem', validate(redeemPointsSchema), loyaltyController.redeemLoyaltyPoints);
router.post('/birthday-bonus/:customerId', authorize('ADMIN'), loyaltyController.awardLoyaltyBirthdayBonus);
router.post('/referral-bonus/:customerId', authorize('ADMIN'), loyaltyController.awardLoyaltyReferralBonus);

module.exports = router;
