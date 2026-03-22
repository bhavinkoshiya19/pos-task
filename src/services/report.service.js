const prisma = require('../config/database');

function dateFilter(startDate, endDate) {
  if (!startDate && !endDate) return {};
  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return { createdAt: filter };
}

async function getMembershipSalesReport({ startDate, endDate } = {}) {
  const where = dateFilter(startDate, endDate);

  const customerMemberships = await prisma.customerMembership.findMany({
    where,
    include: { plan: true, customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    totalSold: customerMemberships.length,
    totalRevenue: customerMemberships.reduce((sum, m) => sum + m.paymentAmount, 0),
    customerMemberships,
  };
}

async function getMembershipStatusReport() {
  const [active, expired, cancelled, frozen] = await Promise.all([
    prisma.customerMembership.count({ where: { status: 'ACTIVE' } }),
    prisma.customerMembership.count({ where: { status: 'EXPIRED' } }),
    prisma.customerMembership.count({ where: { status: 'CANCELLED' } }),
    prisma.customerMembership.count({ where: { status: 'FROZEN' } }),
  ]);

  return { active, expired, cancelled, frozen, total: active + expired + cancelled + frozen };
}

async function getMembershipRevenueReport({ startDate, endDate } = {}) {
  const where = dateFilter(startDate, endDate);

  const customerMemberships = await prisma.customerMembership.findMany({
    where,
    include: { plan: true },
  });

  const byPlan = {};
  for (const membership of customerMemberships) {
    const name = membership.plan.name;
    if (!byPlan[name]) byPlan[name] = { count: 0, revenue: 0 };
    byPlan[name].count++;
    byPlan[name].revenue += membership.paymentAmount;
  }

  return {
    totalRevenue: customerMemberships.reduce((sum, membership) => sum + membership.paymentAmount, 0),
    revenueByPlan: byPlan,
  };
}

async function getRenewalRate() {
  const [active, expired] = await Promise.all([
    prisma.customerMembership.count({ where: { status: 'ACTIVE' } }),
    prisma.customerMembership.count({ where: { status: 'EXPIRED' } }),
  ]);

  const total = active + expired;
  const rate = total > 0 ? ((active / total) * 100).toFixed(2) : 0;

  return { totalActive: active, totalExpired: expired, total, renewalRate: `${rate}%` };
}

async function getPointsIssuedReport({ startDate, endDate } = {}) {
  const where = { type: 'EARNED', ...dateFilter(startDate, endDate) };
  const records = await prisma.loyaltyPointsHistory.findMany({ where });

  return {
    totalPointsIssued: records.reduce((sum, r) => sum + r.points, 0),
    totalTransactions: records.length,
  };
}

async function getPointsRedeemedReport({ startDate, endDate } = {}) {
  const where = { type: 'REDEEMED', ...dateFilter(startDate, endDate) };
  const records = await prisma.loyaltyPointsHistory.findMany({ where });

  return {
    totalPointsRedeemed: records.reduce((sum, r) => sum + Math.abs(r.points), 0),
    totalRedemptions: records.length,
  };
}

async function getOutstandingLiability() {
  const wallets = await prisma.loyaltyWallet.findMany();
  const totalPoints = wallets.reduce((sum, w) => sum + w.availablePoints, 0);

  const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
  const rate = program?.pointToCurrencyRate || 1;

  return {
    totalOutstandingPoints: totalPoints,
    estimatedLiability: totalPoints * rate,
    totalCustomers: wallets.length,
  };
}

async function getTopLoyalCustomers(limit = 10) {
  const wallets = await prisma.loyaltyWallet.findMany({
    orderBy: { lifetimeEarnedPoints: 'desc' },
    take: limit,
    include: { customer: true },
  });

  return wallets.map((w) => ({
    customerId: w.customerId,
    customerName: w.customer.name,
    mobile: w.customer.mobile,
    lifetimeEarnedPoints: w.lifetimeEarnedPoints,
    lifetimeRedeemedPoints: w.lifetimeRedeemedPoints,
    availablePoints: w.availablePoints,
  }));
}

module.exports = {
  getMembershipSalesReport, getMembershipStatusReport,
  getMembershipRevenueReport, getRenewalRate,
  getPointsIssuedReport, getPointsRedeemedReport,
  getOutstandingLiability, getTopLoyalCustomers
};
