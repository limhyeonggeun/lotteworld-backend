const cron = require('node-cron');
const { Op } = require('sequelize');
const { Notification, User } = require('../models');
const sendPush = require('../utils/sendPush');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const scheduledNotifications = await Notification.findAll({
      where: {
        status: 'scheduled',
        scheduledAt: {
          [Op.lte]: now,
        },
      },
    });

    for (const alert of scheduledNotifications) {
      try {
        const user = await User.findByPk(alert.userId);

        if (!user || !user.fcmToken) {
          console.warn(`사용자 또는 FCM 토큰 없음 (userId: ${alert.userId})`);
          alert.status = 'failed';
          await alert.save();
          continue;
        }

        const success = await sendPush(alert, user.fcmToken);

        alert.status = success ? 'sent' : 'failed';
        alert.updatedAt = new Date();
        await alert.save();

        if (success) {
          console.log(`알림 전송 완료 (id: ${alert.id})`);
        } else {
          console.warn(`알림 전송 실패 (id: ${alert.id})`);
        }
      } catch (err) {
        alert.status = 'failed';
        await alert.save();
        console.error(`알림 전송 중 예외 발생 (id: ${alert.id})`, err);
      }
    }
  } catch (err) {
    console.error('스케줄러 전체 실행 오류:', err);
  }
});