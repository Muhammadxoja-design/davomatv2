import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Foydalanuvchilar jadvali
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").unique(),
  phoneNumber: varchar("phone_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  role: text("role").notNull(), // 'super_admin', 'school_admin', 'class_admin', 'parent'
  password: text("password"), // Faqat web dashboard uchun
  provinceId: varchar("province_id"),
  schoolId: varchar("school_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Viloyatlar jadvali
export const provinces = pgTable("provinces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Maktablar jadvali
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provinceId: varchar("province_id").notNull(),
  address: text("address"),
  login: varchar("login").notNull().unique(),
  password: text("password").notNull(),
  qrCode: text("qr_code"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sinflar jadvali
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull(),
  grade: integer("grade").notNull(), // 1-11
  section: text("section").notNull(), // A, B, C, D
  classAdminId: varchar("class_admin_id"),
  qrCode: text("qr_code"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// O'quvchilar jadvali
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  classId: varchar("class_id").notNull(),
  schoolId: varchar("school_id").notNull(),
  photoUrl: text("photo_url"),
  dateOfBirth: timestamp("date_of_birth"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ota-onalar va o'quvchilar aloqasi
export const parentStudents = pgTable("parent_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(),
  studentId: varchar("student_id").notNull(),
  relationship: text("relationship"), // 'father', 'mother', 'guardian'
  createdAt: timestamp("created_at").defaultNow(),
});

// Davomat jadvali
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  schoolId: varchar("school_id").notNull(),
  date: timestamp("date").notNull(),
  period: integer("period").notNull(), // 1-6 (soat)
  status: text("status").notNull(), // 'present', 'absent', 'late', 'excused'
  reason: text("reason"), // Sababli bo'lsa
  photoUrl: text("photo_url"), // Davomat vaqtidagi rasm
  markedBy: varchar("marked_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Xabarnomalar jadvali
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'daily_summary', 'absence_alert', 'weekly_report'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Qo'shimcha ma'lumotlar
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Faoliyat tarixi
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // 'login', 'mark_attendance', 'create_user', etc.
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Login urinishlari
export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number"),
  ipAddress: text("ip_address"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProvinceSchema = createInsertSchema(provinces).omit({ id: true, createdAt: true });
export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParentStudentSchema = createInsertSchema(parentStudents).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, sentAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({ id: true, createdAt: true });

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProvince = z.infer<typeof insertProvinceSchema>;
export type Province = typeof provinces.$inferSelect;

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertParentStudent = z.infer<typeof insertParentStudentSchema>;
export type ParentStudent = typeof parentStudents.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
