const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Structured logging with Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) return 'Request completed';
    return undefined;
  },
  customErrorMessage: (req, res) => {
    if (res.statusCode >= 400) return `Request failed with status ${res.statusCode}`;
    return undefined;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    resTime: 'responseTime'
  },
  customReceivedMessage: (req) => `Received ${req.method} ${req.url}`
});

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: 'Muitas solicitações, por favor tente novamente mais tarde'
  }
});

// Cache for API responses (5 minute default TTL)
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
  checkperiod: 60,
  useClones: false
});

// Cache middleware factory
function cacheMiddleware(ttl) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `api:${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached) {
      logger.debug({ key }, 'Cache hit');
      return res.json(cached);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl || cache.stdTTL);
        logger.debug({ key }, 'Cache set');
      }
      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  logger,
  httpLogger,
  rateLimiter,
  cache,
  cacheMiddleware
};
