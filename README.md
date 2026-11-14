# RAK THAI Mail

> **DEMO / SIMULATION ONLY** — ต้นแบบเพื่อการสาธิต ไม่ใช่ผู้ให้บริการอีเมลจริงหรือหน่วยงานรัฐบาล

เว็บไซต์อีเมลสไตล์ Gmail สำหรับโดเมน `@rakthai.dis.th` พร้อมระบบสมัครสมาชิก อนุมัติโดยผู้ดูแล และแผงควบคุม Admin
(Node.js + Express + SQLite, Session-based Auth, bcrypt)

## ข้อกำหนด
- Node.js 18 ขึ้นไป (แนะนำ 20 LTS หรือ 22 LTS)
- ใช้อินเทอร์เน็ตตอน `npm install` (ดาวน์โหลด `bcrypt` และ `better-sqlite3` ซึ่งเป็นโมดูล native)

## ติดตั้งและเริ่มใช้งาน
```bash
npm install                 # ติดตั้ง Dependencies
npm run init-env            # สร้าง .env พร้อม SESSION_SECRET แบบสุ่ม
npm run create-admin        # สร้าง Super Admin คนแรก (ถามชื่อผู้ใช้/รหัสผ่านแบบไม่แสดงตัวอักษร)
npm start                   # เปิดเซิร์ฟเวอร์ที่ http://localhost:3000
```
โหมดพัฒนา (รีสตาร์ทอัตโนมัติ): `npm run dev`

## ตั้งค่า `.env`
| ตัวแปร | ความหมาย |
|---|---|
| `PORT` | พอร์ตของเซิร์ฟเวอร์ (ค่าเริ่มต้น 3000) |
| `NODE_ENV` | `development` หรือ `production` (production เปิด HSTS) |
| `SESSION_SECRET` | สตริงสุ่มอย่างน้อย 32 ตัวอักษร **จำเป็น** ไม่มีค่านี้เซิร์ฟเวอร์จะไม่เริ่มทำงาน |
| `MAIL_DOMAIN` | โดเมนอีเมล (ค่าเริ่มต้น `rakthai.dis.th`) |
| `DB_PATH` | ที่เก็บไฟล์ SQLite |
| `COOKIE_SECURE` | `true` เมื่อใช้ HTTPS |
| `TRUST_PROXY` | `true` เมื่ออยู่หลัง Reverse Proxy |
| `MAX_UPLOAD_MB` | ขนาดไฟล์แนบสูงสุดต่อไฟล์ (MB) |
| `BCRYPT_ROUNDS` | ค่า cost ของ bcrypt (ค่าเริ่มต้น 12) |

## การสร้างบัญชี Admin เริ่มต้นอย่างปลอดภัย
ไม่มีรหัสผ่าน Admin ตายตัวในซอร์สโค้ด ให้ใช้คำสั่ง `npm run create-admin` บนเครื่องเซิร์ฟเวอร์เท่านั้น
(หรือส่งผ่านตัวแปร `ADMIN_USERNAME` / `ADMIN_PASSWORD` ในสคริปต์ติดตั้ง) บัญชีที่ได้เป็น `SUPER_ADMIN`
จากนั้นเข้าสู่ระบบที่ `/login.html` แล้วเปิด `/admin.html`
Super Admin สร้างและให้สิทธิ์ผู้ดูแลระบบ (ADMIN) แก่บัญชีอื่นได้จากแผง Admin

## ขั้นตอนอนุมัติสมาชิก
1. ประชาชนสมัครที่ `/register.html` → สถานะ **PENDING**
2. Admin เปิด Dashboard → ตรวจสอบข้อมูล → **อนุมัติ (APPROVED)** หรือ **ปฏิเสธ (REJECTED)** พร้อมเหตุผล
3. เฉพาะ APPROVED เข้าสู่ระบบได้ — **SUSPENDED** ใช้งานไม่ได้ทันที (เซสชันถูกยกเลิก)

