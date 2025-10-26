const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { JWT_SECRET } = require('../config/env');

function extractBearer(authHeader) {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

const auth = (req, _res, next) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) throw createError(401, 'Authorization header missing or invalid');
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (_err) {
    next(createError(401, 'Invalid or expired token'));
  }
};

module.exports = { auth };
