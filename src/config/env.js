const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-super-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const WS_ENABLED = (process.env.WS_ENABLED || 'true') === 'true';

module.exports = {
  PORT,
  NODE_ENV,
  CORS_ORIGIN,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  WS_ENABLED,
};
