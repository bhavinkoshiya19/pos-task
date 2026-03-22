const prisma = require('../config/database');

async function createPlan(data) {
  return prisma.membershipPlan.create({ data });
}

async function updatePlan(id, data) {
  return prisma.membershipPlan.update({ where: { id }, data });
}

async function getAllPlans({ status } = {}) {
  return prisma.membershipPlan.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  });
}

async function getPlanById(id) {
  return prisma.membershipPlan.findUnique({ where: { id } });
}

async function deletePlan(id) {
  return prisma.membershipPlan.update({ where: { id }, data: { status: 'INACTIVE' } });
}

function calcExpiry(startDate, durationType, customDays) {
  const d = new Date(startDate);
  switch (durationType) {
    case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
    case 'YEARLY': d.setFullYear(d.getFullYear() + 1); break;
    case 'CUSTOM': d.setDate(d.getDate() + (customDays || 30)); break;
  }
  return d;
}

async function enrollCustomer({ customerId, planId, paymentMethod, soldByUserId }) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return { error: true, message: 'Plan not found', statusCode: 400 };
  }
  if (plan.status !== 'ACTIVE') {
    return { error: true, message: 'Plan not active', statusCode: 400 };
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return { error: true, message: 'Customer not found', statusCode: 404 };
  }

  const existing = await prisma.customerMembership.findFirst({
    where: { customerId, status: 'ACTIVE' },
  });
  if (existing) {
    return { error: true, message: 'Customer already has an active membership', statusCode: 400 };
  }

  const startDate = new Date();
  const expiryDate = calcExpiry(startDate, plan.durationType, plan.customDays);

  return prisma.customerMembership.create({
    data: {
      customerId, planId, soldByUserId, startDate, expiryDate,
      paymentAmount: plan.price,
      paymentMethod,
      status: 'ACTIVE',
    },
    include: { plan: true, customer: true },
  });
}

async function getMembershipById(id) {
  return prisma.customerMembership.findUnique({
    where: { id },
    include: { plan: true, customer: true, benefitUsages: true },
  });
}

async function getCustomerMemberships(customerId) {
  return prisma.customerMembership.findMany({
    where: { customerId },
    include: { plan: true, benefitUsages: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function renewMembership(id) {
  const membership = await getMembershipById(id);
  if (!membership) return null;

  const { plan } = membership;
  const startDate = new Date();
  const expiryDate = calcExpiry(startDate, plan.durationType, plan.customDays);

  return prisma.customerMembership.update({
    where: { id },
    data: {
      startDate, expiryDate,
      status: 'ACTIVE',
      servicesUsedThisMonth: 0,
      freeServicesUsed: 0,
      freeProductsUsed: 0,
      totalUsageCount: 0,
      paymentAmount: plan.price,
    },
    include: { plan: true },
  });
}

async function upgradeMembership(id, newPlanId) {
  const membership = await getMembershipById(id);
  if (!membership) return { error: true, message: 'Membership not found', statusCode: 404 };

  const newPlan = await getPlanById(newPlanId);
  if (!newPlan) return { error: true, message: 'Plan not found', statusCode: 404 };
  const now = new Date();
  const totalDays = (membership.expiryDate - membership.startDate) / (86400000);
  const remaining = Math.max(0, (membership.expiryDate - now) / (86400000));
  const credit = (remaining / totalDays) * membership.paymentAmount;
  const toPay = Math.max(0, newPlan.price - credit);

  const expiryDate = calcExpiry(now, newPlan.durationType, newPlan.customDays);

  return prisma.customerMembership.update({
    where: { id },
    data: {
      planId: newPlanId,
      startDate: now,
      expiryDate,
      paymentAmount: toPay,
      servicesUsedThisMonth: 0,
      freeServicesUsed: 0,
      freeProductsUsed: 0,
      status: 'ACTIVE',
    },
    include: { plan: true },
  });
}

async function cancelMembership(id) {
  return prisma.customerMembership.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

async function freezeMembership(id) {
  return prisma.customerMembership.update({
    where: { id },
    data: { status: 'FROZEN', frozenAt: new Date() },
  });
}

async function unfreezeMembership(id) {
  const membership = await getMembershipById(id);
  if (!membership) return { error: true, message: 'Membership not found', statusCode: 404 };

  if (membership.status !== 'FROZEN') {
    return { error: true, message: 'Membership is not frozen', statusCode: 400 };
  }

  const frozenDays = Math.ceil((new Date() - membership.frozenAt) / 86400000);
  const newExpiry = new Date(membership.expiryDate);
  newExpiry.setDate(newExpiry.getDate() + frozenDays);

  return prisma.customerMembership.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      frozenAt: null,
      frozenDaysUsed: membership.frozenDaysUsed + frozenDays,
      expiryDate: newExpiry,
    },
  });
}

async function getActiveMembership(customerId) {
  return prisma.customerMembership.findFirst({
    where: { customerId, status: 'ACTIVE', expiryDate: { gte: new Date() } },
    include: { plan: true, benefitUsages: true },
  });
}

async function applyBenefits(customerId, billAmount, items) {
  const membership = await getActiveMembership(customerId);
  if (!membership) return { discount: 0, membership: null };

  const { plan } = membership;

  if (plan.totalUsageCap && membership.totalUsageCount >= plan.totalUsageCap) {
    return { discount: 0, membership, message: 'Usage cap reached' };
  }

  const serviceCount = items.filter((i) => i.itemType === 'SERVICE').length;
  if (plan.maxServicesPerMonth && (membership.servicesUsedThisMonth + serviceCount) > plan.maxServicesPerMonth) {
    return { discount: 0, membership, message: 'Monthly service limit reached' };
  }

  let discount = 0;

 
  const serviceTotal = items
    .filter((i) => i.itemType === 'SERVICE')
    .reduce((sum, i) => sum + i.unitPrice * (i.quantity || 1), 0);
  if (plan.serviceDiscountPercent && serviceTotal > 0) {
    discount += (serviceTotal * plan.serviceDiscountPercent) / 100;
  }

  const productTotal = items
    .filter((i) => i.itemType === 'PRODUCT')
    .reduce((sum, i) => sum + i.unitPrice * (i.quantity || 1), 0);
  if (plan.productDiscountPercent && productTotal > 0) {
    discount += (productTotal * plan.productDiscountPercent) / 100;
  }

  
  if (plan.flatDiscountPerBill) discount += plan.flatDiscountPerBill;


  if (plan.maxDiscountsPerBill) discount = Math.min(discount, plan.maxDiscountsPerBill);
  discount = Math.min(discount, billAmount);


  await prisma.customerMembership.update({
    where: { id: membership.id },
    data: {
      totalUsageCount: { increment: 1 },
      servicesUsedThisMonth: {
        increment: items.filter((i) => i.itemType === 'SERVICE').length,
      },
    },
  });

  return { discount, membership };
}

async function expireOverdueMemberships() {
  const result = await prisma.customerMembership.updateMany({
    where: { status: 'ACTIVE', expiryDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  return result.count;
}

async function getMembershipsExpiringSoon(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  return prisma.customerMembership.findMany({
    where: {
      status: 'ACTIVE',
      expiryDate: { gte: new Date(), lte: cutoff },
    },
    include: { customer: true, plan: true },
  });
}

module.exports = {
  createPlan, updatePlan, getAllPlans, getPlanById, deletePlan,
  enrollCustomer, getMembershipById, getCustomerMemberships,
  renewMembership, upgradeMembership, cancelMembership,
  freezeMembership, unfreezeMembership,
  getActiveMembership, applyBenefits,
  expireOverdueMemberships, getMembershipsExpiringSoon,
};
