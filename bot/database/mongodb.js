const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

class MongoDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.connect();
  }

  async connect() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_attendance';
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    await this.createIndexes();
  }

  async createIndexes() {
    // Users indexes
    await this.db.collection('users').createIndex({ telegram_id: 1 }, { unique: true, sparse: true });
    await this.db.collection('users').createIndex({ phone_number: 1 }, { unique: true });
    await this.db.collection('users').createIndex({ school_id: 1 });

    // Attendance indexes
    await this.db.collection('attendance').createIndex({ student_id: 1 });
    await this.db.collection('attendance').createIndex({ date: 1 });
    await this.db.collection('attendance').createIndex({ class_id: 1 });
    await this.db.collection('attendance').createIndex({ school_id: 1 });

    // Schools index
    await this.db.collection('schools').createIndex({ login: 1 }, { unique: true });
  }

  // Users
  async createUser(user) {
    const id = uuidv4();
    const userData = {
      _id: id,
      id,
      telegram_id: user.telegram_id || null,
      phone_number: user.phone_number,
      first_name: user.first_name,
      last_name: user.last_name || null,
      role: user.role,
      password: user.password || null,
      province_id: user.province_id || null,
      school_id: user.school_id || null,
      is_active: user.is_active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.db.collection('users').insertOne(userData);
    return userData;
  }

  async getUserById(id) {
    return await this.db.collection('users').findOne({ id });
  }

  async getUserByPhone(phone) {
    return await this.db.collection('users').findOne({ phone_number: phone });
  }

  async getUserByTelegramId(telegramId) {
    return await this.db.collection('users').findOne({ telegram_id: telegramId });
  }

  async updateUser(id, updates) {
    updates.updated_at = new Date();
    await this.db.collection('users').updateOne({ id }, { $set: updates });
    return await this.getUserById(id);
  }

  async deleteUser(id) {
    await this.db.collection('users').deleteOne({ id });
    return { success: true };
  }

  async getAllUsers() {
    return await this.db.collection('users').find().sort({ created_at: -1 }).toArray();
  }

  async getUsersByRole(role) {
    return await this.db.collection('users').find({ role }).toArray();
  }

  async getUsersBySchool(schoolId) {
    return await this.db.collection('users').find({ school_id: schoolId }).toArray();
  }

  // Schools
  async createSchool(school) {
    const id = uuidv4();
    const schoolData = {
      _id: id,
      id,
      name: school.name,
      province_id: school.province_id,
      address: school.address || null,
      login: school.login,
      password: school.password,
      qr_code: school.qr_code || null,
      is_active: school.is_active !== false,
      created_by: school.created_by || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.db.collection('schools').insertOne(schoolData);
    return schoolData;
  }

  async getSchoolById(id) {
    return await this.db.collection('schools').findOne({ id });
  }

  async getAllSchools() {
    return await this.db.collection('schools').find().sort({ created_at: -1 }).toArray();
  }

  async getSchoolsByProvince(provinceId) {
    return await this.db.collection('schools').find({ province_id: provinceId }).toArray();
  }

  async updateSchool(id, updates) {
    updates.updated_at = new Date();
    await this.db.collection('schools').updateOne({ id }, { $set: updates });
    return await this.getSchoolById(id);
  }

  async deleteSchool(id) {
    await this.db.collection('schools').deleteOne({ id });
    return { success: true };
  }

  // Classes
  async createClass(classData) {
    const id = uuidv4();
    const data = {
      _id: id,
      id,
      school_id: classData.school_id,
      grade: classData.grade,
      section: classData.section,
      class_admin_id: classData.class_admin_id || null,
      qr_code: classData.qr_code || null,
      is_active: classData.is_active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.db.collection('classes').insertOne(data);
    return data;
  }

  async getClassById(id) {
    return await this.db.collection('classes').findOne({ id });
  }

  async getClassesBySchool(schoolId) {
    return await this.db.collection('classes').find({ school_id: schoolId }).sort({ grade: 1, section: 1 }).toArray();
  }

  async updateClass(id, updates) {
    updates.updated_at = new Date();
    await this.db.collection('classes').updateOne({ id }, { $set: updates });
    return await this.getClassById(id);
  }

  async deleteClass(id) {
    await this.db.collection('classes').deleteOne({ id });
    return { success: true };
  }

  // Students
  async createStudent(student) {
    const id = uuidv4();
    const studentData = {
      _id: id,
      id,
      first_name: student.first_name,
      last_name: student.last_name,
      class_id: student.class_id,
      school_id: student.school_id,
      photo_url: student.photo_url || null,
      date_of_birth: student.date_of_birth || null,
      is_active: student.is_active !== false,
      created_at: new Date(),
      updated_at: new Date()
    };
    await this.db.collection('students').insertOne(studentData);
    return studentData;
  }

  async getStudentById(id) {
    return await this.db.collection('students').findOne({ id });
  }

  async getStudentsByClass(classId) {
    return await this.db.collection('students')
      .find({ class_id: classId, is_active: true })
      .sort({ last_name: 1, first_name: 1 })
      .toArray();
  }

  async getStudentsByParent(parentId) {
    const relationships = await this.db.collection('parent_students').find({ parent_id: parentId }).toArray();
    const studentIds = relationships.map(r => r.student_id);
    return await this.db.collection('students')
      .find({ id: { $in: studentIds }, is_active: true })
      .toArray();
  }

  async updateStudent(id, updates) {
    updates.updated_at = new Date();
    await this.db.collection('students').updateOne({ id }, { $set: updates });
    return await this.getStudentById(id);
  }

  async deleteStudent(id) {
    await this.db.collection('students').deleteOne({ id });
    return { success: true };
  }

  // Parent-Student Relationships
  async createParentStudent(data) {
    const id = uuidv4();
    const relationData = {
      _id: id,
      id,
      parent_id: data.parent_id,
      student_id: data.student_id,
      relationship: data.relationship || null,
      created_at: new Date()
    };
    await this.db.collection('parent_students').insertOne(relationData);
    return relationData;
  }

  async getParentsByStudent(studentId) {
    const relationships = await this.db.collection('parent_students').find({ student_id: studentId }).toArray();
    const parentIds = relationships.map(r => r.parent_id);
    return await this.db.collection('users').find({ id: { $in: parentIds } }).toArray();
  }

  // Attendance
  async createAttendance(attendance) {
    const id = uuidv4();
    const attendanceData = {
      _id: id,
      id,
      student_id: attendance.student_id,
      class_id: attendance.class_id,
      school_id: attendance.school_id,
      date: attendance.date,
      period: attendance.period,
      status: attendance.status,
      reason: attendance.reason || null,
      photo_url: attendance.photo_url || null,
      marked_by: attendance.marked_by,
      created_at: new Date()
    };
    await this.db.collection('attendance').insertOne(attendanceData);
    return attendanceData;
  }

  async getAttendanceByStudent(studentId, startDate, endDate) {
    return await this.db.collection('attendance')
      .find({
        student_id: studentId,
        date: { $gte: startDate, $lte: endDate }
      })
      .sort({ date: -1, period: -1 })
      .toArray();
  }

  async getAttendanceByClass(classId, date, period) {
    const attendance = await this.db.collection('attendance')
      .find({ class_id: classId, date, period })
      .toArray();
    
    // Join with students
    for (let record of attendance) {
      const student = await this.getStudentById(record.student_id);
      if (student) {
        record.first_name = student.first_name;
        record.last_name = student.last_name;
        record.student_photo = student.photo_url;
      }
    }
    return attendance;
  }

  async getTodayAttendanceByClass(classId, period) {
    const today = new Date().toISOString().split('T')[0];
    return await this.getAttendanceByClass(classId, today, period);
  }

  // Notifications
  async createNotification(notification) {
    const id = uuidv4();
    const notifData = {
      _id: id,
      id,
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      is_read: notification.is_read || false,
      sent_at: new Date()
    };
    await this.db.collection('notifications').insertOne(notifData);
    return notifData;
  }

  async getNotificationsByUser(userId) {
    return await this.db.collection('notifications')
      .find({ user_id: userId })
      .sort({ sent_at: -1 })
      .toArray();
  }

  async markNotificationAsRead(id) {
    await this.db.collection('notifications').updateOne({ id }, { $set: { is_read: true } });
    return { success: true };
  }

  // Activity Logs
  async createActivityLog(log) {
    const id = uuidv4();
    const logData = {
      _id: id,
      id,
      user_id: log.user_id,
      action: log.action,
      details: log.details || {},
      ip_address: log.ip_address || null,
      user_agent: log.user_agent || null,
      created_at: new Date()
    };
    await this.db.collection('activity_logs').insertOne(logData);
    return logData;
  }

  async getActivityLogsByUser(userId, limit = 100) {
    return await this.db.collection('activity_logs')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  // Login Attempts
  async createLoginAttempt(attempt) {
    const id = uuidv4();
    const attemptData = {
      _id: id,
      id,
      phone_number: attempt.phone_number || null,
      ip_address: attempt.ip_address || null,
      success: attempt.success,
      failure_reason: attempt.failure_reason || null,
      created_at: new Date()
    };
    await this.db.collection('login_attempts').insertOne(attemptData);
    return attemptData;
  }

  async getRecentLoginAttempts(phoneNumber, limit = 10) {
    return await this.db.collection('login_attempts')
      .find({ phone_number })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  // Provinces
  async createProvince(province) {
    const id = uuidv4();
    const provinceData = {
      _id: id,
      id,
      name: province.name,
      created_by: province.created_by || null,
      created_at: new Date()
    };
    await this.db.collection('provinces').insertOne(provinceData);
    return provinceData;
  }

  async getProvinceById(id) {
    return await this.db.collection('provinces').findOne({ id });
  }

  async getAllProvinces() {
    return await this.db.collection('provinces').find().sort({ name: 1 }).toArray();
  }

  async updateProvince(id, updates) {
    await this.db.collection('provinces').updateOne({ id }, { $set: updates });
    return await this.getProvinceById(id);
  }

  async deleteProvince(id) {
    await this.db.collection('provinces').deleteOne({ id });
    return { success: true };
  }

  // Statistics
  async getAttendanceStats(schoolId, date) {
    const attendance = await this.db.collection('attendance')
      .find({ school_id: schoolId, date })
      .toArray();
    
    const stats = {
      total_students: new Set(attendance.map(a => a.student_id)).size,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    return stats;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = MongoDatabase;
