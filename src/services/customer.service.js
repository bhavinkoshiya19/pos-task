const prisma = require('../config/database');

async function createCustomer(data) {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
  });

  //creating loyaltyWallet for each customer
  await prisma.loyaltyWallet.create({ data: { customerId: customer.id } });

  return customer;
}

async function getCustomerById(id) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { plan: true, benefitUsages: true },
        orderBy: { createdAt: 'desc' },
      },
      loyaltyWallet: true,
      pointsHistory: { orderBy: { createdAt: 'desc' }, take: 50 },
      transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
}

async function getAllCustomer({ page = 1, limit = 20, search }) {
  const skip = (page - 1) * limit;

  const where = search
    ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        loyaltyWallet: true,
        memberships: { where: { status: 'ACTIVE' }, include: { plan: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, totalPages: Math.ceil(total / limit) };
}

async function updateCustomer(id, data) {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.mobile) updateData.mobile = data.mobile;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }

  return prisma.customer.update({ where: { id }, data: updateData });
}

module.exports = {
  createCustomer,
  getAllCustomer,
  getCustomerById,
  updateCustomer
};
