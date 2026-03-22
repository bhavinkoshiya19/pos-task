const prisma = require('../config/database');

async function getLoyaltyProgram() {
  let program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
  if (!program) {
    program = await prisma.loyaltyProgram.create({ data: {} });
  }
  return program;
}

async function configureProgram(data) {
  const program = await getLoyaltyProgram();
  return prisma.loyaltyProgram.update({ where: { id: program.id }, data });
}

async function earnPoints(customerId, billAmount, transactionId, multiplier = 1) {
  const program = await getLoyaltyProgram();
  if (!program.isActive) return 0;

  let points = Math.floor((billAmount / program.spendAmountForRatio) * program.pointsPerSpendRatio);
  points = Math.floor(points * multiplier);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateStr = today.toISOString().split('T')[0];
  if (program.doublePointsDays.includes(dayName) || program.doublePointsDays.includes(dateStr)) {
    points *= 2;
  }

  if (points <= 0) return 0;

  const expiresAt = program.pointsValidityDays
    ? new Date(Date.now() + program.pointsValidityDays * 86400000)
    : null;

  await prisma.$transaction([
    prisma.loyaltyWallet.upsert({
      where: { customerId },
      create: { customerId, availablePoints: points, lifetimeEarnedPoints: points },
      update: {
        availablePoints: { increment: points },
        lifetimeEarnedPoints: { increment: points },
      },
    }),
    prisma.loyaltyPointsHistory.create({
      data: {
        customerId, points,
        type: 'EARNED',
        description: 'Earned from transaction',
        transactionId, expiresAt,
      },
    }),
  ]);

  return points;
}

async function redeemPoints(customerId, pointsToRedeem, redeemedByUserId) {
  const program = await getLoyaltyProgram();
  const wallet = await prisma.loyaltyWallet.findUnique({ where: { customerId } });

  if (!wallet) return { error: true, message: 'Loyalty wallet not found', statusCode: 404 };
  if (wallet.availablePoints < pointsToRedeem) {
    return { error: true, message: 'Insufficient points', statusCode: 400 };
  }
  if (pointsToRedeem < program.minRedeemablePoints) {
    return { error: true, message: `Minimum ${program.minRedeemablePoints} points required`, statusCode: 400 };
  }

  const currencyValue = pointsToRedeem * program.pointToCurrencyRate;

  if (program.maxRedeemablePerBill && currencyValue > program.maxRedeemablePerBill) {
    return { error: true, message: `Maximum redeemable value per bill is ${program.maxRedeemablePerBill}`, statusCode: 400 };
  }

  const [updatedWallet] = await prisma.$transaction([
    prisma.loyaltyWallet.update({
      where: { customerId },
      data: {
        availablePoints: { decrement: pointsToRedeem },
        lifetimeRedeemedPoints: { increment: pointsToRedeem },
      },
    }),
    prisma.loyaltyPointsHistory.create({
      data: {
        customerId,
        points: -pointsToRedeem,
        type: 'REDEEMED',
        description: `Redeemed ${pointsToRedeem} points for ${currencyValue} discount`,
      },
    }),
    prisma.loyaltyRedemption.create({
      data: { customerId, pointsRedeemed: pointsToRedeem, currencyValue, redeemedByUserId },
    }),
  ]);

  return {
    pointsRedeemed: pointsToRedeem,
    currencyValue,
    remainingPoints: updatedWallet.availablePoints,
  };
}

async function getWallet(customerId) {
  return prisma.loyaltyWallet.findUnique({ where: { customerId } });
}

async function getPointsHistory(customerId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.loyaltyPointsHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.loyaltyPointsHistory.count({ where: { customerId } }),
  ]);

  return { history, total, page, totalPages: Math.ceil(total / limit) };
}

async function awardBonus(customerId, type, points, description) {
  if (!points) return 0;

  await prisma.$transaction([
    prisma.loyaltyWallet.update({
      where: { customerId },
      data: {
        availablePoints: { increment: points },
        lifetimeEarnedPoints: { increment: points },
      },
    }),
    prisma.loyaltyPointsHistory.create({
      data: { customerId, points, type, description },
    }),
  ]);

  return points;
}

async function awardBirthdayBonus(customerId) {
  const program = await getLoyaltyProgram();
  return awardBonus(customerId, 'BIRTHDAY', program.birthdayBonusPoints, 'Birthday bonus points');
}

async function awardReferralBonus(customerId) {
  const program = await getLoyaltyProgram();
  return awardBonus(customerId, 'REFERRAL', program.referralBonusPoints, 'Referral bonus points');
}

async function awardFirstPurchaseBonus(customerId) {
  const program = await getLoyaltyProgram();
  if (!program.firstPurchaseBonusPoints) return 0;

  const already = await prisma.loyaltyPointsHistory.findFirst({
    where: { customerId, type: 'FIRST_PURCHASE' },
  });
  if (already) return 0;

  return awardBonus(customerId, 'FIRST_PURCHASE', program.firstPurchaseBonusPoints, 'First purchase bonus');
}

async function expirePoints() {
  const expired = await prisma.loyaltyPointsHistory.findMany({
    where: { type: 'EARNED', expiresAt: { lt: new Date() }, points: { gt: 0 } },
  });

  let total = 0;
  for (const record of expired) {
    await prisma.$transaction([
      prisma.loyaltyWallet.update({
        where: { customerId: record.customerId },
        data: { availablePoints: { decrement: record.points } },
      }),
      prisma.loyaltyPointsHistory.create({
        data: {
          customerId: record.customerId,
          points: -record.points,
          type: 'EXPIRED',
          description: 'Points expired',
        },
      }),
      prisma.loyaltyPointsHistory.update({
        where: { id: record.id },
        data: { points: 0 },
      }),
    ]);
    total += record.points;
  }

  return total;
}

module.exports = {
  getLoyaltyProgram, configureProgram,
  earnPoints, redeemPoints,
  getWallet, getPointsHistory,
  awardBirthdayBonus, awardReferralBonus, awardFirstPurchaseBonus,
  expirePoints,
};
