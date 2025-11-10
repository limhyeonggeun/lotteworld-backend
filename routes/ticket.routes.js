const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Ticket } = require('../models');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const image = req.file?.filename;

    if (!image) return res.status(400).json({ error: '이미지 업로드 실패' });

    const ticket = await Ticket.create({
      title,
      description,
      price,
      category,
      image,
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '티켓 생성 실패', message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.findAll();
    const updatedTickets = tickets.map((ticket) => ({
      ...ticket.toJSON(),
      imageUrl: `http://localhost:5040/uploads/${ticket.image}`,
    }));
    res.json(updatedTickets);
  } catch (error) {
    console.error('티켓 조회 실패:', error);
    res.status(500).json({ error: '티켓 조회 실패', message: error.message });
  }
});

module.exports = router;