import { Telegraf, Markup } from 'telegraf';
import config from './config.js';
import getDatabase from './database/index.js';
import AuthUtils from './utils/auth.js';
import Helpers from './utils/helpers.js';

// Initialize bot
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// User sessions (in-memory storage for conversation state)
const sessions = new Map();

let db;

// Get or create session
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }
  return sessions.get(userId);
}

// Clear session
function clearSession(userId) {
  sessions.delete(userId);
}

// Main menu based on role
function getMainMenu(role) {
  const buttons = [];

  if (role === config.ROLES.SUPER_ADMIN) {
    buttons.push(
      ['🏛 Viloyatlar', '🏫 Maktablar'],
      ['👥 Foydalanuvchilar', '📊 Statistika'],
      ['⚙️ Sozlamalar']
    );
  } else if (role === config.ROLES.SCHOOL_ADMIN) {
    buttons.push(
      ['🎓 Sinflar', '👨‍🎓 O\'quvchilar'],
      ['👥 Foydalanuvchilar', '📊 Statistika'],
      ['📋 Hisobotlar']
    );
  } else if (role === config.ROLES.CLASS_ADMIN) {
    buttons.push(
      ['📝 Davomat olish', '📊 Hisobotlar'],
      ['👨‍🎓 O\'quvchilar', '📸 Rasmlar']
    );
  } else if (role === config.ROLES.PARENT) {
    buttons.push(
      ['👨‍👩‍👧 Farzandlarim', '📊 Davomat tarixi'],
      ['🔔 Xabarnomalar']
    );
  }

  return Markup.keyboard(buttons).resize();
}

