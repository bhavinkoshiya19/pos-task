const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/membership/sales', reportController.getMembershipSalesReport);
router.get('/membership/status', reportController.getMembershipStatusReport);
router.get('/membership/revenue', reportController.getMembershipRevenueReport);
router.get('/membership/renewal-rate', reportController.getMembershipRenewalRate);
router.get('/loyalty/points-issued', reportController.getLoyaltyPointsIssuedReport);
router.get('/loyalty/points-redeemed', reportController.getLoyaltyPointsRedeemedReport);
router.get('/loyalty/outstanding-liability', reportController.getLoyaltyOutstandingLiability);
router.get('/loyalty/top-customers', reportController.getTopLoyalCustomersReport);

module.exports = router;
