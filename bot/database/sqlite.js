const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class SQLiteDatabase {
  constructor() {
    const dbPath = process.env.SQLITE_DB_PATH || './data/school_attendance.db';
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  initializeTables() {
    const tables = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        telegram_id TEXT UNIQUE,
        phone_number TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT,
        role TEXT NOT NULL,
        password TEXT,
        province_id TEXT,
        school_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS provinces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        province_id TEXT NOT NULL,
        address TEXT,
        login TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        qr_code TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        grade INTEGER NOT NULL,
        section TEXT NOT NULL,
        class_admin_id TEXT,
        qr_code TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        class_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        photo_url TEXT,
        date_of_birth TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS parent_students (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        relationship TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        date TEXT NOT NULL,
        period INTEGER NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        photo_url TEXT,
        marked_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read INTEGER DEFAULT 0,
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY,
        phone_number TEXT,
        ip_address TEXT,
        success INTEGER NOT NULL,
        failure_reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
    `;

    this.db.exec(tables);
  }

  // Users
  createUser(user) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, telegram_id, phone_number, first_name, last_name, role, password, province_id, school_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, user.telegram_id || null, user.phone_number, user.first_name, user.last_name || null, 
             user.role, user.password || null, user.province_id || null, user.school_id || null, user.is_active !== false ? 1 : 0);
    return this.getUserById(id);
  }

  getUserById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  getUserByPhone(phone) {
    return this.db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phone);
  }

  getUserByTelegramId(telegramId) {
    return this.db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  }

  updateUser(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
    return this.getUserById(id);
  }

  deleteUser(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  getAllUsers() {
    return this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }

  getUsersByRole(role) {
    return this.db.prepare('SELECT * FROM users WHERE role = ?').all(role);
  }

  getUsersBySchool(schoolId) {
    return this.db.prepare('SELECT * FROM users WHERE school_id = ?').all(schoolId);
  }

  // Schools
  createSchool(school) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO schools (id, name, province_id, address, login, password, qr_code, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, school.name, school.province_id, school.address || null, school.login, school.password, 
             school.qr_code || null, school.is_active !== false ? 1 : 0, school.created_by || null);
    return this.getSchoolById(id);
  }

  getSchoolById(id) {
    return this.db.prepare('SELECT * FROM schools WHERE id = ?').get(id);
  }

  getAllSchools() {
    return this.db.prepare('SELECT * FROM schools ORDER BY created_at DESC').all();
  }

  getSchoolsByProvince(provinceId) {
    return this.db.prepare('SELECT * FROM schools WHERE province_id = ?').all(provinceId);
  }

  updateSchool(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE schools SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
    return this.getSchoolById(id);
  }

  deleteSchool(id) {
    const stmt = this.db.prepare('DELETE FROM schools WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Classes
  createClass(classData) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO classes (id, school_id, grade, section, class_admin_id, qr_code, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, classData.school_id, classData.grade, classData.section, classData.class_admin_id || null, 
             classData.qr_code || null, classData.is_active !== false ? 1 : 0);
    return this.getClassById(id);
  }

  getClassById(id) {
    return this.db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  }

  getClassesBySchool(schoolId) {
    return this.db.prepare('SELECT * FROM classes WHERE school_id = ? ORDER BY grade, section').all(schoolId);
  }

  updateClass(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE classes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
    return this.getClassById(id);
  }

  deleteClass(id) {
    const stmt = this.db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Students
  createStudent(student) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO students (id, first_name, last_name, class_id, school_id, photo_url, date_of_birth, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, student.first_name, student.last_name, student.class_id, student.school_id, 
             student.photo_url || null, student.date_of_birth || null, student.is_active !== false ? 1 : 0);
    return this.getStudentById(id);
  }

  getStudentById(id) {
    return this.db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  }

  getStudentsByClass(classId) {
    return this.db.prepare('SELECT * FROM students WHERE class_id = ? AND is_active = 1 ORDER BY last_name, first_name').all(classId);
  }

  getStudentsByParent(parentId) {
    return this.db.prepare(`
      SELECT s.* FROM students s
      JOIN parent_students ps ON s.id = ps.student_id
      WHERE ps.parent_id = ? AND s.is_active = 1
    `).all(parentId);
  }

  updateStudent(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE students SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    stmt.run(...values);
    return this.getStudentById(id);
  }

  deleteStudent(id) {
    const stmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Parent-Student Relationships
  createParentStudent(data) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO parent_students (id, parent_id, student_id, relationship)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, data.parent_id, data.student_id, data.relationship || null);
    return { id, ...data };
  }

  getParentsByStudent(studentId) {
    return this.db.prepare(`
      SELECT u.* FROM users u
      JOIN parent_students ps ON u.id = ps.parent_id
      WHERE ps.student_id = ?
    `).all(studentId);
  }

  // Attendance
  createAttendance(attendance) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO attendance (id, student_id, class_id, school_id, date, period, status, reason, photo_url, marked_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, attendance.student_id, attendance.class_id, attendance.school_id, attendance.date, 
             attendance.period, attendance.status, attendance.reason || null, attendance.photo_url || null, attendance.marked_by);
    return { id, ...attendance };
  }

  getAttendanceByStudent(studentId, startDate, endDate) {
    return this.db.prepare(`
      SELECT * FROM attendance 
      WHERE student_id = ? AND date >= ? AND date <= ?
      ORDER BY date DESC, period DESC
    `).all(studentId, startDate, endDate);
  }

  getAttendanceByClass(classId, date, period) {
    return this.db.prepare(`
      SELECT a.*, s.first_name, s.last_name, s.photo_url as student_photo
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.class_id = ? AND a.date = ? AND a.period = ?
    `).all(classId, date, period);
  }

  getTodayAttendanceByClass(classId, period) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByClass(classId, today, period);
  }

  // Notifications
  createNotification(notification) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, data, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, notification.user_id, notification.type, notification.title, notification.message, 
             JSON.stringify(notification.data || {}), notification.is_read ? 1 : 0);
    return { id, ...notification };
  }

  getNotificationsByUser(userId) {
    return this.db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC').all(userId);
  }

  markNotificationAsRead(id) {
    const stmt = this.db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Activity Logs
  createActivityLog(log) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, log.user_id, log.action, JSON.stringify(log.details || {}), log.ip_address || null, log.user_agent || null);
    return { id, ...log };
  }

  getActivityLogsByUser(userId, limit = 100) {
    return this.db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
  }

  // Login Attempts
  createLoginAttempt(attempt) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO login_attempts (id, phone_number, ip_address, success, failure_reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, attempt.phone_number || null, attempt.ip_address || null, attempt.success ? 1 : 0, attempt.failure_reason || null);
    return { id, ...attempt };
  }

  getRecentLoginAttempts(phoneNumber, limit = 10) {
    return this.db.prepare('SELECT * FROM login_attempts WHERE phone_number = ? ORDER BY created_at DESC LIMIT ?').all(phoneNumber, limit);
  }

  // Provinces
  createProvince(province) {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO provinces (id, name, created_by)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, province.name, province.created_by || null);
    return this.getProvinceById(id);
  }

  getProvinceById(id) {
    return this.db.prepare('SELECT * FROM provinces WHERE id = ?').get(id);
  }

  getAllProvinces() {
    return this.db.prepare('SELECT * FROM provinces ORDER BY name').all();
  }

  updateProvince(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE provinces SET ${fields} WHERE id = ?`);
    stmt.run(...values);
    return this.getProvinceById(id);
  }

  deleteProvince(id) {
    const stmt = this.db.prepare('DELETE FROM provinces WHERE id = ?');
    stmt.run(id);
    return { success: true };
  }

  // Statistics
  getAttendanceStats(schoolId, date) {
    return this.db.prepare(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused
      FROM attendance
      WHERE school_id = ? AND date = ?
    `).get(schoolId, date);
  }

  close() {
    this.db.close();
  }
}

module.exports = SQLiteDatabase;
