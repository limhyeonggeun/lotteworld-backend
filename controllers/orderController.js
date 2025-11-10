const { Order } = require('../models');

exports.createOrder = async (req, res) => {
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
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('❌ 예매 저장 오류:', error);
    res.status(500).json({ message: '예매 저장 실패', error: error.message });
  }
};