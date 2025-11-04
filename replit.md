# Maktab Davomat Tizimi / School Attendance System

To'liq maktab davomat boshqaruv tizimi - Telegram bot va React dashboard bilan.

## Loyiha haqida

Bu loyiha maktablar uchun zamonaviy davomat olish va boshqarish tizimi. 3 darajali admin tizimi, ota-onalar uchun avtomatik xabarnomalar, real-time statistika va hisobotlar.

## Texnologiyalar

### Backend
- **Telegram Bot**: Telegraf.js (JavaScript)
- **Web API**: Express.js + Node.js
- **Database**: Multi-adapter (SQLite, MongoDB, PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Real-time**: WebSocket
- **File Upload**: Multer + Sharp

### Frontend (Dashboard)
- **Framework**: React 18 + Vite
- **Routing**: Wouter
- **Styling**: TailwindCSS + Shadcn UI (Professional Blue/White theme)
- **State Management**: TanStack React Query
- **Language**: Uzbek (O'zbek tili)
- **Theme**: Dark/Light mode support
- **Export**: ExcelJS, jsPDF

## Asosiy Imkoniyatlar

### 1. Telegram Bot Funksiyalari
- ✅ Telefon raqami bilan ro'yxatdan o'tish
- ✅ 3 darajali admin tizimi:
  - Katta Admin (viloyat va maktablarni boshqaradi)
  - Maktab Admini (maktabni boshqaradi)
  - Sinf Admini (davomat oladi)
- ✅ Ota-onalar ro'yxati va farzandlarni bog'lash
- ✅ 6 soatlik kunlik davomat (8:00-14:00)
- ✅ Davomat vaqtida rasm yuklash
- ✅ Sababli/sababsiz yo'qlama
- ✅ Kechikkanlar ro'yxati
- ✅ QR kod orqali tez kirish
- ✅ Avtomatik xabarnomalar:
  - Ota-onalarga (farzandi kelmasa)
  - Sinf adminlariga (kunlik xulosa)
  - Maktab adminiga (umumiy statistika)
- ✅ Hisobotlar (kunlik, haftalik, oylik, yillik)

### 2. Web Dashboard Funksiyalari
- ✅ Login/parol autentifikatsiya
- ✅ Foydalanuvchilarni boshqarish (CRUD)
- ✅ Viloyat va maktablarni boshqarish
- ✅ Sinflar va o'quvchilar
- ✅ Real-time davomat ko'rish
- ✅ Rasm galereyasi
- ✅ Grafik va statistika
- ✅ Excel/PDF export
- ✅ Faoliyat tarixi
- ✅ Login urinishlari nazorati
- ✅ Dark/Light mode
- ✅ Responsive dizayn

## Ma'lumotlar bazasi

.env faylida `DB_TYPE` ni sozlang:

```env
# Variantlar: 'file', 'mongodb', 'postgresql'
DB_TYPE=file
```

### SQLite (file)
```env
DB_TYPE=file
SQLITE_DB_PATH=./data/school_attendance.db
```

### MongoDB
```env
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/school_attendance
```

### PostgreSQL
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/school_attendance
```

## Loyiha Tuzilishi

```
/
├── bot/                    # Telegram bot (JavaScript)
│   ├── database/          # Database adapters
│   │   ├── index.js       # Adapter selector
│   │   ├── sqlite.js      # SQLite adapter
│   │   ├── mongodb.js     # MongoDB adapter
│   │   └── postgresql.js  # PostgreSQL adapter
│   ├── handlers/          # Bot handlers
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   │   ├── auth.js        # JWT, password hashing
│   │   ├── qrcode.js      # QR code generation
│   │   └── helpers.js     # Helper functions
│   ├── config.js          # Configuration
│   └── index.js           # Bot entry point
├── client/                # React dashboard
│   └── src/
│       ├── pages/        # All pages (Login, Dashboard, Classes, etc.)
│       ├── components/   # Reusable UI components (Shadcn)
│       ├── contexts/     # React contexts (Auth)
│       ├── lib/          # Utilities (API client, query client)
│       └── hooks/        # Custom hooks
├── server/                # Express API
│   ├── database/          # Database utilities
│   ├── routes.ts          # API routes
│   └── storage.ts         # Storage interface
├── shared/                # Shared types
│   └── schema.ts          # Database schema
├── uploads/               # Uploaded files
│   ├── photos/           # Attendance photos
│   └── qrcodes/          # QR codes
├── data/                  # SQLite database (if using file)
└── .env                   # Environment variables
```

## Database Schema

### Jadvallar (Tables)
1. **users** - Foydalanuvchilar (adminlar, ota-onalar)
2. **provinces** - Viloyatlar
3. **schools** - Maktablar
4. **classes** - Sinflar
5. **students** - O'quvchilar
6. **parent_students** - Ota-ona va farzand aloqasi
7. **attendance** - Davomat
8. **notifications** - Xabarnomalar
9. **activity_logs** - Faoliyat tarixi
10. **login_attempts** - Login urinishlari

## Rollar (Roles)

1. **Super Admin (Katta Admin)**
   - Viloyatlarni boshqaradi
   - Maktablar yaratadi va login/parol beradi
   - Barcha statistikani ko'radi

2. **School Admin (Maktab Admini)**
   - Sinflarni boshqaradi
   - O'quvchilarni qo'shadi/o'chiradi
   - Sinf adminlarini tayinlaydi
   - Maktab statistikasini ko'radi

3. **Class Admin (Sinf Admini)**
   - O'z sinfida davomat oladi
   - O'quvchilarni belgilaydi (kelgan/kelmagan)
   - Rasm yuklaydi
   - Sinf hisobotlarini ko'radi

4. **Parent (Ota-ona)**
   - Farzandlarini bog'laydi
   - Davomat tarixini ko'radi
   - Xabarnomalar oladi

## Davomat Tizimi

### 6 soatlik jadval (Toshkent vaqti)
1. 1-soat: 08:00 - 09:00
2. 2-soat: 09:00 - 10:00
3. 3-soat: 10:00 - 11:00
4. 4-soat: 11:00 - 12:00
5. 5-soat: 12:00 - 13:00
6. 6-soat: 13:00 - 14:00

### Davomat statuslari
- ✅ **Kelgan** (present)
- ❌ **Kelmagan** (absent)
- ⏰ **Kechikkan** (late)
- 📋 **Sababli** (excused)

## Xabarnomalar

### Ota-onalarga
- Farzandi kelmasa darhol xabar
- 3 marta ketma-ket kelmasa maxsus ogohlantirish
- Haftalik/oylik xulosalar

### Sinf Adminlariga
- Kunlik xulosa (kim keldi/kelmadi)
- Davomat olingandan keyin tasdiqlash

### Maktab Adminiga
- Umumiy statistika
- Qaysi sinflarda eng ko'p yo'qlamalar

## Hisobotlar

1. **Kunlik** - Bugungi davomat
2. **Haftalik** - Shu hafta davomati
3. **Oylik** - Shu oy davomati
4. **Yillik** - Butun yil davomati

Export formatlar: Excel, PDF

## O'rnatish va Ishga Tushirish

### 1. Environment o'rnatish
```bash
cp .env.example .env
# .env faylini tahrirlang
```

### 2. Telegram Bot Token
1. [@BotFather](https://t.me/botfather) ga o'ting
2. `/newbot` buyrug'i bilan bot yarating
3. Token'ni `.env` ga qo'shing:
```env
TELEGRAM_BOT_TOKEN=your_token_here
```

### 3. Ishga Tushirish
```bash
npm install
npm run dev
```

## API Endpoints

```
POST   /api/auth/login              - Login
POST   /api/auth/register           - Register
GET    /api/users                   - Get all users
POST   /api/users                   - Create user
PUT    /api/users/:id              - Update user
DELETE /api/users/:id              - Delete user
GET    /api/schools                - Get schools
POST   /api/schools                - Create school
GET    /api/classes/:schoolId      - Get classes by school
POST   /api/attendance             - Mark attendance
GET    /api/attendance/:classId    - Get attendance
GET    /api/reports/:type          - Get reports
GET    /api/statistics/:schoolId   - Get statistics
```

## WebSocket Events

```javascript
// Client → Server
'mark_attendance'    - Davomat belgilash
'join_class'        - Sinfga qo'shilish

// Server → Client
'attendance_update' - Davomat yangilandi
'notification'      - Yangi xabar
'stats_update'      - Statistika yangilandi
```

## Xavfsizlik

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Phone number validation
- ✅ Rate limiting
- ✅ File upload validation
- ✅ SQL injection protection
- ✅ XSS protection

## Backup va Restore

SQLite (.db file):
```bash
cp data/school_attendance.db data/backup_$(date +%Y%m%d).db
```

MongoDB:
```bash
mongodump --uri="mongodb://localhost:27017/school_attendance"
```

PostgreSQL:
```bash
pg_dump school_attendance > backup.sql
```

## Kelajak Rejalar

- [ ] SMS xabarnomalar (Twilio)
- [ ] Email bildirishnomalar
- [ ] 2-bosqichli autentifikatsiya (2FA)
- [ ] Google Sheets export
- [ ] Avtomatik backup
- [ ] Mobil ilova (React Native)
- [ ] Parolni tiklash
- [ ] Kalendar ko'rinishi
- [ ] Sinf xonasi diagrammasi

## Muallif

Maktablar uchun zamonaviy davomat tizimi

## Litsenziya

MIT
