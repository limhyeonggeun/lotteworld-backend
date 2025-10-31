const express = require('express');
const router = express.Router();

router.get('/auth', (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  const appRedirect = `exp://172.29.62.22:8081/--/oauth?code=${code}`;

  return res.redirect(appRedirect);
});

module.exports = router;