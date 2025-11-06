// server/cjs-bridge.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// helper to prefer .default when present (interop for ESM->CJS or transpiled)
const normalizeDefault = (mod) => (mod && mod.__esModule && mod.default ? mod.default : (mod && mod.default ? mod.default : mod));

// Try requires (adjust paths if your layout differs)
const configModule = require('../bot/config'); // likely CommonJS .cjs
const dbModule = (() => {
  try { return require('../bot/database'); } catch (e) { try { return require('../bot/database.cjs'); } catch (_) { return require('../bot/database.js'); } }
})();
const HelpersModule = (() => {
  try { return require('../bot/utils/helpers'); } catch (e) { return require('../bot/utils/helpers.cjs'); }
})();
const QRCodeModule = (() => {
  try { return require('../bot/utils/qrcode'); } catch (e) { return require('../bot/utils/qrcode.cjs'); }
})();
const bcrypt = require('bcryptjs');

// Server-side middleware (relative to server folder)
const authModule = require('./middleware/auth');
const uploadModule = require('./middleware/upload');
const rateLimiterModule = require('./middleware/rateLimiter');

// Normalize modules (handle .default vs named exports)
export const config = normalizeDefault(configModule);
const dbNormalized = normalizeDefault(dbModule);
export const getDatabase = (typeof dbNormalized === 'function') ? dbNormalized : (dbNormalized.getDatabase || dbNormalized.default || dbNormalized);

// Helpers / utils
export const Helpers = normalizeDefault(HelpersModule);
export const QRCodeUtils = normalizeDefault(QRCodeModule);

// bcrypt (CJS)
export { bcrypt };

// Auth middleware exports — adjust if your auth module uses different names
// Ensure these symbols exist in ./middleware/auth
export const {
  generateToken,
  authenticate,
  requireSuperAdmin,
  requireSchoolAdmin,
  requireClassAdmin
} = authModule;

// Upload middleware — typical exports: upload (multer), processImage
export const {
  upload: multerUpload,
  processImage
} = uploadModule;

// Rate limiter middleware — ensure these exact names are exported from middleware/rateLimiter
export const {
  authLimiter,
  uploadLimiter
} = rateLimiterModule;
