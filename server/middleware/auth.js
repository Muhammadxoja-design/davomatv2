const jwt = require('jsonwebtoken');
const config = require('../../bot/config');

// JWT token yaratish
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

// JWT token tekshirish middleware
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token topilmadi' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati o\'tgan' });
  }
}

// Role tekshirish middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sizda bu amalni bajarish huquqi yo\'q' });
    }
    
    next();
  };
}

// Super Admin tekshirish
function requireSuperAdmin(req, res, next) {
  return requireRole(config.ROLES.SUPER_ADMIN)(req, res, next);
}

// School Admin yoki Super Admin
function requireSchoolAdmin(req, res, next) {
  return requireRole(config.ROLES.SUPER_ADMIN, config.ROLES.SCHOOL_ADMIN)(req, res, next);
}

// Class Admin yoki yuqori
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
