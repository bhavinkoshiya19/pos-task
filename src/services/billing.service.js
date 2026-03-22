const prisma = require('../config/database');
const membershipService = require('./membership.service');
const loyaltyService = require('./loyalty.service');

async function checkout({ customerId, items, redeemPoints = 0, paymentMethod, processedByUserId }) {
  const billAmount = items.reduce((sum, item) => sum + item.unitPrice * (item.quantity || 1), 0);

  let membershipDiscount = 0;
  let loyaltyDiscount = 0;
  let membership = null;
  let pointsEarned = 0;
  let multiplier = 1;

  if (customerId) {
    const result = await membershipService.applyBenefits(customerId, billAmount, items);
    membershipDiscount = result.discount;
    membership = result.membership;
    if (membership) multiplier = membership.plan.rewardPointsMultiplier || 1;
  }

  const afterMembership = billAmount - membershipDiscount;

  if (customerId && redeemPoints > 0) {
    const redemption = await loyaltyService.redeemPoints(customerId, redeemPoints, processedByUserId);
    if (redemption.error) {
      return { error: true, message: redemption.message, statusCode: redemption.statusCode };
    }
    loyaltyDiscount = Math.min(redemption.currencyValue, afterMembership);
  }

  const finalPayable = Math.max(0, afterMembership - loyaltyDiscount);

  const transaction = await prisma.transaction.create({
    data: {
      customerId, processedByUserId, billAmount,
      membershipDiscount, loyaltyDiscount, finalPayable,
      paymentMethod,
      pointsRedeemed: redeemPoints,
      items: {
        create: items.map((item) => ({
          itemType: item.itemType,
          itemName: item.itemName,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          discount: 0,
          finalPrice: item.unitPrice * (item.quantity || 1),
        })),
      },
    },
    include: { items: true },
  });

  if (customerId && finalPayable > 0) {
    pointsEarned = await loyaltyService.earnPoints(customerId, finalPayable, transaction.id, multiplier);

    const txCount = await prisma.transaction.count({ where: { customerId } });
    if (txCount === 1) {
      pointsEarned += await loyaltyService.awardFirstPurchaseBonus(customerId);
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { pointsEarned },
    });
  }

  if (membership && membershipDiscount > 0) {
    await prisma.membershipBenefitUsage.create({
      data: {
        customerMembershipId: membership.id,
        benefitType: 'BILL_DISCOUNT',
        discountAmount: membershipDiscount,
        transactionId: transaction.id,
      },
    });
  }

  return {
    transaction: { ...transaction, pointsEarned },
    summary: {
      billAmount, membershipDiscount, loyaltyDiscount, finalPayable,
      pointsEarned, pointsRedeemed: redeemPoints,
      membershipPlan: membership?.plan?.name || null,
    },
  };
}

async function billingPreview({ customerId, items, redeemPoints = 0 }) {
  const billAmount = items.reduce((sum, item) => sum + item.unitPrice * (item.quantity || 1), 0);

  let membershipDiscount = 0;
  let loyaltyDiscount = 0;
  let redeemablePoints = 0;
  let membershipPlan = null;

  if (customerId) {
    const membership = await membershipService.getActiveMembership(customerId);
    if (membership) {
      const { plan } = membership;
      membershipPlan = plan.name;

      const serviceTotal = items
        .filter((i) => i.itemType === 'SERVICE')
        .reduce((sum, i) => sum + i.unitPrice * (i.quantity || 1), 0);
      const productTotal = items
        .filter((i) => i.itemType === 'PRODUCT')
        .reduce((sum, i) => sum + i.unitPrice * (i.quantity || 1), 0);

      if (plan.serviceDiscountPercent) membershipDiscount += (serviceTotal * plan.serviceDiscountPercent) / 100;
      if (plan.productDiscountPercent) membershipDiscount += (productTotal * plan.productDiscountPercent) / 100;
      if (plan.flatDiscountPerBill) membershipDiscount += plan.flatDiscountPerBill;
      if (plan.maxDiscountsPerBill) membershipDiscount = Math.min(membershipDiscount, plan.maxDiscountsPerBill);
      membershipDiscount = Math.min(membershipDiscount, billAmount);
    }

    const wallet = await prisma.loyaltyWallet.findUnique({ where: { customerId } });
    if (wallet) {
      redeemablePoints = wallet.availablePoints;
      if (redeemPoints > 0) {
        const program = await loyaltyService.getLoyaltyProgram();
        loyaltyDiscount = Math.min(
          redeemPoints * program.pointToCurrencyRate,
          billAmount - membershipDiscount
        );
      }
    }
  }

  const finalPayable = Math.max(0, billAmount - membershipDiscount - loyaltyDiscount);

  return {
    billAmount,
    membershipSavings: membershipDiscount,
    redeemablePoints,
    loyaltyDiscount,
    finalDiscountSummary: membershipDiscount + loyaltyDiscount,
    netPayableAmount: finalPayable,
    membershipPlan,
  };
}

module.exports = { checkout, billingPreview };
