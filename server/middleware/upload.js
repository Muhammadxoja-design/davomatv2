import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import config from '../../bot/config.js';

// Ensure upload directories exist
const uploadDirs = {
  photos: path.join(config.UPLOAD_DIR, 'photos'),
  qrcodes: path.join(config.UPLOAD_DIR, 'qrcodes'),
  temp: path.join(config.UPLOAD_DIR, 'temp')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.temp);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari (JPEG, PNG, GIF, WebP) qabul qilinadi'));
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

// Process and optimize image
async function processImage(file, type = 'photo') {
  try {
    const outputDir = type === 'photo' ? uploadDirs.photos : uploadDirs.qrcodes;
    const outputFilename = `${uuidv4()}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Optimize image with sharp
    await sharp(file.path)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    // Delete temp file
    fs.unlinkSync(file.path);
    
    // Return URL path
    return `/uploads/${type === 'photo' ? 'photos' : 'qrcodes'}/${outputFilename}`;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
}

// Delete image
function deleteImage(imagePath) {
  try {
    const fullPath = path.join(__dirname, '../..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

module.exports = {
  upload,
  processImage,
  deleteImage
};
