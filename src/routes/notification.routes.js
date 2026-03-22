const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/customer/:customerId', notificationController.getCustomerNotifications);
router.post('/promotional', authorize('ADMIN'), notificationController.sendPromotionalNotification);
router.post('/retry-failed', authorize('ADMIN'), notificationController.retryFailedNotifications);

module.exports = router;
