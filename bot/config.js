require('dotenv').config();

module.exports = {
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  
  // Database
  DB_TYPE: process.env.DB_TYPE || 'file',
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './data/school_attendance.db',
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this',
  JWT_EXPIRES_IN: '30d',
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-change-this',
  
  // Server
  PORT: process.env.PORT || 5000,
  
  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  
  // Timezone
  TIMEZONE: process.env.TZ || 'Asia/Tashkent',
  
  // School Day Schedule (6 periods)
  SCHOOL_PERIODS: [
    { period: 1, start: '08:00', end: '09:00' },
    { period: 2, start: '09:00', end: '10:00' },
    { period: 3, start: '10:00', end: '11:00' },
    { period: 4, start: '11:00', end: '12:00' },
    { period: 5, start: '12:00', end: '13:00' },
    { period: 6, start: '13:00', end: '14:00' },
  ],
  
  // Roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    SCHOOL_ADMIN: 'school_admin',
    CLASS_ADMIN: 'class_admin',
    PARENT: 'parent'
  },
  
  // Attendance Status
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused'
  },
  
  // Super Admin
  SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
  
  // Uzbek Locale
  LOCALE: 'uz'
};
