const express = require('express');
const auth = require('../middlewares/auth.middleware');
const { Notification, User } = require('../models');
const trySendPush = require('../utils/sendPush');
const { Op } = require('sequelize');

const router = express.Router();
const success = await trySendPush(n, user.fcmToken);
await n.update({
  status: success ? "sent" : "failed",
  failReason: success ? null : "FCM 전송 실패 또는 유효하지 않은 토큰",
});

router.get('/user/:userId', auth, async (req, res) => {
    const { userId } = req.params;
  
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
  
    try {
      const { Op } = require('sequelize');
  
      const notifications = await Notification.findAll({
        where: {
          userId,
          [Op.or]: [
            { status: 'failed' }, 
            { read: false },     
          ],
        },
        order: [['createdAt', 'DESC']],
      });
  
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: '알림 조회 실패', error: err.message });
    }
  });

router.post('/', async (req, res) => {
  const {
    recipient,
    userId,
    type,
    title,
    content,
    scheduledAt,
    sendImmediately,
  } = req.body;

  if (!recipient || !type || !title || !content) {
    return res.status(400).json({ message: '필수 필드 누락' });
  }

  const now = new Date();
  const status = sendImmediately ? 'sent' : 'scheduled';
  const deliveryTime = sendImmediately ? now : scheduledAt || now;

  try {
    if (recipient === 'all_users') {
      const allUsers = await User.findAll({ attributes: ['id', 'fcmToken'] });

      const notifications = await Promise.all(
        allUsers.map(user =>
          Notification.create({
            userId: user.id,
            type,
            title,
            content,
            deliveryMethod: 'push',
            recipient,
            status,
            scheduledAt: deliveryTime,
            read: false,
          })
        )
      );

      if (sendImmediately) {
        await Promise.all(
          notifications.map(async (n) => {
            const user = allUsers.find(u => u.id === n.userId);
            if (!user?.fcmToken) return;

            const success = await trySendPush(n, user.fcmToken);
            await n.update({ status: success ? 'sent' : 'failed' });
          })
        );
      }

      return res.status(201).json({
        message: '전체 사용자에게 알림 전송 완료',
        count: notifications.length,
      });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId는 필수입니다' });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      content,
      deliveryMethod: 'push',
      recipient,
      status,
      scheduledAt: deliveryTime,
      read: false,
    });

    if (sendImmediately) {
      const targetUser = await User.findByPk(userId, { attributes: ['fcmToken'] });
      if (targetUser?.fcmToken) {
        const success = await trySendPush(notification, targetUser.fcmToken);
        await notification.update({ status: success ? 'sent' : 'failed' });
      }
    }

    return res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: '알림 생성 실패', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: '알림 전체 조회 실패', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const target = await Notification.findByPk(req.params.id);

    if (!target) {
      return res.status(404).json({ message: '해당 알림이 존재하지 않습니다.' });
    }

    if (target.userId !== req.user.id) {
      return res.status(403).json({ message: '본인의 알림만 삭제할 수 있습니다.' });
    }

    if (target.recipient === 'all_users') {
      await Notification.update(
        { read: true },
        {
          where: {
            recipient: 'all_users',
            title: target.title,
            content: target.content,
            type: target.type,
            scheduledAt: target.scheduledAt,
            userId: req.user.id,
          },
        }
      );
      return res.json({ message: '전체 사용자 알림 숨김 처리 완료' });
    }

    await target.update({ read: true });
    res.json({ message: '알림이 삭제되었습니다 (숨김 처리)' });
  } catch (err) {
    res.status(500).json({ message: '알림 삭제 실패', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Notification.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated[0] === 0) {
      return res.status(404).json({ message: '해당 알림이 존재하지 않습니다.' });
    }

    const updatedNotification = await Notification.findByPk(req.params.id);
    res.json(updatedNotification);
  } catch (err) {
    res.status(500).json({ message: '알림 수정 실패', error: err.message });
  }
});

router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'ids 배열이 필요합니다.' });
  }

  try {
    const targets = await Notification.findAll({ where: { id: ids } });

    const conditionsToDelete = targets.map(target => {
      if (target.recipient === 'all_users') {
        return {
          recipient: 'all_users',
          title: target.title,
          content: target.content,
          type: target.type,
          scheduledAt: target.scheduledAt,
        };
      }
      return { id: target.id };
    });

    const deleteCount = await Notification.destroy({
      where: { [Op.or]: conditionsToDelete },
    });

    res.json({ message: '일괄 삭제 완료', count: deleteCount });
  } catch (err) {
    res.status(500).json({ message: '일괄 삭제 실패', error: err.message });
  }
});

router.post('/bulk-resend', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'ids 배열이 필요합니다.' });
  }

  try {
    const notifications = await Notification.findAll({ where: { id: ids } });

    for (const n of notifications) {
      const targetUser = await User.findByPk(n.userId, { attributes: ['fcmToken'] });
      if (!targetUser?.fcmToken) continue;

      const success = await trySendPush(n, targetUser.fcmToken);
      await n.update({ status: success ? 'sent' : 'failed' });
    }

    res.json({ message: '일괄 재전송 완료', count: notifications.length });
  } catch (err) {
    res.status(500).json({ message: '일괄 재전송 실패', error: err.message });
  }
});

router.get("/failed", async (req, res) => {
  try {
    const failed = await Notification.findAll({
      where: { status: "failed" },
      include: [{ model: User, attributes: ["id", "email"] }],
      order: [["updatedAt", "DESC"]],
    });

    res.json(failed);
  } catch (err) {
    console.error("실패한 알림 조회 오류:", err);
    res.status(500).json({ message: "실패한 알림 조회 실패", error: err.message });
  }
});
module.exports = router;