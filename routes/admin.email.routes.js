const express = require("express");
const router = express.Router();
const { Resend } = require("resend");
const { AdminUser } = require("../models"); 

const resend = new Resend(process.env.MAIL_API_KEY);
const adminEmailCodeStore = new Map();

router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "이메일이 필요합니다." });

  try {
    const existingAdmin = await AdminUser.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({ message: "이미 등록된 관리자 이메일입니다." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    adminEmailCodeStore.set(email, { code, expiresAt });

    const data = await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} 관리자 <${process.env.MAIL_FROM_EMAIL}>`,
      to: email,
      subject: "[롯데월드 관리자] 이메일 인증코드",
      html: `
        <div style="font-family:'Pretendard',sans-serif;line-height:1.6;color:#333;">
          <h2>롯데월드 관리자 인증</h2>
          <p>관리자 계정 생성을 위한 인증코드입니다 (5분간 유효)</p>
          <div style="font-size:24px;font-weight:bold;color:#DA291C;margin-top:10px;">${code}</div>
          <p style="font-size:13px;color:#888;margin-top:10px;">본 메일은 발신전용입니다.</p>
        </div>
      `,
    });

    console.log("[Admin] 이메일 전송 성공:", email, data.id || "");
    res.json({ message: "관리자 인증코드가 전송되었습니다." });
  } catch (err) {
    console.error("[Admin] 이메일 전송 실패:", err.message);
    res.status(500).json({ message: "이메일 전송 실패", error: err.message });
  }
});

router.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  const data = adminEmailCodeStore.get(email);

  if (!email || !code)
    return res.status(400).json({ message: "이메일과 인증코드가 필요합니다." });
  if (!data)
    return res.status(400).json({ message: "인증코드를 먼저 요청해주세요." });

  if (Date.now() > data.expiresAt) {
    adminEmailCodeStore.delete(email);
    return res.status(400).json({ message: "인증코드가 만료되었습니다." });
  }

  if (data.code !== code)
    return res.status(400).json({ message: "인증코드가 일치하지 않습니다." });

  adminEmailCodeStore.delete(email);
  res.json({ message: "인증 성공" });
});

module.exports = router;