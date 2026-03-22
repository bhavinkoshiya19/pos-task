const { Router } = require('express');

const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const membershipRoutes = require('./membership.routes');
const loyaltyRoutes = require('./loyalty.routes');
const billingRoutes = require('./billing.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/memberships', membershipRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/billing', billingRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
