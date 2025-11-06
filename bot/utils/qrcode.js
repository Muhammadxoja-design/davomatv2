import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

class QRCodeUtils {
  // QR kod yaratish (data URL)
  static async generateQRCode(data) {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw error;
    }
  }

  // QR kod yaratish va file ga saqlash
  static async generateQRCodeFile(data, filename) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads/qrcodes');
      
      // Create directory if doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filepath = path.join(uploadsDir, filename);
      await QRCode.toFile(filepath, data);
      
      return filepath;
    } catch (error) {
      console.error('QR Code file generation error:', error);
      throw error;
    }
  }

  // QR kod yaratish (buffer)
  static async generateQRCodeBuffer(data) {
    try {
      return await QRCode.toBuffer(data);
    } catch (error) {
      console.error('QR Code buffer generation error:', error);
      throw error;
    }
  }

  // Sinf uchun QR kod data yaratish
  static generateClassQRData(schoolId, classId) {
    return JSON.stringify({
      type: 'class',
      schoolId,
      classId,
      timestamp: Date.now()
    });
  }

  // Maktab uchun QR kod data yaratish
  static generateSchoolQRData(schoolId) {
    return JSON.stringify({
      type: 'school',
      schoolId,
      timestamp: Date.now()
    });
  }
}

export default QRCodeUtils;
