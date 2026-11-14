require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');

const secret = process.env.SESSION_SECRET || '';
if (secret.length < 32) {
  console.error('ต้องตั้งค่า SESSION_SECRET (อย่างน้อย 32 ตัวอักษร) ในไฟล์ .env — รัน: npm run init-env');
  process.exit(1);
}

const db = require('./database/database');
const SqliteStore = require('./lib/sessionStore');
const csrf = require('./middleware/csrf');

const app = express();
const prod = process.env.NODE_ENV === 'production';
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  hsts: prod,
}));
app.use(express.json({ limit: '100kb' }));

app.use(session({
  name: 'rtm.sid',
  secret,
  store: new SqliteStore(db),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true' },
}));

app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', csrf.verify);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ API ที่ร้องขอ' }));

// หน้า Admin: ตรวจสิทธิ์ก่อนส่งไฟล์ (API ฝั่งหลังบ้านตรวจสิทธิ์ซ้ำทุกครั้งอยู่แล้ว)
app.get(['/admin', '/admin.html'], (req, res, next) => {
  const u = req.session.userId &&
    db.prepare('SELECT role, status FROM users WHERE id=?').get(req.session.userId);
  if (!u || u.status !== 'APPROVED' || !['ADMIN', 'SUPER_ADMIN'].includes(u.role)) {
    return res.redirect('/login.html?next=admin');
  }
  if (req.path === '/admin') return res.redirect('/admin.html');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
});

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
  console.log(`RAK THAI Mail (DEMO / SIMULATION ONLY) → http://localhost:${port}`);
});
