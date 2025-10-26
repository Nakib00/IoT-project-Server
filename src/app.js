const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorConverter, errorHandler, notFound } = require('./middleware/error');
const rateLimiters = require('./middleware/rateLimit');
const { CORS_ORIGIN } = require('./config/env');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(morgan('dev'));

app.use('/api/v1/auth', rateLimiters.authLimiter);
app.use('/api', rateLimiters.generalLimiter);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
