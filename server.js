if (process.env.RAILWAY_ENVIRONMENT) {
  console.log("🚀 Railway 환경 감지됨 - .env 로드 생략");
  process.env.DOTENV_KEY_MISSING = "1";
} else {
  require("dotenv").config();
  console.log("🌱 로컬 환경 - .env 로드 완료");
}

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const cron = require('node-cron');
const expirePastTickets = require('./scripts/expireTicketsJob');

// Firebase Admin 초기화 (환경변수 JSON 기반)
const admin = require('firebase-admin');
try {
  const firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
    console.log("Firebase Admin 초기화 완료");
  }
} catch (err) {
  console.error("Firebase 초기화 실패:", err.message);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5040;

// 라우트 import
const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');
const benefitRoutes = require('./routes/benefit.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const notificationRoutes = require('./routes/notifications.routes');
const emailRoutes = require('./routes/email.routes');
const adminAuthRoutes = require('./routes/admin.auth.routes');
const adminEmailRoutes = require('./routes/admin.email.routes');

// 만료 티켓 자동 작업 (매일 00시)
cron.schedule('00 00 * * *', () => {
  console.log('만료 티켓 확인 작업 시작');
  expirePastTickets();
});

// Express 기본 설정
app.use('/uploads', express.static('uploads'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우팅
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/email', adminEmailRoutes);
app.use('/', require('./routes/bridge'));

app.get('/', (req, res) => {
  res.send('롯데월드 백엔드 서버 실행 중!');
});

// DB 연결 후 서버 시작
sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MariaDB 연결 실패:', err);
  });

// 스케줄러 실행
require('./utils/notificationScheduler');