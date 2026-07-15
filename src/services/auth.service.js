const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
}

async function register({ name, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || 'STAFF' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return { user };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user.id, user.role),
  };
}

async function getAllUser() {
  const user = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc', // Shows newly registered users first
    },
  })

  return { user };
}

module.exports = { register, login, getAllUser };
