const express = require("express");
const router = express.Router();

router.get("/auth", (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");

  const redirect = `https://media.seowon.ac.kr/s202011341/auth?code=${code}`;
  return res.redirect(redirect);
});

module.exports = router;