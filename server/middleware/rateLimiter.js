const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Juda ko\'p so\'rovlar yuborildi, iltimos keyinroq qaytadan urinib ko\'ring',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Juda ko\'p login urinishlari, iltimos 15 daqiqadan keyin qaytadan urinib ko\'ring',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Juda ko\'p fayl yuklandi, iltimos keyinroq qaytadan urinib ko\'ring',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter
};
