const express = require('express');
const auth = require('../middlewares/auth.middleware');
const { User } = require('../models');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name', 'phone', 'status', 'grade', 'isAdmin', 'createdAt', 'lastLogin'],
    });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'phone', 'status', 'grade', 'isAdmin', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: '회원 목록 불러오기 실패', error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const targetId = String(req.params.id);
    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const allowed = ['name', 'email', 'phone', 'lastLogin', 'grade', 'status', 'isAdmin'];
    const updates = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if ('phone' in updates) {
      updates.phone = String(updates.phone || '').replace(/[^\d+]/g, '');
    }
    if ('lastLogin' in updates) {
      updates.lastLogin = new Date(updates.lastLogin);
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: '변경할 필드가 없습니다.' });
    }

    await user.update(updates, { fields: Object.keys(updates) });
    await user.reload();

    res.json({
      message: '회원 정보가 수정되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        grade: user.grade,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: '회원 정보 수정 실패', error: err.message });
  }
});


router.get('/count', async (req, res) => {
  try {
    const count = await User.count();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: '회원 수 가져오기 실패' });
  }
});


router.post('/fcm-token', async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: 'userId와 token이 필요합니다.' });
  }

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  await user.update({ fcmToken: token });
  res.json({ message: 'FCM 토큰 저장 완료' });
});


module.exports = router;