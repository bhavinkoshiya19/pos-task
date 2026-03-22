require('dotenv').config();

const app = require('./app');
const prisma = require('./config/database');
const { startCronJobs } = require('./utils/cron');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function connect() {
  await prisma.$connect();
  logger.info('Database connected');

  startCronJobs();

  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

connect().catch((err) => {
  logger.error(`Startup failed: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
