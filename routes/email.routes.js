const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const emailCodeStore = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
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
  emailCodeStore.set(email, { code, expiresAt });

  try {
    await transporter.sendMail({
      from: `"롯데월드 이메일 인증" <${process.env.MAIL_FROM_EMAIL}>`,
      to: email,
      subject: "롯데월드 회원가입 이메일 인증코드",
      html: `<p>이메일 인증 코드입니다:</p><h2>${code}</h2><p>5분 내에 입력해주세요.</p>`,
    });
    console.log("✅ 이메일 전송 성공:", email);
    res.json({ message: "인증코드가 전송되었습니다." });
  } catch (err) {
    console.error("❌ 이메일 전송 실패:", err.message);
    res.status(500).json({ message: "이메일 전송 실패", error: err.message });
  }
});

router.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: "이메일과 인증코드가 필요합니다." });

  const data = emailCodeStore.get(email);
  if (!data)
    return res.status(400).json({ message: "인증코드를 먼저 요청해주세요." });

  if (Date.now() > data.expiresAt) {
    emailCodeStore.delete(email);
    return res.status(400).json({ message: "인증코드가 만료되었습니다." });
  }

  if (data.code !== code)
    return res.status(400).json({ message: "인증코드가 일치하지 않습니다." });

  emailCodeStore.delete(email);
  res.json({ message: "인증 성공" });
});

module.exports = router;