const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // PostgreSQL errors
  if (err.code === '23505') { statusCode = 409; message = 'Duplicate entry — record already exists.'; }
  if (err.code === '23503') { statusCode = 400; message = 'Referenced record not found.'; }
  if (err.code === '22P02') { statusCode = 400; message = 'Invalid UUID format.'; }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired. Please log in again.'; }

  if (statusCode === 500) {
    logger.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler, AppError };
