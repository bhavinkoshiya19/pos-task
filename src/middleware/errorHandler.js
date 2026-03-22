const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  // prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  // prisma record not found error
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
  });
};

module.exports = errorHandler;
