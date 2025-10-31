const express = require('express')
const router = express.Router()
const { Maintenance } = require('../models')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}${ext}`)
  }
})
const upload = multer({ storage })

router.get('/', async (req, res) => {
  const { date } = req.query

  try {
    let items

    if (date) {
      items = await Maintenance.findAll({
        where: { date },
        order: [['id', 'ASC']],
      })
    } else {
      items = await Maintenance.findAll({
        order: [['date', 'DESC']],
      })
    }

    res.json(items)
  } catch (err) {
    res.status(500).json({ error: '서버 오류' })
  }
})

router.post('/', upload.single('image'), async (req, res) => {
  const { label, date, imageUrl, reason } = req.body
  const file = req.file

  if (!label || !date) {
    return res.status(400).json({ message: 'label과 date는 필수입니다.' })
  }

  let finalImageUrl = ''

  if (file) {
    finalImageUrl = `/uploads/${file.filename}`
  } else if (imageUrl) {
    finalImageUrl = imageUrl
  } else {
    return res.status(400).json({ message: '이미지 파일 또는 imageUrl이 필요합니다.' })
  }

  try {
    const newItem = await Maintenance.create({
      label,
      date,
      imageUrl: finalImageUrl,
      reason: reason || '기타',
    })

    res.status(201).json(newItem)
  } catch (error) {
    console.error('운휴 등록 실패:', error)
    res.status(500).json({ message: '등록 중 오류가 발생했습니다.' })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const deleted = await Maintenance.destroy({ where: { id } })
    if (deleted) {
      res.json({ message: '삭제 완료' })
    } else {
      res.status(404).json({ message: '해당 항목을 찾을 수 없습니다.' })
    }
  } catch (error) {
    console.error('삭제 실패:', error)
    res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' })
  }
})

router.patch('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params
  const { label, date, reason } = req.body
  const file = req.file

  try {
    const item = await Maintenance.findByPk(id)

    if (!item) {
      return res.status(404).json({ message: '해당 항목을 찾을 수 없습니다.' })
    }

    if (label !== undefined) item.label = label
    if (date !== undefined) item.date = date
    if (reason !== undefined) item.reason = reason
    if (file) item.imageUrl = `/uploads/${file.filename}`

    await item.save()

    res.json(item)
  } catch (error) {
    console.error('수정 실패:', error)
    res.status(500).json({ message: '수정 중 오류가 발생했습니다.' })
  }
})

module.exports = router