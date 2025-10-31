const express = require('express');
const { Order, Ticket, User } = require('../models');
const router = express.Router();
const { generateBookingNo, generateOrderNo } = require('../utils/generateCodes');

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.findAll({
      where: { userId: parseInt(userId, 10) },
      include: [
        { model: Ticket, attributes: ['title'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = orders.map((order) => {
      const raw = order.toJSON();

      return {
        ...raw,
        eventName: raw.Ticket?.title ?? '정보 없음',
        counts: raw.counts ? JSON.parse(raw.counts) : null,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ 주문 조회 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      userId,
      ticketId,
      visitDate,
      counts,
      quantity,
      amount,
      paymentMethod,
      orderName,
      buyer,
      visitor,
    } = req.body;

    const existing = await Order.findOne({
      where: {
        userId,
        ticketId,
        visitDate,
        price: amount,
        optionName: orderName,
        payMethod: paymentMethod,
      },
    });

    if (existing) {
      return res.status(200).json(existing); 
    }

    const newOrder = await Order.create({
      userId,
      ticketId,
      visitDate,
      optionName: orderName,
      price: amount,
      payMethod: paymentMethod,
      quantity,
      counts: JSON.stringify(counts),
      buyer: JSON.stringify(buyer),
      visitor: JSON.stringify(visitor),
      buyerName: buyer?.name,
      buyerEmail: buyer?.email,
      buyerPhone: buyer?.phone,
      visitorName: visitor?.name,
      visitorEmail: visitor?.email,
      visitorPhone: visitor?.phone,
      bookingNo: generateBookingNo(),
      orderNo: generateOrderNo(),
      status: '예매완료',
    });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('❌ 주문 등록 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Ticket, attributes: ['title'] },
        { model: User, attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const raw = order.toJSON();

    const result = {
      ...raw,
      eventName: raw.Ticket?.title ?? '정보 없음',
      counts: raw.counts ? JSON.parse(raw.counts) : null,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ 주문 단건 조회 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const deleted = await Order.destroy({
      where: { id: orderId },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: '삭제할 주문이 없습니다.' });
    }

    res.status(200).json({ message: '주문이 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 주문 삭제 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/order-no/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;

    const order = await Order.findOne({
      where: { orderNo },
      include: [
        { model: Ticket, attributes: ['title'] },
        { model: User, attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const raw = order.toJSON();

    const result = {
      ...raw,
      eventName: raw.Ticket?.title ?? '정보 없음',
      counts: raw.counts ? JSON.parse(raw.counts) : null,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ 주문 조회 실패 (orderNo):', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.patch('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    console.error('❌ 주문 상태 업데이트 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Ticket, attributes: ['title'] },
        { model: User, attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = orders.map((order) => {
      const raw = order.toJSON();

      return {
        ...raw,
        eventName: raw.Ticket?.title ?? '정보 없음',
        counts: raw.counts ? JSON.parse(raw.counts) : null,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('전체 주문 조회 실패', error);
    res.status(500).json({ error: '전체 주문을 불러오는 데 실패했습니다.' });
  }
});

module.exports = router;