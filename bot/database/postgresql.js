const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class PostgreSQLDatabase {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    this.pool = new Pool({ connectionString });
    this.initializeTables();
  }

  async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY,
          telegram_id VARCHAR UNIQUE,
          phone_number VARCHAR NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name TEXT,
          role TEXT NOT NULL,
          password TEXT,
          province_id VARCHAR,
          school_id VARCHAR,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS provinces (
          id VARCHAR PRIMARY KEY,
          name TEXT NOT NULL,
          created_by VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS schools (
          id VARCHAR PRIMARY KEY,
          name TEXT NOT NULL,
          province_id VARCHAR NOT NULL,
          address TEXT,
          login VARCHAR NOT NULL UNIQUE,
          password TEXT NOT NULL,
          qr_code TEXT,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS classes (
          id VARCHAR PRIMARY KEY,
          school_id VARCHAR NOT NULL,
          grade INTEGER NOT NULL,
          section TEXT NOT NULL,
          class_admin_id VARCHAR,
          qr_code TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          class_id VARCHAR NOT NULL,
          school_id VARCHAR NOT NULL,
          photo_url TEXT,
          date_of_birth TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS parent_students (
          id VARCHAR PRIMARY KEY,
          parent_id VARCHAR NOT NULL,
          student_id VARCHAR NOT NULL,
          relationship TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS attendance (
          id VARCHAR PRIMARY KEY,
          student_id VARCHAR NOT NULL,
          class_id VARCHAR NOT NULL,
          school_id VARCHAR NOT NULL,
          date TIMESTAMP NOT NULL,
          period INTEGER NOT NULL,
          status TEXT NOT NULL,
          reason TEXT,
          photo_url TEXT,
          marked_by VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          is_read BOOLEAN DEFAULT false,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          action TEXT NOT NULL,
          details JSONB,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
          id VARCHAR PRIMARY KEY,
          phone_number VARCHAR,
          ip_address TEXT,
          success BOOLEAN NOT NULL,
          failure_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
        CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
        CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
      `);
    } finally {
      client.release();
    }
  }

  // Users
  async createUser(user) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO users (id, telegram_id, phone_number, first_name, last_name, role, password, province_id, school_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, user.telegram_id || null, user.phone_number, user.first_name, user.last_name || null, 
       user.role, user.password || null, user.province_id || null, user.school_id || null, user.is_active !== false]
    );
    return result.rows[0];
  }

  async getUserById(id) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getUserByPhone(phone) {
    const result = await this.pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
    return result.rows[0];
  }

  async getUserByTelegramId(telegramId) {
    const result = await this.pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    return result.rows[0];
  }

  async updateUser(id, updates) {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    const result = await this.pool.query(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteUser(id) {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  }

  async getAllUsers() {
    const result = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async getUsersByRole(role) {
    const result = await this.pool.query('SELECT * FROM users WHERE role = $1', [role]);
    return result.rows;
  }

  async getUsersBySchool(schoolId) {
    const result = await this.pool.query('SELECT * FROM users WHERE school_id = $1', [schoolId]);
    return result.rows;
  }

  // Schools
  async createSchool(school) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO schools (id, name, province_id, address, login, password, qr_code, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, school.name, school.province_id, school.address || null, school.login, school.password, 
       school.qr_code || null, school.is_active !== false, school.created_by || null]
    );
    return result.rows[0];
  }

  async getSchoolById(id) {
    const result = await this.pool.query('SELECT * FROM schools WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getAllSchools() {
    const result = await this.pool.query('SELECT * FROM schools ORDER BY created_at DESC');
    return result.rows;
  }

  async getSchoolsByProvince(provinceId) {
    const result = await this.pool.query('SELECT * FROM schools WHERE province_id = $1', [provinceId]);
    return result.rows;
  }

  async updateSchool(id, updates) {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    const result = await this.pool.query(
      `UPDATE schools SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteSchool(id) {
    await this.pool.query('DELETE FROM schools WHERE id = $1', [id]);
    return { success: true };
  }

  // Classes
  async createClass(classData) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO classes (id, school_id, grade, section, class_admin_id, qr_code, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, classData.school_id, classData.grade, classData.section, classData.class_admin_id || null, 
       classData.qr_code || null, classData.is_active !== false]
    );
    return result.rows[0];
  }

  async getClassById(id) {
    const result = await this.pool.query('SELECT * FROM classes WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getClassesBySchool(schoolId) {
    const result = await this.pool.query('SELECT * FROM classes WHERE school_id = $1 ORDER BY grade, section', [schoolId]);
    return result.rows;
  }

  async updateClass(id, updates) {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    const result = await this.pool.query(
      `UPDATE classes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteClass(id) {
    await this.pool.query('DELETE FROM classes WHERE id = $1', [id]);
    return { success: true };
  }

  // Students
  async createStudent(student) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO students (id, first_name, last_name, class_id, school_id, photo_url, date_of_birth, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, student.first_name, student.last_name, student.class_id, student.school_id, 
       student.photo_url || null, student.date_of_birth || null, student.is_active !== false]
    );
    return result.rows[0];
  }

  async getStudentById(id) {
    const result = await this.pool.query('SELECT * FROM students WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getStudentsByClass(classId) {
    const result = await this.pool.query(
      'SELECT * FROM students WHERE class_id = $1 AND is_active = true ORDER BY last_name, first_name',
      [classId]
    );
    return result.rows;
  }

  async getStudentsByParent(parentId) {
    const result = await this.pool.query(`
      SELECT s.* FROM students s
      JOIN parent_students ps ON s.id = ps.student_id
      WHERE ps.parent_id = $1 AND s.is_active = true
    `, [parentId]);
    return result.rows;
  }

  async updateStudent(id, updates) {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    const result = await this.pool.query(
      `UPDATE students SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteStudent(id) {
    await this.pool.query('DELETE FROM students WHERE id = $1', [id]);
    return { success: true };
  }

  // Parent-Student Relationships
  async createParentStudent(data) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO parent_students (id, parent_id, student_id, relationship)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.parent_id, data.student_id, data.relationship || null]
    );
    return result.rows[0];
  }

  async getParentsByStudent(studentId) {
    const result = await this.pool.query(`
      SELECT u.* FROM users u
      JOIN parent_students ps ON u.id = ps.parent_id
      WHERE ps.student_id = $1
    `, [studentId]);
    return result.rows;
  }

  // Attendance
  async createAttendance(attendance) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO attendance (id, student_id, class_id, school_id, date, period, status, reason, photo_url, marked_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, attendance.student_id, attendance.class_id, attendance.school_id, attendance.date, 
       attendance.period, attendance.status, attendance.reason || null, attendance.photo_url || null, attendance.marked_by]
    );
    return result.rows[0];
  }

  async getAttendanceByStudent(studentId, startDate, endDate) {
    const result = await this.pool.query(
      `SELECT * FROM attendance 
       WHERE student_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC, period DESC`,
      [studentId, startDate, endDate]
    );
    return result.rows;
  }

  async getAttendanceByClass(classId, date, period) {
    const result = await this.pool.query(
      `SELECT a.*, s.first_name, s.last_name, s.photo_url as student_photo
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.class_id = $1 AND a.date = $2 AND a.period = $3`,
      [classId, date, period]
    );
    return result.rows;
  }

  async getTodayAttendanceByClass(classId, period) {
    const today = new Date().toISOString().split('T')[0];
    return await this.getAttendanceByClass(classId, today, period);
  }

  // Notifications
  async createNotification(notification) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, notification.user_id, notification.type, notification.title, notification.message, 
       JSON.stringify(notification.data || {}), notification.is_read || false]
    );
    return result.rows[0];
  }

  async getNotificationsByUser(userId) {
    const result = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC',
      [userId]
    );
    return result.rows;
  }

  async markNotificationAsRead(id) {
    await this.pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    return { success: true };
  }

  // Activity Logs
  async createActivityLog(log) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, log.user_id, log.action, JSON.stringify(log.details || {}), log.ip_address || null, log.user_agent || null]
    );
    return result.rows[0];
  }

  async getActivityLogsByUser(userId, limit = 100) {
    const result = await this.pool.query(
      'SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  // Login Attempts
  async createLoginAttempt(attempt) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO login_attempts (id, phone_number, ip_address, success, failure_reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, attempt.phone_number || null, attempt.ip_address || null, attempt.success, attempt.failure_reason || null]
    );
    return result.rows[0];
  }

  async getRecentLoginAttempts(phoneNumber, limit = 10) {
    const result = await this.pool.query(
      'SELECT * FROM login_attempts WHERE phone_number = $1 ORDER BY created_at DESC LIMIT $2',
      [phoneNumber, limit]
    );
    return result.rows;
  }

  // Statistics
  async getAttendanceStats(schoolId, date) {
    const result = await this.pool.query(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused
      FROM attendance
      WHERE school_id = $1 AND date = $2
    `, [schoolId, date]);
    return result.rows[0];
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgreSQLDatabase;
