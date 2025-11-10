const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const qs = require('qs');
const auth = require('../middlewares/auth.middleware');
const { User } = require('../models');
const { Op } = require('sequelize');

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const ALLOWED_REDIRECT_URIS = (process.env.KAKAO_ALLOWED_REDIRECT_URIS || `
http://localhost:3000/auth,
http://10.0.2.2:3000/auth,
http://172.29.62.22:3000/auth,
https://media.seowon.ac.kr/s202011341/auth
`)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function signUser(user) {
  return jwt.sign({ id: user.id, email: user.email, isAdmin: !!user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
}

function normalizePhone(p) {
  return (p || '').replace(/[^\d+]/g, '');
}

async function upsertKakaoUser({ kakaoId, email, name, phone }) {
  const placeholderEmail = `kakao_${kakaoId}@placeholder.local`;
  let user = await User.findOne({
    where: {
      [Op.or]: [
        ...(email ? [{ email }] : []),
        { email: placeholderEmail }
      ]
    }
  });

  if (!user) {
    const tempPassword = await bcrypt.hash(`kakao:${kakaoId}:${Date.now()}`, 10);
    user = await User.create({
      email: email || placeholderEmail,
      name: name || '',
      phone: phone || '',
      password: tempPassword,
      status: 'active',
    });
  } else {
    const updates = {
      status: 'active',
      name: user.name || name || '',
      phone: user.phone || phone || '',
    };
    if (email && (user.email === placeholderEmail || !user.email)) {
      const exists = await User.findOne({ where: { email } });
      if (!exists) updates.email = email;
    }
    await user.update(updates);
  }

  return user;
}

router.post('/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name || !phone) return res.status(400).json({ message: '모든 항목을 입력해 주세요.' });
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name, phone: normalizePhone(phone), status: 'active' });
    return res.status(201).json({ message: '회원가입 성공', userId: user.id });
  } catch (err) {
    return res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: '이메일이 존재하지 않습니다.' });
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    await user.update({ lastLogin: new Date(), status: 'active' });
    const token = signUser(user);
    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        status: user.status,
        grade: user.grade,
        isAdmin: user.isAdmin
      },
    });
  } catch (err) {
    res.status(500).json({ message: '로그인 실패', error: err.message });
  }
});

router.post('/kakao/code', async (req, res) => {
  const { code, redirectUri } = req.body || {};

  function clean(str) {
    return str?.replace(/\/$/, '');
  }

  const cleanedRedirectUri = clean(redirectUri);

  if (!code || !redirectUri) {
    return res.status(400).json({ message: 'code와 redirectUri가 필요합니다.' });
  }

  if (!ALLOWED_REDIRECT_URIS.map(clean).includes(cleanedRedirectUri)) {
    return res.status(400).json({ message: '허용되지 않은 redirectUri 입니다.' });
  }

  try {
    const form = qs.stringify({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: cleanedRedirectUri, 
      code,
      ...(KAKAO_CLIENT_SECRET ? { client_secret: KAKAO_CLIENT_SECRET } : {}),
    });
    console.log('[KAKAO] incoming code:', code);
    console.log('[KAKAO] incoming redirectUri:', redirectUri);
    console.log('[KAKAO] cleaned redirectUri:', cleanedRedirectUri);
    console.log('[KAKAO] allowed redirect URIs:', ALLOWED_REDIRECT_URIS.map(clean));
    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = tokenRes.data;

    const meRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const me = meRes.data;
    const kakaoId = String(me.id);
    const account = me.kakao_account || {};
    const profile = account.profile || {};
    const email = account.email || null;
    const name = profile.nickname || '';
    const phone = normalizePhone(account.phone_number);

    const user = await upsertKakaoUser({ kakaoId, email, name, phone });
    await user.update({ lastLogin: new Date(), status: 'active' });

    const missingFields = [];
    if (!user.name) missingFields.push('name');
    if (!user.email || user.email.endsWith('@placeholder.local')) missingFields.push('email');
    if (!user.phone) missingFields.push('phone');
    const needProfile = missingFields.length > 0;

    const token = signUser(user);

    return res.json({
      user: {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        isAdmin: !!user.isAdmin,
        status: user.status,
        grade: user.grade,
      },
      token,
      needProfile,
      missingFields,
    });
  } catch (err) {
    const msg =
      err?.response?.data?.error_description ||
      err?.response?.data?.error ||
      err?.message ||
      '카카오 로그인 처리 중 오류가 발생했습니다.';
    return res.status(400).json({ message: msg });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name', 'phone', 'status', 'grade', 'isAdmin'],
    });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      grade: user.grade,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

module.exports = router;