import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import {
  bcrypt,
  getDatabase,
  Helpers,
  QRCodeUtils,
  config,
  generateToken,
  authenticate,
  requireSuperAdmin,
  requireSchoolAdmin,
  requireClassAdmin,
  multerUpload,
  processImage,
  authLimiter,
  uploadLimiter
} from './cjs-bridge';
import { createDbWrapper } from './db-wrapper';

export async function registerRoutes(app: Express): Promise<Server> {
  const dbRaw = await getDatabase();
  const db = createDbWrapper(dbRaw);


  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============ AUTH ROUTES ============
  
  // Login
  app.post('/api/auth/login', authLimiter, async (req, res, next) => {
    try {
      const { phoneNumber, password } = req.body;
      
      if (!phoneNumber || !password) {
        await db.createLoginAttempt({
          phone_number: phoneNumber,
          ip_address: req.ip,
          success: false,
          failure_reason: 'Missing credentials'
        });
        return res.status(400).json({ error: 'Telefon raqam va parol talab qilinadi' });
      }
      
      const user = await db.getUserByPhone(phoneNumber);
      
      if (!user || !user.password) {
        await db.createLoginAttempt({
          phone_number: phoneNumber,
          ip_address: req.ip,
          success: false,
          failure_reason: 'User not found'
        });
        return res.status(401).json({ error: 'Telefon raqam yoki parol noto\'g\'ri' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        await db.createLoginAttempt({
          phone_number: phoneNumber,
          ip_address: req.ip,
          success: false,
          failure_reason: 'Invalid password'
        });
        return res.status(401).json({ error: 'Telefon raqam yoki parol noto\'g\'ri' });
      }
      
      if (!user.is_active) {
        return res.status(403).json({ error: 'Hisobingiz nofaol' });
      }
      
      const token = generateToken(user);
      
      await db.createLoginAttempt({
        phone_number: phoneNumber,
        ip_address: req.ip,
        success: true
      });
      
      await db.createActivityLog({
        user_id: user.id,
        action: 'login',
        details: { via: 'web' },
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          school_id: user.school_id,
          province_id: user.province_id
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get current user


app.post('/api/auth/me', authLimiter, async (req, res, next) => {
  try {
    const phoneNumber = req.body.phoneNumber ?? req.body.phone_number ?? req.body.phone ?? null;
    const password = req.body.password ?? req.body.pass ?? null;

    console.log('Login body:', req.body);
    console.log('Using phone:', phoneNumber);

    if (!phoneNumber || !password) {
      await db.createLoginAttempt({
        phone_number: phoneNumber,
        ip_address: req.ip,
        success: false,
        failure_reason: 'Missing credentials'
      });
      return res.status(400).json({ error: 'Telefon raqam va parol talab qilinadi' });
    }

    const user = await db.getUserByPhone(phoneNumber);
    console.log('Found user:', !!user);

    if (!user || !user.password) {
      await db.createLoginAttempt({
        phone_number: phoneNumber,
        ip_address: req.ip,
        success: false,
        failure_reason: 'User not found'
      });
      return res.status(401).json({ error: 'Telefon raqam yoki parol noto\'g\'ri' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('validPassword:', validPassword);

    if (!validPassword) {
      await db.createLoginAttempt({
        phone_number: phoneNumber,
        ip_address: req.ip,
        success: false,
        failure_reason: 'Invalid password'
      });
      return res.status(401).json({ error: 'Telefon raqam yoki parol noto\'g\'ri' });
    }

  } catch (error) {
    next(error);
  }
});


  // ============ USER ROUTES ============
  
  // Get all users (Super Admin or School Admin)
  app.get('/api/users', authenticate, requireSchoolAdmin, async (req, res, next) => {
    try {
      let users;
      
      if (req.user.role === config.ROLES.SUPER_ADMIN) {
        users = await db.getAllUsers();
      } else if (req.user.role === config.ROLES.SCHOOL_ADMIN && req.user.schoolId) {
        users = await db.getUsersBySchool(req.user.schoolId);
      } else {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
      
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Create user
  app.post('/api/users', authenticate, requireSchoolAdmin, async (req, res, next) => {
    try {
      const { phone_number, first_name, last_name, role, school_id, password } = req.body;
      
      if (!phone_number || !first_name || !role) {
        return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
      }
      
      // Check permissions
      if (req.user.role === config.ROLES.SCHOOL_ADMIN && school_id !== req.user.schoolId) {
        return res.status(403).json({ error: 'Faqat o\'z maktabingizda foydalanuvchi qo\'sha olasiz' });
      }
      
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      
      const newUser = await db.createUser({
        phone_number,
        first_name,
        last_name: last_name || null,
        role,
        school_id: school_id || null,
        password: hashedPassword,
        is_active: true
      });
      
      await db.createActivityLog({
        user_id: req.user.userId,
        action: 'create_user',
        details: { created_user_id: newUser.id, role }
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  });

  // Update user
  app.put('/api/users/:id', authenticate, requireSchoolAdmin, async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existingUser = await db.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
      
      // Check permissions
      if (req.user.role === config.ROLES.SCHOOL_ADMIN && existingUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
      
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const updatedUser = await db.updateUser(id, updates);
      
      await db.createActivityLog({
        user_id: req.user.userId,
        action: 'update_user',
        details: { updated_user_id: id }
      });
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  // Delete user
  app.delete('/api/users/:id', authenticate, requireSchoolAdmin, async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const existingUser = await db.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
      
      // Check permissions
      if (req.user.role === config.ROLES.SCHOOL_ADMIN && existingUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
      
      await db.deleteUser(id);
      
      await db.createActivityLog({
        user_id: req.user.userId,
        action: 'delete_user',
        details: { deleted_user_id: id }
      });
      
      res.json({ message: 'Foydalanuvchi o\'chirildi' });
    } catch (error) {
      next(error);
    }
  });

  // ============ PROVINCE ROUTES (Super Admin only) ============
  
  app.get('/api/provinces', authenticate, requireSuperAdmin, async (req, res, next) => {
    try {
      const provinces = await db.getAllProvinces();
      res.json(provinces);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/provinces', authenticate, requireSuperAdmin, async (req, res, next) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Viloyat nomi talab qilinadi' });
      }
      
      const province = await db.createProvince({
        name,
        created_by: req.user.userId
      });
      
      res.status(201).json(province);
    } catch (error) {
      next(error);
    }
  });

  // ============ SCHOOL ROUTES ============
  
  app.get('/api/schools', authenticate, async (req, res, next) => {
    try {
      let schools;
      
      if (req.user.role === config.ROLES.SUPER_ADMIN) {
        const provinceId = req.query.province_id as string;
        schools = provinceId 
          ? await db.getSchoolsByProvince(provinceId)
          : await db.getAllSchools();
      } else if (req.user.schoolId) {
        const school = await db.getSchoolById(req.user.schoolId);
        schools = school ? [school] : [];
      } else {
        schools = [];
      }
      
      res.json(schools);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/schools', authenticate, requireSuperAdmin, async (req, res, next) => {
    try {
      const { name, province_id, address, login, password } = req.body;
      
      if (!name || !province_id || !login || !password) {
        return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate QR code
      const qrData = QRCodeUtils.generateSchoolQRData(null);
      const qrCode = await QRCodeUtils.generateQRCode(qrData);
      
      const school = await db.createSchool({
        name,
        province_id,
        address: address || null,
        login,
        password: hashedPassword,
        qr_code: qrCode,
        created_by: req.user.userId,
        is_active: true
      });
      
      res.status(201).json(school);
    } catch (error) {
      next(error);
    }
  });

  // ============ CLASS ROUTES ============
  
  app.get('/api/classes', authenticate, async (req, res, next) => {
    try {
      const schoolId = (req.query.school_id as string) || req.user.schoolId;
      
      if (!schoolId) {
        return res.status(400).json({ error: 'school_id talab qilinadi' });
      }
      
      const classes = await db.getClassesBySchool(schoolId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/classes', authenticate, requireSchoolAdmin, async (req, res, next) => {
    try {
      const { school_id, grade, section, class_admin_id } = req.body;
      
      if (!school_id || !grade || !section) {
        return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
      }
      
      // Check permissions
      if (req.user.role === config.ROLES.SCHOOL_ADMIN && school_id !== req.user.schoolId) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
      
      // Generate QR code
      const qrData = QRCodeUtils.generateClassQRData(school_id, null);
      const qrCode = await QRCodeUtils.generateQRCode(qrData);
      
      const classData = await db.createClass({
        school_id,
        grade: parseInt(grade),
        section,
        class_admin_id: class_admin_id || null,
        qr_code: qrCode,
        is_active: true
      });
      
      res.status(201).json(classData);
    } catch (error) {
      next(error);
    }
  });

  // ============ STUDENT ROUTES ============
  
  app.get('/api/students', authenticate, async (req, res, next) => {
    try {
      const classId = req.query.class_id as string;
      
      if (!classId) {
        return res.status(400).json({ error: 'class_id talab qilinadi' });
      }
      
      const students = await db.getStudentsByClass(classId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/students', authenticate, requireSchoolAdmin, multerUpload.single('photo'), uploadLimiter, async (req, res, next) => {
    try {
      const { first_name, last_name, class_id, school_id } = req.body;
      
      if (!first_name || !last_name || !class_id || !school_id) {
        return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
      }
      
      let photo_url = null;
      if (req.file) {
        photo_url = await processImage(req.file, 'photo');
      }
      
      const student = await db.createStudent({
        first_name,
        last_name,
        class_id,
        school_id,
        photo_url,
        is_active: true
      });
      
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  });

  // ============ ATTENDANCE ROUTES ============
  
  app.post('/api/attendance', authenticate, requireClassAdmin, multerUpload.single('photo'), uploadLimiter, async (req, res, next) => {
    try {
      const { marks } = req.body; // Array of { student_id, status, reason }
      const classId = req.body.class_id;
      const period = parseInt(req.body.period);
      
      if (!marks || !classId || !period) {
        return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
      }
      
      let photo_url = null;
      if (req.file) {
        photo_url = await processImage(req.file, 'photo');
      }
      
      const today = Helpers.getToday();
      const parsedMarks = JSON.parse(marks);
      
      const attendanceRecords = [];
      
      for (const mark of parsedMarks) {
        const record = await db.createAttendance({
          student_id: mark.student_id,
          class_id: classId,
          school_id: req.user.schoolId,
          date: today,
          period,
          status: mark.status,
          reason: mark.reason || null,
          photo_url,
          marked_by: req.user.userId
        });
        
        attendanceRecords.push(record);
      }
      
      // Broadcast to WebSocket clients
      broadcastAttendanceUpdate(classId, period, attendanceRecords);
      
      res.status(201).json({ message: 'Davomat saqlandi', records: attendanceRecords });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/attendance', authenticate, async (req, res, next) => {
    try {
      const { class_id, student_id, start_date, end_date, date, period } = req.query;
      
      if (student_id) {
        const attendance = await db.getAttendanceByStudent(
          student_id as string,
          start_date as string || Helpers.getToday(),
          end_date as string || Helpers.getToday()
        );
        return res.json(attendance);
      }
      
      if (class_id) {
        const attendance = await db.getAttendanceByClass(
          class_id as string,
          date as string || Helpers.getToday(),
          period ? parseInt(period as string) : null
        );
        return res.json(attendance);
      }
      
      res.status(400).json({ error: 'class_id yoki student_id talab qilinadi' });
    } catch (error) {
      next(error);
    }
  });

  // ============ STATISTICS ROUTES ============
  
  app.get('/api/statistics', authenticate, async (req, res, next) => {
    try {
      const schoolId = (req.query.school_id as string) || req.user.schoolId;
      const date = (req.query.date as string) || Helpers.getToday();
      
      if (!schoolId) {
        return res.status(400).json({ error: 'school_id talab qilinadi' });
      }
      
      const stats = await db.getAttendanceStats(schoolId, date);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // ============ ACTIVITY LOGS ============
  
  app.get('/api/activity-logs', authenticate, async (req, res, next) => {
    try {
      const userId = (req.query.user_id as string) || req.user.userId;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const logs = await db.getActivityLogsByUser(userId, limit);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // ============ WEBSOCKET ============
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_class') {
          clients.set(ws, { classId: data.classId });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });
  
  function broadcastAttendanceUpdate(classId, period, records) {
    const message = JSON.stringify({
      type: 'attendance_update',
      classId,
      period,
      records,
      timestamp: new Date().toISOString()
    });
    
    clients.forEach((clientData, ws) => {
      if (clientData.classId === classId && ws.readyState === 1) {
        ws.send(message);
      }
    });
  }

  return httpServer;
}
