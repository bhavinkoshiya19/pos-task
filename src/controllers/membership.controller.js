const membershipService = require('../services/membership.service');
const notificationService = require('../services/notification.service');

const createMembershipPlan = async (req, res, next) => {
  try {
    const plan = await membershipService.createPlan(req.body);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

const updateMembershipPlan = async (req, res, next) => {
  try {
    const plan = await membershipService.updatePlan(req.params.id, req.body);
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

const getAllMembershipPlans = async (req, res, next) => {
  try {
    const plans = await membershipService.getAllPlans({ status: req.query.status });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

const getMembershipPlanById = async (req, res, next) => {
  try {
    const plan = await membershipService.getPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

const deleteMembershipPlan = async (req, res, next) => {
  try {
    await membershipService.deletePlan(req.params.id);
    res.json({ success: true, message: 'Plan deactivated' });
  } catch (err) {
    next(err);
  }
};

const enrollMembershipForCustomer = async (req, res, next) => {
  try {
    const result = await membershipService.enrollCustomer({
      ...req.body,
      soldByUserId: req.user.id,
    });

    if (result.error) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }

    notificationService.sendMembershipPurchaseNotification(result.customerId, result.plan.name);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getMembershipById = async (req, res, next) => {
  try {
    const membership = await membershipService.getMembershipById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
};

const getCustomerMemberships = async (req, res, next) => {
  try {
    const memberships = await membershipService.getCustomerMemberships(req.params.customerId);
    res.json({ success: true, data: memberships });
  } catch (err) {
    next(err);
  }
};

const renewMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.renewMembership(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
};

const upgradeMembership = async (req, res, next) => {
  try {
    const result = await membershipService.upgradeMembership(req.params.id, req.body.newPlanId);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const cancelMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.cancelMembership(req.params.id);
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
};

const freezeMembership = async (req, res, next) => {
  try {
    const membership = await membershipService.freezeMembership(req.params.id);
    res.json({ success: true, data: membership });
  } catch (err) {
    next(err);
  }
};

const unfreezeMembership = async (req, res, next) => {
  try {
    const result = await membershipService.unfreezeMembership(req.params.id);
    if (result.error) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMembershipPlan,
  updateMembershipPlan,
  getAllMembershipPlans,
  getMembershipPlanById,
  deleteMembershipPlan,
  enrollMembershipForCustomer,
  getMembershipById,
  getCustomerMemberships,
  renewMembership,
  upgradeMembership,
  cancelMembership,
  freezeMembership,
  unfreezeMembership,
};
