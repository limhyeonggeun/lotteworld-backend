const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const adminCodeStore = new Map(); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "이메일이 필요합니다." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  adminCodeStore.set(email, { code, expiresAt });

  res.json({ message: "인증코드가 전송됩니다. 잠시만 기다려주세요." });

  transporter
    .sendMail({
      from: `"롯데월드 관리자 인증" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "[롯데월드 관리자] 이메일 인증코드",
      html: `<p>아래의 코드를 입력해주세요:</p><h2>${code}</h2><p>5분 이내에 입력해주세요.</p>`,
    })
    .then(() => console.log("이메일 전송 성공:", email))
    .catch(err => console.error("이메일 전송 실패:", err.message));
});

router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  const data = adminCodeStore.get(email);
  if (!data) return res.status(400).json({ message: '인증코드를 먼저 요청해주세요.' });

  if (Date.now() > data.expiresAt) {
    adminCodeStore.delete(email);
    return res.status(400).json({ message: '인증코드가 만료되었습니다.' });
  }

  if (data.code !== code) {
    return res.status(400).json({ message: '인증코드가 일치하지 않습니다.' });
  }

  adminCodeStore.delete(email);
  return res.json({ message: '인증 성공' });
});

module.exports = router;