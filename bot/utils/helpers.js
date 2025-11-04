const config = require('../config');

class Helpers {
  // Bugungi sana (YYYY-MM-DD)
  static getToday() {
    return new Date().toISOString().split('T')[0];
  }

  // Vaqt oralig'ini olish
  static getDateRange(type) {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (type) {
      case 'today':
        // Same day
        break;
      case 'week':
        start.setDate(today.getDate() - today.getDay()); // Sunday
        end.setDate(start.getDate() + 6); // Saturday
        break;
      case 'month':
        start.setDate(1); // First day of month
        end.setMonth(today.getMonth() + 1);
        end.setDate(0); // Last day of month
        break;
      case 'year':
        start.setMonth(0, 1); // January 1st
        end.setMonth(11, 31); // December 31st
        break;
      default:
        throw new Error('Invalid date range type');
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  // Joriy soatni aniqlash (1-6)
  static getCurrentPeriod() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    for (const period of config.SCHOOL_PERIODS) {
      if (currentTime >= period.start && currentTime < period.end) {
        return period.period;
      }
    }

    return null; // Maktab vaqtidan tashqari
  }

  // Soat nomini olish
  static getPeriodName(period) {
    return `${period}-soat`;
  }

  // Sinf nomini olish
  static getClassName(grade, section) {
    return `${grade}-${section}`;
  }

  // O'quvchi to'liq ismini olish
  static getStudentFullName(student) {
    return `${student.last_name} ${student.first_name}`.trim();
  }

  // Davomat foizini hisoblash
  static calculateAttendancePercentage(present, total) {
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  }

  // Davomat statusini o'zbekchaga tarjima qilish
  static translateStatus(status) {
    const translations = {
      present: '✅ Kelgan',
      absent: '❌ Kelmagan',
      late: '⏰ Kechikkan',
      excused: '📋 Sababli'
    };
    return translations[status] || status;
  }

  // Role nomini o'zbekchaga tarjima qilish
  static translateRole(role) {
    const translations = {
      super_admin: '🔑 Katta Admin',
      school_admin: '🏫 Maktab Admini',
      class_admin: '👨‍🏫 Sinf Admini',
      parent: '👨‍👩‍👧 Ota-ona'
    };
    return translations[role] || role;
  }

  // Xabar formatlash
  static formatMessage(template, data) {
    let message = template;
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return message;
  }

  // Sanani formatlash (DD.MM.YYYY)
  static formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Vaqtni formatlash (HH:MM)
  static formatTime(dateString) {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  }

  // Keyboard yaratish
  static createKeyboard(buttons, options = {}) {
    const { columns = 2, resize = true, oneTime = false } = options;
    const keyboard = [];
    
    for (let i = 0; i < buttons.length; i += columns) {
      keyboard.push(buttons.slice(i, i + columns));
    }

    return {
      keyboard,
      resize_keyboard: resize,
      one_time_keyboard: oneTime
    };
  }

  // Inline keyboard yaratish
  static createInlineKeyboard(buttons, columns = 2) {
    const keyboard = [];
    
    for (let i = 0; i < buttons.length; i += columns) {
      keyboard.push(buttons.slice(i, i + columns));
    }

    return {
      inline_keyboard: keyboard
    };
  }

  // File path yaratish
  static createFilePath(dir, filename) {
    const path = require('path');
    return path.join(__dirname, '../../', dir, filename);
  }

  // Random ID yaratish
  static generateRandomId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  }

  // Paginate data
  static paginate(array, page = 1, perPage = 10) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
      data: array.slice(start, end),
      total: array.length,
      page,
      perPage,
      totalPages: Math.ceil(array.length / perPage),
      hasNext: end < array.length,
      hasPrev: page > 1
    };
  }

  // Validate grade (1-11)
  static validateGrade(grade) {
    const num = parseInt(grade);
    return num >= 1 && num <= 11;
  }

  // Validate section (A-Z)
  static validateSection(section) {
    return /^[A-Z]$/i.test(section);
  }

  // Validate period (1-6)
  static validatePeriod(period) {
    const num = parseInt(period);
    return num >= 1 && num <= 6;
  }
}

module.exports = Helpers;
