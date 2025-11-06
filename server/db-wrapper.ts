type AnyDB = any;

export function createDbWrapper(dbRaw: AnyDB) {
  if (!dbRaw) throw new Error('dbRaw is required');

  // Agar dbRaw allaqachon wrapper bo'lsa
  if (typeof dbRaw.getUserByPhone === 'function') {
    return dbRaw;
  }

  const raw = dbRaw;

  // helper: sqlite style get/run/all OR knex style queries
  const isSqliteLike = typeof raw.get === 'function' && typeof raw.run === 'function';
  const isKnexLike = typeof raw === 'function' && typeof raw.select === 'function' || (typeof raw('users') === 'object');

  return {
    raw,

    // AUTH / USER
    async getUserByPhone(phone: string) {
      if (isSqliteLike) {
        return await raw.get('SELECT * FROM users WHERE phone_number = ?', [phone]);
      }
      if (isKnexLike) {
        return await raw('users').where({ phone_number: phone }).first();
      }
      throw new Error('Unsupported DB interface for getUserByPhone');
    },

    async getUserById(id: number | string) {
      if (isSqliteLike) {
        return await raw.get('SELECT * FROM users WHERE id = ?', [id]);
      }
      if (isKnexLike) {
        return await raw('users').where({ id }).first();
      }
      throw new Error('Unsupported DB interface for getUserById');
    },

    async getAllUsers() {
      if (isSqliteLike) {
        return await raw.all('SELECT * FROM users');
      }
      if (isKnexLike) {
        return await raw('users').select();
      }
      throw new Error('Unsupported DB interface for getAllUsers');
    },

    async getUsersBySchool(schoolId: number | string) {
      if (isSqliteLike) {
        return await raw.all('SELECT * FROM users WHERE school_id = ?', [schoolId]);
      }
      if (isKnexLike) {
        return await raw('users').where({ school_id: schoolId }).select();
      }
      throw new Error('Unsupported DB interface for getUsersBySchool');
    },

    async createUser(user: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO users (phone_number, password, first_name, last_name, role, school_id, province_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.phone_number,
            user.password || null,
            user.first_name || null,
            user.last_name || null,
            user.role || null,
            user.school_id || null,
            user.province_id || null,
            user.is_active ? 1 : 0
          ]
        );
        return { id: res.lastID, ...user };
      }
      if (isKnexLike) {
        const [id] = await raw('users').insert({
          phone_number: user.phone_number,
          password: user.password || null,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          role: user.role || null,
          school_id: user.school_id || null,
          province_id: user.province_id || null,
          is_active: user.is_active ? 1 : 0
        });
        return { id, ...user };
      }
      throw new Error('Unsupported DB interface for createUser');
    },

    async updateUser(id: number | string, updates: any) {
      if (isSqliteLike) {
        // simple update builder
        const keys = Object.keys(updates);
        const vals = keys.map(k => updates[k]);
        const setStr = keys.map(k => `${k} = ?`).join(', ');
        await raw.run(`UPDATE users SET ${setStr} WHERE id = ?`, [...vals, id]);
        return await this.getUserById(id);
      }
      if (isKnexLike) {
        await raw('users').where({ id }).update(updates);
        return await this.getUserById(id);
      }
      throw new Error('Unsupported DB interface for updateUser');
    },

    async deleteUser(id: number | string) {
      if (isSqliteLike) {
        await raw.run('DELETE FROM users WHERE id = ?', [id]);
        return true;
      }
      if (isKnexLike) {
        await raw('users').where({ id }).del();
        return true;
      }
      throw new Error('Unsupported DB interface for deleteUser');
    },

    // LOGIN ATTEMPTS & ACTIVITY LOGS
    async createLoginAttempt({ phone_number, ip_address, success, failure_reason }: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO login_attempts (phone_number, ip_address, success, failure_reason, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [phone_number || null, ip_address || null, success ? 1 : 0, failure_reason || null]
        );
        return { id: res.lastID };
      }
      if (isKnexLike) {
        const [id] = await raw('login_attempts').insert({ phone_number, ip_address, success: success ? 1 : 0, failure_reason, created_at: new Date() });
        return { id };
      }
      throw new Error('Unsupported DB interface for createLoginAttempt');
    },

    async createActivityLog({ user_id, action, details, ip_address, user_agent }: any) {
      const detailsJson = JSON.stringify(details || {});
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`,
          [user_id || null, action || null, detailsJson, ip_address || null, user_agent || null]
        );
        return { id: res.lastID };
      }
      if (isKnexLike) {
        const [id] = await raw('activity_logs').insert({ user_id, action, details: detailsJson, ip_address, user_agent, created_at: new Date() });
        return { id };
      }
      throw new Error('Unsupported DB interface for createActivityLog');
    },

    // PROVINCES
    async getAllProvinces() {
      if (isSqliteLike) return await raw.all('SELECT * FROM provinces');
      if (isKnexLike) return await raw('provinces').select();
      throw new Error('Unsupported DB interface for getAllProvinces');
    },

    async createProvince({ name, created_by }: any) {
      if (isSqliteLike) {
        const res = await raw.run('INSERT INTO provinces (name, created_by) VALUES (?, ?)', [name, created_by || null]);
        return { id: res.lastID, name, created_by };
      }
      if (isKnexLike) {
        const [id] = await raw('provinces').insert({ name, created_by });
        return { id, name, created_by };
      }
      throw new Error('Unsupported DB interface for createProvince');
    },

    // SCHOOLS
    async getAllSchools() {
      if (isSqliteLike) return await raw.all('SELECT * FROM schools');
      if (isKnexLike) return await raw('schools').select();
      throw new Error('Unsupported DB interface for getAllSchools');
    },

    async getSchoolsByProvince(provinceId: number | string) {
      if (isSqliteLike) return await raw.all('SELECT * FROM schools WHERE province_id = ?', [provinceId]);
      if (isKnexLike) return await raw('schools').where({ province_id: provinceId }).select();
      throw new Error('Unsupported DB interface for getSchoolsByProvince');
    },

    async getSchoolById(id: number | string) {
      if (isSqliteLike) return await raw.get('SELECT * FROM schools WHERE id = ?', [id]);
      if (isKnexLike) return await raw('schools').where({ id }).first();
      throw new Error('Unsupported DB interface for getSchoolById');
    },

    async createSchool(payload: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO schools (name, province_id, address, login, password, qr_code, created_by, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payload.name,
            payload.province_id,
            payload.address || null,
            payload.login,
            payload.password,
            payload.qr_code || null,
            payload.created_by || null,
            payload.is_active ? 1 : 0
          ]
        );
        return { id: res.lastID, ...payload };
      }
      if (isKnexLike) {
        const [id] = await raw('schools').insert({ ...payload });
        return { id, ...payload };
      }
      throw new Error('Unsupported DB interface for createSchool');
    },

    // CLASSES
    async getClassesBySchool(schoolId: number | string) {
      if (isSqliteLike) return await raw.all('SELECT * FROM classes WHERE school_id = ?', [schoolId]);
      if (isKnexLike) return await raw('classes').where({ school_id: schoolId }).select();
      throw new Error('Unsupported DB interface for getClassesBySchool');
    },

    async createClass(payload: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO classes (school_id, grade, section, class_admin_id, qr_code, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [payload.school_id, payload.grade, payload.section, payload.class_admin_id || null, payload.qr_code || null, payload.is_active ? 1 : 0]
        );
        return { id: res.lastID, ...payload };
      }
      if (isKnexLike) {
        const [id] = await raw('classes').insert(payload);
        return { id, ...payload };
      }
      throw new Error('Unsupported DB interface for createClass');
    },

    // STUDENTS
    async getStudentsByClass(classId: number | string) {
      if (isSqliteLike) return await raw.all('SELECT * FROM students WHERE class_id = ?', [classId]);
      if (isKnexLike) return await raw('students').where({ class_id: classId }).select();
      throw new Error('Unsupported DB interface for getStudentsByClass');
    },

    async createStudent(payload: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO students (first_name, last_name, class_id, school_id, photo_url, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [payload.first_name, payload.last_name, payload.class_id, payload.school_id, payload.photo_url || null, payload.is_active ? 1 : 0]
        );
        return { id: res.lastID, ...payload };
      }
      if (isKnexLike) {
        const [id] = await raw('students').insert(payload);
        return { id, ...payload };
      }
      throw new Error('Unsupported DB interface for createStudent');
    },

    // ATTENDANCE
    async createAttendance(payload: any) {
      if (isSqliteLike) {
        const res = await raw.run(
          `INSERT INTO attendance (student_id, class_id, school_id, date, period, status, reason, photo_url, marked_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [payload.student_id, payload.class_id, payload.school_id, payload.date, payload.period, payload.status, payload.reason || null, payload.photo_url || null, payload.marked_by || null]
        );
        return { id: res.lastID, ...payload };
      }
      if (isKnexLike) {
        const [id] = await raw('attendance').insert(payload);
        return { id, ...payload };
      }
      throw new Error('Unsupported DB interface for createAttendance');
    },

    async getAttendanceByStudent(studentId: string, startDate: string, endDate: string) {
      if (isSqliteLike) {
        return await raw.all(`SELECT * FROM attendance WHERE student_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC`, [studentId, startDate, endDate]);
      }
      if (isKnexLike) {
        return await raw('attendance').whereBetween('date', [startDate, endDate]).andWhere({ student_id: studentId }).select().orderBy('date', 'desc');
      }
      throw new Error('Unsupported DB interface for getAttendanceByStudent');
    },

    async getAttendanceByClass(classId: string, date: string | null, period: number | null) {
      if (isSqliteLike) {
        if (period != null) {
          return await raw.all(`SELECT * FROM attendance WHERE class_id = ? AND date = ? AND period = ?`, [classId, date, period]);
        }
        return await raw.all(`SELECT * FROM attendance WHERE class_id = ? AND date = ?`, [classId, date]);
      }
      if (isKnexLike) {
        const q = raw('attendance').where({ class_id: classId, date });
        if (period != null) q.andWhere({ period });
        return await q.select();
      }
      throw new Error('Unsupported DB interface for getAttendanceByClass');
    },

    async getAttendanceStats(schoolId: string | number, date: string) {
      // simple example: count total and absent per school
      if (isSqliteLike) {
        const total = await raw.get(`SELECT COUNT(*) as total FROM attendance WHERE school_id = ? AND date = ?`, [schoolId, date]);
        const absent = await raw.get(`SELECT COUNT(*) as absent FROM attendance WHERE school_id = ? AND date = ? AND status = 'absent'`, [schoolId, date]);
        return { total: total?.total || 0, absent: absent?.absent || 0 };
      }
      if (isKnexLike) {
        const [{ count: total }] = await raw('attendance').where({ school_id: schoolId, date }).count('* as count');
        const [{ count: absent }] = await raw('attendance').where({ school_id: schoolId, date, status: 'absent' }).count('* as count');
        return { total: Number(total || 0), absent: Number(absent || 0) };
      }
      throw new Error('Unsupported DB interface for getAttendanceStats');
    },

    async getActivityLogsByUser(userId: string | number, limit = 100) {
      if (isSqliteLike) {
        return await raw.all('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
      }
      if (isKnexLike) {
        return await raw('activity_logs').where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).select();
      }
      throw new Error('Unsupported DB interface for getActivityLogsByUser');
    },

    // Add more helpers as needed...
  };
}