## ลืมรหัสผ่าน
ระบบสาธิตไม่ส่งอีเมลภายนอก ผู้ใช้กดขอรีเซ็ต → Admin เห็นคำขอในเมนู "รีเซ็ตรหัสผ่าน" → ออกรหัสผ่านชั่วคราว (แสดงครั้งเดียว)
แล้วแจ้งผู้ใช้ผ่านช่องทางอื่น ผู้ใช้ต้องตั้งรหัสผ่านใหม่ก่อนใช้งาน บัญชีที่ Admin สร้างให้ก็ต้องเปลี่ยนรหัสผ่านครั้งแรกเช่นกัน

## โครงสร้างโปรเจกต์
```
server.js              จุดเริ่มระบบ: Helmet(CSP), Session, CSRF, Routes
database/              schema.sql + database.js (SQLite)
lib/                   validators, sessionStore (เก็บ session ใน SQLite), wrap
middleware/            auth.js, admin.js, csrf.js
routes/                auth.js, users.js, emails.js, admin.js
scripts/               init-env.js, create-admin.js
public/                หน้าเว็บ (HTML/CSS/JS ฝั่งผู้ใช้) + admin.html
uploads/               ไฟล์แนบ (ชื่อไฟล์สุ่ม ไม่เปิดให้เข้าถึงโดยตรง)
```
ตาราง: `users`, `emails`, `email_recipients` (กล่องจดหมายรายผู้ใช้), `attachments`, `sessions`, `admin_logs`, `password_reset_requests`

## มาตรการความปลอดภัย
- bcrypt hash รหัสผ่าน; ไม่มีรหัสผ่านตายตัว; นโยบายรหัสผ่านขั้นต่ำ 10 ตัว (อักษร+ตัวเลข)
- SQL Injection: ใช้ prepared statements ทั้งหมด
- XSS: หน้าเว็บสร้าง DOM ด้วย `textContent` (ไม่ใช้ innerHTML กับข้อมูลผู้ใช้) + CSP `script-src 'self'` ไม่อนุญาต inline script
- CSRF: โทเค็นใน session ต้องส่งผ่านหัว `X-CSRF-Token` ทุกคำขอที่ไม่ใช่ GET + คุกกี้ `SameSite=Lax`
- Session: คุกกี้ `HttpOnly`, regenerate หลังล็อกอิน, ตรวจสถานะบัญชีจากฐานข้อมูลทุกคำขอ, ยกเลิกเซสชันเมื่อระงับ/รีเซ็ต/เปลี่ยนรหัสผ่าน
- จำกัดการล็อกอิน: จำกัดต่อ IP และล็อกบัญชี 15 นาทีเมื่อผิด 5 ครั้งติดกัน
- สิทธิ์: `/api/admin/*` ตรวจบทบาทที่ Backend ทุกครั้ง; ผู้ดูแลทั่วไปจัดการบัญชีผู้ดูแลอื่นไม่ได้; ทุกการกระทำถูกบันทึกใน `admin_logs`
- แยกกล่องจดหมาย: ทุก query ผูกกับ `user_id` ของผู้ล็อกอิน; BCC เห็นเฉพาะผู้ส่งและผู้รับรายนั้น
- ไฟล์แนบ: อนุญาต pdf/png/jpg/gif/txt/docx/xlsx/pptx ≤ 5 MB, ≤ 5 ไฟล์/ครั้ง, ตรวจลายเซ็นไฟล์จริง, เก็บชื่อสุ่ม, ดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์เท่านั้น

## ข้อจำกัดของรุ่นแรก
- ส่ง–รับข้อความได้เฉพาะระหว่างบัญชี `@rakthai.dis.th` ภายในระบบ **ไม่สามารถส่งถึง Gmail/Outlook ได้** เพราะยังไม่มี Mail Server และ DNS/MX จริง
- การส่งต่อ (Forward) ไม่คัดลอกไฟล์แนบเดิม
- **Phase 2 (ยังไม่รวม):** รับ–ส่งอีเมลภายนอก (SMTP/IMAP, SPF/DKIM/DMARC, MX), ส่งอีเมลรีเซ็ตรหัสผ่านอัตโนมัติ, 2FA
- ก่อนใช้งานจริงบนอินเทอร์เน็ต: ใช้ HTTPS, ตั้ง `COOKIE_SECURE=true`, `NODE_ENV=production`, และสำรองไฟล์ฐานข้อมูล/โฟลเดอร์ `uploads`
