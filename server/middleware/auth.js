// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../../bot/config'); // sizning joyingizga moslang

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      schoolId: user.school_id,
      provinceId: user.province_id
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

function authenticate(req, res, next) {
  try {
    // 1) Authorization header (preferred)
    const rawAuth = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (rawAuth && typeof rawAuth === 'string') {
      const parts = rawAuth.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1].trim();
      }
    }

    // 2) fallback: query param ?token=...
    if (!token && req.query && req.query.token) {
      token = String(req.query.token);
    }

    // 3) fallback: cookie (require cookie-parser middleware)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // debug logs (dev only) — comment out in production
    // console.log('AUTH debug - header:', rawAuth, 'query:', req.query?.token, 'cookie:', req.cookies?.token);

    if (!token) {
      return res.status(401).json({ error: 'Token topilmadi' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      // give slightly more detail for dev
      // console.error('JWT verify error:', err);
      return res.status(401).json({ error: 'Token yaroqsiz yoki muddati o\'tgan' });
    }

    // normalize user payload (so req.user.userId always exists)
    const userId = decoded?.userId ?? decoded?.id ?? decoded?.sub ?? null;
    req.user = { ...(decoded || {}), userId };

    next();
  } catch (err) {
    console.error('authenticate middleware error:', err);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Sizda bu amalni bajarish huquqi yo\'q' });
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  return requireRole(config.ROLES.SUPER_ADMIN)(req, res, next);
}

function requireSchoolAdmin(req, res, next) {
  return requireRole(config.ROLES.SUPER_ADMIN, config.ROLES.SCHOOL_ADMIN)(req, res, next);
}

function requireClassAdmin(req, res, next) {
  return requireRole(config.ROLES.SUPER_ADMIN, config.ROLES.SCHOOL_ADMIN, config.ROLES.CLASS_ADMIN)(req, res, next);
}

module.exports = {
  generateToken,
  authenticate,
  requireRole,
  requireSuperAdmin,
  requireSchoolAdmin,
  requireClassAdmin
};
