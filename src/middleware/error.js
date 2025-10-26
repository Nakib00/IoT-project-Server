const createError = require('http-errors');
const { formatResponse } = require('../utils/responseFormatter');

const notFound = (_req, _res, next) => next(createError(404, 'Route not found'));

const errorConverter = (err, _req, _res, next) => {
  if (!(err.status && err.message)) {
    const e = createError(500, 'Internal Server Error');
    e.stack = err.stack;
    return next(e);
  }
  return next(err);
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const payload = formatResponse(
    false,
    status,
    message,
    {},
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
  res.status(status).json(payload);
};

module.exports = { notFound, errorConverter, errorHandler };
