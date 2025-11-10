const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, password, name, phone, position } = req.body;
  if (!email || !password || !name || !phone || !position) {
    return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
  }

  try {
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: '이미 등록된 관리자입니다.' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await AdminUser.create({ email, password: hashed, name, phone, position });

    res.status(201).json({ message: '관리자 등록 완료', adminId: admin.id });
  } catch (err) {
    res.status(500).json({ message: '관리자 등록 중 오류 발생', error: err.message });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const admin = await AdminUser.findOne({ where: { email } });
      if (!admin) return res.status(401).json({ message: '이메일이 존재하지 않습니다.' });
  
      const match = await bcrypt.compare(password, admin.password);
      if (!match) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
  
      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          position: admin.position,
          isAdmin: true,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.json({
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          position: admin.position,
        },
      });
    } catch (err) {
      res.status(500).json({ message: '로그인 실패', error: err.message });
    }
  });

module.exports = router;