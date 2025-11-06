import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';

class AuthUtils {
  // Hash parol
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Parolni tekshirish
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // JWT token yaratish
  static generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  // JWT token tekshirish
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Telefon raqamini formatlash (+998901234567)
  static formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 998, add +
    if (cleaned.startsWith('998')) {
      return '+' + cleaned;
    }
    
    // If doesn't start with 998, assume Uzbekistan and add +998
    if (!cleaned.startsWith('+')) {
      return '+998' + cleaned;
    }
    
    return phone;
  }

  // Telefon raqamini validate qilish
  static validatePhoneNumber(phone) {
    const formatted = this.formatPhoneNumber(phone);
    // Uzbekistan phone number: +998XXXXXXXXX (total 13 characters)
    return /^\+998\d{9}$/.test(formatted);
  }

  // Generate random OTP
  static generateOTP(length = 6) {
    return Math.floor(Math.random() * (10 ** length)).toString().padStart(length, '0');
  }
}

export default AuthUtils;