// Start command
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    // Check if user exists
    let user = await db.getUserByTelegramId(telegramId);
    
    if (user) {
      // Existing user
      await ctx.reply(
        `Xush kelibsiz, ${user.first_name}! 👋\n\n` +
        `Rol: ${Helpers.translateRole(user.role)}\n\n` +
        `Kerakli bo'limni tanlang:`,
        getMainMenu(user.role)
      );
    } else {
      // New user - registration
      await ctx.reply(
        `🎓 Maktab Davomat Tizimiga xush kelibsiz!\n\n` +
        `Ro'yxatdan o'tish uchun telefon raqamingizni yuboring.\n` +
        `Format: +998901234567`,
        Markup.keyboard([
          [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
        ]).resize()
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

// Contact (phone number) handler
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = ctx.from.id.toString();
  
  try {
    // Validate phone number
    const phoneNumber = AuthUtils.formatPhoneNumber(contact.phone_number);
    
    if (!AuthUtils.validatePhoneNumber(phoneNumber)) {
      return await ctx.reply('❌ Telefon raqam noto\'g\'ri formatda. Iltimos, +998XXXXXXXXX formatida kiriting.');
    }
    
    // Check if phone already registered
    let user = await db.getUserByPhone(phoneNumber);
    
    if (user) {
      // Link telegram ID to existing user
      if (!user.telegram_id) {
        await db.updateUser(user.id, { telegram_id: telegramId });
        user = await db.getUserById(user.id);
        
        await ctx.reply(
          `✅ Muvaffaqiyatli bog'landi!\n\n` +
          `Ism: ${user.first_name} ${user.last_name || ''}\n` +
          `Rol: ${Helpers.translateRole(user.role)}`,
          getMainMenu(user.role)
        );
      } else {
        await ctx.reply('⚠️ Bu telefon raqam allaqachon ro\'yxatdan o\'tgan.');
      }
    } else {
      // New user - ask for name
      const session = getSession(telegramId);
      session.phoneNumber = phoneNumber;
      session.step = 'awaiting_name';
      
      await ctx.reply(
        '👤 Ismingizni kiriting:',
        Markup.removeKeyboard()
      );
    }
  } catch (error) {
    console.error('Contact handler error:', error);
    await ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

// Text message handler
bot.on('text', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const text = ctx.message.text;
  const session = getSession(telegramId);
  
  try {
    // Handle registration flow
    if (session.step === 'awaiting_name') {
      const nameParts = text.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      session.firstName = firstName;
      session.lastName = lastName;
      session.step = 'awaiting_role';
      
      await ctx.reply(
        '👔 Rolingizni tanlang:',
        Markup.keyboard([
          ['👨‍🏫 Sinf Admini'],
          ['👨‍👩‍👧 Ota-ona']
        ]).resize()
      );
      return;
    }
    
    if (session.step === 'awaiting_role') {
      let role;
      if (text.includes('Sinf Admini')) {
        role = config.ROLES.CLASS_ADMIN;
      } else if (text.includes('Ota-ona')) {
        role = config.ROLES.PARENT;
      } else {
        await ctx.reply('❌ Noto\'g\'ri tanlov. Iltimos, tugmalardan foydalaning.');
        return;
      }
      
      // Create user
      const newUser = await db.createUser({
        telegram_id: telegramId,
        phone_number: session.phoneNumber,
        first_name: session.firstName,
        last_name: session.lastName,
        role: role,
        is_active: true
      });
      
      // Log activity
      await db.createActivityLog({
        user_id: newUser.id,
        action: 'register',
        details: { via: 'telegram', role }
      });
      
      clearSession(telegramId);
      
      await ctx.reply(
        `✅ Ro'yxatdan o'tdingiz!\n\n` +
        `Ism: ${newUser.first_name} ${newUser.last_name || ''}\n` +
        `Rol: ${Helpers.translateRole(newUser.role)}\n\n` +
        `Maktab/Sinf administratori siz bilan bog'lanadi.`,
        getMainMenu(role)
      );
      return;
    }
    
    // Get current user
    const user = await db.getUserByTelegramId(telegramId);
    if (!user) {
      await ctx.reply('❌ Siz ro\'yxatdan o\'tmagansiz. /start buyrug\'ini yuboring.');
      return;
    }
    
    // Handle menu commands
    await handleMenuCommand(ctx, user, text);
    
  } catch (error) {
    console.error('Text handler error:', error);
    await ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

// Handle menu commands
async function handleMenuCommand(ctx, user, command) {
  const telegramId = ctx.from.id.toString();
  
  // Super Admin commands
  if (user.role === config.ROLES.SUPER_ADMIN) {
    if (command === '🏛 Viloyatlar') {
      await handleProvinces(ctx, user);
    } else if (command === '🏫 Maktablar') {
      await handleSchools(ctx, user);
    } else if (command === '👥 Foydalanuvchilar') {
      await handleUsers(ctx, user);
    } else if (command === '📊 Statistika') {
      await handleStatistics(ctx, user);
    }
  }
  
  // School Admin commands
  else if (user.role === config.ROLES.SCHOOL_ADMIN) {
    if (command === '🎓 Sinflar') {
      await handleClasses(ctx, user);
    } else if (command === '👨‍🎓 O\'quvchilar') {
      await handleStudents(ctx, user);
    } else if (command === '📋 Hisobotlar') {
      await handleReports(ctx, user);
    }
  }
  
  // Class Admin commands
  else if (user.role === config.ROLES.CLASS_ADMIN) {
    if (command === '📝 Davomat olish') {
      await handleTakeAttendance(ctx, user);
    } else if (command === '📊 Hisobotlar') {
      await handleReports(ctx, user);
    } else if (command === '👨‍🎓 O\'quvchilar') {
      await handleMyStudents(ctx, user);
    }
  }
  
  // Parent commands
  else if (user.role === config.ROLES.PARENT) {
    if (command === '👨‍👩‍👧 Farzandlarim') {
      await handleMyChildren(ctx, user);
    } else if (command === '📊 Davomat tarixi') {
      await handleChildrenAttendance(ctx, user);
    } else if (command === '🔔 Xabarnomalar') {
      await handleNotifications(ctx, user);
    }
  }
}

// Handler: Provinces (Super Admin)
async function handleProvinces(ctx, user) {
  const provinces = await db.getAllProvinces?.() || [];
  
  if (provinces.length === 0) {
    await ctx.reply(
      '📋 Viloyatlar ro\'yxati bo\'sh.\n\n' +
      'Yangi viloyat qo\'shish uchun:\n' +
      '/add_province <viloyat nomi>'
    );
  } else {
    let message = '🏛 Viloyatlar ro\'yxati:\n\n';
    provinces.forEach((p, i) => {
      message += `${i + 1}. ${p.name}\n`;
    });
    message += '\n/add_province <nom> - Yangi viloyat qo\'shish';
    await ctx.reply(message);
  }
}

// Handler: Schools (Super Admin)
async function handleSchools(ctx, user) {
  const schools = await db.getAllSchools();
  
  if (schools.length === 0) {
    await ctx.reply('📋 Maktablar ro\'yxati bo\'sh.');
  } else {
    let message = '🏫 Maktablar ro\'yxati:\n\n';
    schools.slice(0, 10).forEach((s, i) => {
      message += `${i + 1}. ${s.name}\n`;
      message += `   Login: ${s.login}\n`;
      message += `   Holati: ${s.is_active ? '✅ Faol' : '❌ Nofaol'}\n\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: Users
async function handleUsers(ctx, user) {
  let users;
  if (user.role === config.ROLES.SUPER_ADMIN) {
    users = await db.getAllUsers();
  } else if (user.role === config.ROLES.SCHOOL_ADMIN && user.school_id) {
    users = await db.getUsersBySchool(user.school_id);
  } else {
    await ctx.reply('❌ Sizda bu bo\'limga kirish huquqi yo\'q.');
    return;
  }
  
  if (users.length === 0) {
    await ctx.reply('📋 Foydalanuvchilar ro\'yxati bo\'sh.');
  } else {
    let message = '👥 Foydalanuvchilar:\n\n';
    users.slice(0, 10).forEach((u, i) => {
      message += `${i + 1}. ${u.first_name} ${u.last_name || ''}\n`;
      message += `   Tel: ${u.phone_number}\n`;
      message += `   Rol: ${Helpers.translateRole(u.role)}\n\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: Take Attendance (Class Admin)
async function handleTakeAttendance(ctx, user) {
  const session = getSession(ctx.from.id.toString());
  
  // Get class admin's class
  const classes = await db.getClassesBySchool(user.school_id || '');
  const myClass = classes.find(c => c.class_admin_id === user.id);
  
  if (!myClass) {
    await ctx.reply('❌ Siz hali birorta sinfga biriktirilmagansiz. Maktab admini bilan bog\'laning.');
    return;
  }
  
  // Get current period
  const currentPeriod = Helpers.getCurrentPeriod();
  if (!currentPeriod) {
    await ctx.reply('⏰ Hozir maktab vaqti emas. Davomat faqat 08:00-14:00 oralig\'ida olinadi.');
    return;
  }
  
  // Check if attendance already taken for this period today
  const today = Helpers.getToday();
  const existingAttendance = await db.getTodayAttendanceByClass(myClass.id, currentPeriod);
  
  if (existingAttendance && existingAttendance.length > 0) {
    await ctx.reply(
      `⚠️ ${Helpers.getClassName(myClass.grade, myClass.section)} sinfi uchun ${currentPeriod}-soat davomati allaqachon olingan.\n\n` +
      'Hisobotlarni ko\'rish uchun "📊 Hisobotlar" tugmasini bosing.'
    );
    return;
  }
  
  // Get students
  const students = await db.getStudentsByClass(myClass.id);
  
  if (students.length === 0) {
    await ctx.reply('❌ Sinfingizda hali o\'quvchilar yo\'q.');
    return;
  }
  
  session.attendanceClass = myClass;
  session.attendancePeriod = currentPeriod;
  session.attendanceStudents = students;
  session.attendanceMarks = {};
  session.currentStudentIndex = 0;
  session.step = 'taking_attendance';
  
  await showNextStudent(ctx, user);
}

// Show next student for attendance
async function showNextStudent(ctx, user) {
  const session = getSession(ctx.from.id.toString());
  const { attendanceStudents, currentStudentIndex } = session;
  
  if (currentStudentIndex >= attendanceStudents.length) {
    // All students marked - ask for photo
    await ctx.reply(
      '✅ Barcha o\'quvchilar belgilandi!\n\n' +
      '📸 Iltimos, sinf rasmini yuboring:',
      Markup.keyboard([['⏭ Rasmni o\'tkazib yuborish']]).resize()
    );
    session.step = 'awaiting_photo';
    return;
  }
  
  const student = attendanceStudents[currentStudentIndex];
  
  await ctx.reply(
    `👨‍🎓 ${Helpers.getStudentFullName(student)}\n\n` +
    `${currentStudentIndex + 1} / ${attendanceStudents.length}`,
    Markup.keyboard([
      ['✅ Kelgan', '❌ Kelmagan'],
      ['⏰ Kechikkan', '📋 Sababli'],
      ['⏭ Keyingisi']
    ]).resize()
  );
}

// Handler: My Students (Class Admin)
async function handleMyStudents(ctx, user) {
  const classes = await db.getClassesBySchool(user.school_id || '');
  const myClass = classes.find(c => c.class_admin_id === user.id);
  
  if (!myClass) {
    await ctx.reply('❌ Siz hali birorta sinfga biriktirilmagansiz.');
    return;
  }
  
  const students = await db.getStudentsByClass(myClass.id);
  
  if (students.length === 0) {
    await ctx.reply('📋 Sinfingizda hali o\'quvchilar yo\'q.');
  } else {
    let message = `👨‍🎓 ${Helpers.getClassName(myClass.grade, myClass.section)} sinfi o\'quvchilari:\n\n`;
    students.forEach((s, i) => {
      message += `${i + 1}. ${Helpers.getStudentFullName(s)}\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: My Children (Parent)
async function handleMyChildren(ctx, user) {
  const children = await db.getStudentsByParent(user.id);
  
  if (children.length === 0) {
    await ctx.reply(
      '👨‍👩‍👧 Siz hali farzandlaringizni bog\'lamagansiz.\n\n' +
      'Maktab admini bilan bog\'laning.'
    );
  } else {
    let message = '👨‍👩‍👧 Farzandlarim:\n\n';
    children.forEach((child, i) => {
      message += `${i + 1}. ${Helpers.getStudentFullName(child)}\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: Reports
async function handleReports(ctx, user) {
  await ctx.reply(
    '📊 Hisobot turini tanlang:',
    Markup.keyboard([
      ['📅 Bugungi', '📆 Haftalik'],
      ['📋 Oylik', '📖 Yillik'],
      ['🔙 Orqaga']
    ]).resize()
  );
}

// Handler: Statistics
async function handleStatistics(ctx, user) {
  const today = Helpers.getToday();
  
  if (user.school_id) {
    const stats = await db.getAttendanceStats(user.school_id, today);
    
    await ctx.reply(
      `📊 Bugungi statistika:\n\n` +
      `Jami o'quvchilar: ${stats.total_students}\n` +
      `✅ Kelgan: ${stats.present}\n` +
      `❌ Kelmagan: ${stats.absent}\n` +
      `⏰ Kechikkan: ${stats.late}\n` +
      `📋 Sababli: ${stats.excused}\n\n` +
      `Davomat foizi: ${Helpers.calculateAttendancePercentage(stats.present, stats.total_students)}%`
    );
  } else {
    await ctx.reply('📊 Umumiy statistika hozircha mavjud emas.');
  }
}

// Handler: Notifications
async function handleNotifications(ctx, user) {
  const notifications = await db.getNotificationsByUser(user.id);
  
  if (notifications.length === 0) {
    await ctx.reply('🔔 Sizda yangi xabarnomalar yo\'q.');
  } else {
    let message = '🔔 Xabarnomalar:\n\n';
    notifications.slice(0, 5).forEach((n, i) => {
      const readIcon = n.is_read ? '✅' : '🔔';
      message += `${readIcon} ${n.title}\n`;
      message += `${n.message}\n`;
      message += `${Helpers.formatDate(n.sent_at)}\n\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: Classes (School Admin)
async function handleClasses(ctx, user) {
  if (!user.school_id) {
    await ctx.reply('❌ Siz hali maktabga biriktirilmagansiz.');
    return;
  }
  
  const classes = await db.getClassesBySchool(user.school_id);
  
  if (classes.length === 0) {
    await ctx.reply('📋 Sinflar ro\'yxati bo\'sh.');
  } else {
    let message = '🎓 Sinflar ro\'yxati:\n\n';
    classes.forEach((c, i) => {
      message += `${i + 1}. ${Helpers.getClassName(c.grade, c.section)}\n`;
    });
    await ctx.reply(message);
  }
}

// Handler: Students (School Admin)
async function handleStudents(ctx, user) {
  if (!user.school_id) {
    await ctx.reply('❌ Siz hali maktabga biriktirilmagansiz.');
    return;
  }
  
  const classes = await db.getClassesBySchool(user.school_id);
  let totalStudents = 0;
  
  for (const cls of classes) {
    const students = await db.getStudentsByClass(cls.id);
    totalStudents += students.length;
  }
  
  await ctx.reply(
    `👨‍🎓 Maktabdagi jami o'quvchilar: ${totalStudents}\n` +
    `Sinflar soni: ${classes.length}`
  );
}

// Handler: Children Attendance (Parent)
async function handleChildrenAttendance(ctx, user) {
  const children = await db.getStudentsByParent(user.id);
  
  if (children.length === 0) {
    await ctx.reply('👨‍👩‍👧 Siz hali farzandlaringizni bog\'lamagansiz.');
    return;
  }
  
  const today = Helpers.getToday();
  const { start, end } = Helpers.getDateRange('week');
  
  for (const child of children) {
    const attendance = await db.getAttendanceByStudent(child.id, start, end);
    
    const present = attendance.filter(a => a.status === 'present').length;
    const total = attendance.length;
    const percentage = Helpers.calculateAttendancePercentage(present, total);
    
    await ctx.reply(
      `👨‍🎓 ${Helpers.getStudentFullName(child)}\n\n` +
      `Bu hafta davomati:\n` +
      `Davomat foizi: ${percentage}%\n` +
      `Jami darslar: ${total}\n` +
      `Kelgan: ${present}\n` +
      `Kelmagan: ${attendance.filter(a => a.status === 'absent').length}`
    );
  }
}

// Photo handler
bot.on('photo', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getSession(telegramId);
  
  if (session.step === 'awaiting_photo') {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    session.attendancePhoto = photo.file_id;
    
    await finalizeAttendance(ctx);
  }
});

// Finalize attendance
async function finalizeAttendance(ctx) {
  const telegramId = ctx.from.id.toString();
  const session = getSession(telegramId);
  const user = await db.getUserByTelegramId(telegramId);
  
  const { attendanceClass, attendancePeriod, attendanceStudents, attendanceMarks, attendancePhoto } = session;
  const today = Helpers.getToday();
  
  try {
    // Save all attendance records
    for (const student of attendanceStudents) {
      const status = attendanceMarks[student.id] || 'absent';
      
      await db.createAttendance({
        student_id: student.id,
        class_id: attendanceClass.id,
        school_id: user.school_id,
        date: today,
        period: attendancePeriod,
        status: status,
        photo_url: attendancePhoto || null,
        marked_by: user.id
      });
    }
    
    // Send notifications to parents of absent students
    for (const student of attendanceStudents) {
      const status = attendanceMarks[student.id] || 'absent';
      
      if (status === 'absent') {
        const parents = await db.getParentsByStudent(student.id);
        
        for (const parent of parents) {
          await db.createNotification({
            user_id: parent.id,
            type: 'absence_alert',
            title: '⚠️ Farzandingiz darsga kelmadi',
            message: `${Helpers.getStudentFullName(student)} bugun ${attendancePeriod}-soat darsga kelmadi.`,
            data: { student_id: student.id, date: today, period: attendancePeriod }
          });
          
          // Send telegram message if parent has telegram_id
          if (parent.telegram_id) {
            try {
              await bot.telegram.sendMessage(
                parent.telegram_id,
                `⚠️ Farzandingiz darsga kelmadi!\n\n` +
                `👨‍🎓 ${Helpers.getStudentFullName(student)}\n` +
                `📅 Sana: ${Helpers.formatDate(today)}\n` +
                `⏰ Soat: ${attendancePeriod}-soat\n` +
                `🏫 Sinf: ${Helpers.getClassName(attendanceClass.grade, attendanceClass.section)}`
              );
            } catch (err) {
              console.error('Failed to send notification:', err);
            }
          }
        }
      }
    }
    
    // Log activity
    await db.createActivityLog({
      user_id: user.id,
      action: 'mark_attendance',
      details: {
        class_id: attendanceClass.id,
        period: attendancePeriod,
        date: today,
        students_count: attendanceStudents.length
      }
    });
    
    clearSession(telegramId);
    
    const absentCount = Object.values(attendanceMarks).filter(s => s === 'absent').length;
    
    await ctx.reply(
      `✅ Davomat muvaffaqiyatli saqlandi!\n\n` +
      `📅 Sana: ${Helpers.formatDate(today)}\n` +
      `⏰ Soat: ${attendancePeriod}-soat\n` +
      `🏫 Sinf: ${Helpers.getClassName(attendanceClass.grade, attendanceClass.section)}\n` +
      `👨‍🎓 Jami: ${attendanceStudents.length}\n` +
      `❌ Kelmagan: ${absentCount}`,
      getMainMenu(user.role)
    );
    
  } catch (error) {
    console.error('Finalize attendance error:', error);
    await ctx.reply('❌ Davomat saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
}

// Callback query handler
bot.on('callback_query', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const session = getSession(telegramId);
  const data = ctx.callbackQuery.data;
  
  if (session.step === 'taking_attendance') {
    const [action, studentId] = data.split(':');
    
    if (['present', 'absent', 'late', 'excused'].includes(action)) {
      session.attendanceMarks[studentId] = action;
      session.currentStudentIndex++;
      
      await ctx.answerCbQuery(`✅ ${Helpers.translateStatus(action)}`);
      await showNextStudent(ctx, await db.getUserByTelegramId(telegramId));
    }
  }
});

// Error handler
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Xatolik yuz berdi. Iltimos, /start buyrug\'ini yuboring.');
});

// Launch bot
async function startBot() {
  try {
    db = await getDatabase(); 
    console.log('DB tayyor!');

    await bot.launch();
    console.log('Bot ishga tushdi!');
  } catch (error) {
    console.error('Bot ishga tushurishda xatolik:', error);
    process.exit(1);
  }
}

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Export

startBot();
export default { bot, startBot };
