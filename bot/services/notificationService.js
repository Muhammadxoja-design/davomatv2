import cron from 'node-cron';
import getDatabase from '../database/index.js';
import Helpers from '../utils/helpers.js';

class NotificationService {
  constructor(bot) {
    this.bot = bot;
    this.db = getDatabase();
  }

  // Send daily summary to class admins (every day at 15:00)
  scheduleDailySummary() {
    cron.schedule('0 15 * * *', async () => {
      console.log('📊 Sending daily summaries...');
      await this.sendDailySummariesToClassAdmins();
    }, {
      timezone: 'Asia/Tashkent'
    });
  }

  // Send daily summaries
  async sendDailySummariesToClassAdmins() {
    try {
      const classAdmins = await this.db.getUsersByRole('class_admin');
      const today = Helpers.getToday();
      
      for (const admin of classAdmins) {
        if (!admin.telegram_id || !admin.school_id) continue;
        
        const classes = await this.db.getClassesBySchool(admin.school_id);
        const myClass = classes.find(c => c.class_admin_id === admin.id);
        
        if (!myClass) continue;
        
        const students = await this.db.getStudentsByClass(myClass.id);
        const attendance = await this.db.getAttendanceByClass(myClass.id, today, null);
        
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const lateCount = attendance.filter(a => a.status === 'late').length;
        
        const message = 
          `📊 Bugungi kunlik xulosa\n\n` +
          `🏫 Sinf: ${Helpers.getClassName(myClass.grade, myClass.section)}\n` +
          `📅 Sana: ${Helpers.formatDate(today)}\n\n` +
          `👨‍🎓 Jami o'quvchilar: ${students.length}\n` +
          `✅ Kelgan: ${presentCount}\n` +
          `❌ Kelmagan: ${absentCount}\n` +
          `⏰ Kechikkan: ${lateCount}\n\n` +
          `Davomat foizi: ${Helpers.calculateAttendancePercentage(presentCount, students.length)}%`;
        
        try {
          await this.bot.telegram.sendMessage(admin.telegram_id, message);
          
          // Save notification
          await this.db.createNotification({
            user_id: admin.id,
            type: 'daily_summary',
            title: 'Kunlik xulosa',
            message: message,
            data: { date: today, class_id: myClass.id }
          });
        } catch (err) {
          console.error(`Failed to send daily summary to ${admin.first_name}:`, err);
        }
      }
    } catch (error) {
      console.error('Daily summary error:', error);
    }
  }

  // Send weekly summary to parents (every Sunday at 18:00)
  scheduleWeeklySummary() {
    cron.schedule('0 18 * * 0', async () => {
      console.log('📊 Sending weekly summaries to parents...');
      await this.sendWeeklySummariesToParents();
    }, {
      timezone: 'Asia/Tashkent'
    });
  }

  // Send weekly summaries to parents
  async sendWeeklySummariesToParents() {
    try {
      const parents = await this.db.getUsersByRole('parent');
      const { start, end } = Helpers.getDateRange('week');
      
      for (const parent of parents) {
        if (!parent.telegram_id) continue;
        
        const children = await this.db.getStudentsByParent(parent.id);
        
        if (children.length === 0) continue;
        
        let message = `📊 Haftalik davomat xulosasi\n\n`;
        message += `📅 ${Helpers.formatDate(start)} - ${Helpers.formatDate(end)}\n\n`;
        
        for (const child of children) {
          const attendance = await this.db.getAttendanceByStudent(child.id, start, end);
          
          const present = attendance.filter(a => a.status === 'present').length;
          const absent = attendance.filter(a => a.status === 'absent').length;
          const total = attendance.length;
          
          message += `👨‍🎓 ${Helpers.getStudentFullName(child)}\n`;
          message += `   Davomat: ${Helpers.calculateAttendancePercentage(present, total)}%\n`;
          message += `   Kelgan: ${present}, Kelmagan: ${absent}\n\n`;
        }
        
        try {
          await this.bot.telegram.sendMessage(parent.telegram_id, message);
          
          // Save notification
          await this.db.createNotification({
            user_id: parent.id,
            type: 'weekly_report',
            title: 'Haftalik davomat xulosasi',
            message: message,
            data: { start, end }
          });
        } catch (err) {
          console.error(`Failed to send weekly summary to ${parent.first_name}:`, err);
        }
      }
    } catch (error) {
      console.error('Weekly summary error:', error);
    }
  }

  // Check for consecutive absences (runs every day at 16:00)
  scheduleConsecutiveAbsenceCheck() {
    cron.schedule('0 16 * * *', async () => {
      console.log('⚠️ Checking for consecutive absences...');
      await this.checkConsecutiveAbsences();
    }, {
      timezone: 'Asia/Tashkent'
    });
  }

  // Check consecutive absences
  async checkConsecutiveAbsences() {
    try {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      
      const start = threeDaysAgo.toISOString().split('T')[0];
      const end = today.toISOString().split('T')[0];
      
      // Get all students
      const schools = await this.db.getAllSchools();
      
      for (const school of schools) {
        const classes = await this.db.getClassesBySchool(school.id);
        
        for (const cls of classes) {
          const students = await this.db.getStudentsByClass(cls.id);
          
          for (const student of students) {
            const attendance = await this.db.getAttendanceByStudent(student.id, start, end);
            
            // Check if absent for 3 consecutive days
            const recentAbsences = attendance
              .filter(a => a.status === 'absent')
              .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (recentAbsences.length >= 3) {
              // Alert parents
              const parents = await this.db.getParentsByStudent(student.id);
              
              for (const parent of parents) {
                if (!parent.telegram_id) continue;
                
                const message = 
                  `⚠️ Muhim xabar!\n\n` +
                  `Farzandingiz ${Helpers.getStudentFullName(student)} oxirgi 3 kun davomida darsga kelmadi.\n\n` +
                  `Iltimos, maktab admini bilan bog'laning.`;
                
                try {
                  await this.bot.telegram.sendMessage(parent.telegram_id, message);
                  
                  await this.db.createNotification({
                    user_id: parent.id,
                    type: 'absence_alert',
                    title: 'Ketma-ket yo\'qlamalar',
                    message: message,
                    data: { student_id: student.id, consecutive_days: recentAbsences.length }
                  });
                } catch (err) {
                  console.error(`Failed to send consecutive absence alert:`, err);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Consecutive absence check error:', error);
    }
  }

  // Start all scheduled tasks
  startAll() {
    console.log('🔔 Starting notification services...');
    this.scheduleDailySummary();
    this.scheduleWeeklySummary();
    this.scheduleConsecutiveAbsenceCheck();
    console.log('✅ All notification services started!');
  }
}

export default NotificationService;
