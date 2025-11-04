// Bridge module to load CommonJS bot modules from TypeScript ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load bot modules
export const config = require('../bot/config');
export const { getDatabase } = require('../bot/database');
export const Helpers = require('../bot/utils/helpers');
export const QRCodeUtils = require('../bot/utils/qrcode');
export const bcrypt = require('bcryptjs');

// Load middleware modules (these are also CommonJS)
export const auth = require('./middleware/auth');
export const upload = require('./middleware/upload');
export const rateLimiter = require('./middleware/rateLimiter');

// Type-safe re-exports
export const { generateToken, authenticate, requireSuperAdmin, requireSchoolAdmin, requireClassAdmin } = auth;
export const { upload: multerUpload, processImage } = upload;
export const { authLimiter, uploadLimiter } = rateLimiter;
