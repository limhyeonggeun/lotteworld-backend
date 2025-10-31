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

const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');
const benefitRoutes = require('./routes/benefit.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRouter = require('./routes/dashboard.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5040;
const cron = require('node-cron');
const expirePastTickets = require('./scripts/expireTicketsJob');
const maintenanceRoutes = require('./routes/maintenance.routes')
const notificationRoutes = require('./routes/notifications.routes');
const emailRoutes = require('./routes/email.routes')
const adminAuthRoutes = require('./routes/admin.auth.routes');
const adminEmailRoutes = require('./routes/admin.email.routes')

cron.schedule('00 00 * * *', () => {
  console.log('만료 티켓 확인 작업 시작');
  expirePastTickets();
});

app.use('/uploads', express.static('uploads'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/maintenance', maintenanceRoutes)
app.use('/uploads', express.static('uploads'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/email',adminEmailRoutes);
app.use('/', require('./routes/bridge'));
app.get('/', (req, res) => {
  res.send('롯데월드 백엔드 서버 실행 중!');
});

sequelize.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MariaDB 연결 실패:', err);
  });

  require('./utils/notificationScheduler');