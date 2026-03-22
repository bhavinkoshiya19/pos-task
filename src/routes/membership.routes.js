const { Router } = require('express');
const membershipController = require('../controllers/membership.controller');
const { createPlanSchema, enrollSchema, idParamSchema } = require('../validators/membership.validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.post('/plans', authorize('ADMIN'), validate(createPlanSchema), membershipController.createMembershipPlan);
router.get('/plans', membershipController.getAllMembershipPlans);
router.get('/plans/:id', validate(idParamSchema, 'params'), membershipController.getMembershipPlanById);
router.put('/plans/:id', authorize('ADMIN'), validate(idParamSchema, 'params'), membershipController.updateMembershipPlan);
router.delete('/plans/:id', authorize('ADMIN'), validate(idParamSchema, 'params'), membershipController.deleteMembershipPlan);
router.post('/enroll', validate(enrollSchema), membershipController.enrollMembershipForCustomer);
router.get('/:id', validate(idParamSchema, 'params'), membershipController.getMembershipById);
router.get('/customer/:customerId', membershipController.getCustomerMemberships);
router.post('/:id/renew', validate(idParamSchema, 'params'), membershipController.renewMembership);
router.post('/:id/upgrade', validate(idParamSchema, 'params'), membershipController.upgradeMembership);
router.post('/:id/cancel', validate(idParamSchema, 'params'), membershipController.cancelMembership);
router.post('/:id/freeze', validate(idParamSchema, 'params'), membershipController.freezeMembership);
router.post('/:id/unfreeze', validate(idParamSchema, 'params'), membershipController.unfreezeMembership);

module.exports = router;
