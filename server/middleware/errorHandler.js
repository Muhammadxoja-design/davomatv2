// Global error handler
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token yaroqsiz' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token muddati o\'tgan' });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
    return res.status(409).json({ error: 'Ma\'lumot allaqachon mavjud' });
  }
  
  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fayl hajmi juda katta (max 10MB)' });
    }
    return res.status(400).json({ error: 'Fayl yuklashda xatolik' });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Server xatosi'
  });
}

// Not found handler
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'API endpoint topilmadi' });
}

module.exports = { errorHandler, notFoundHandler };
