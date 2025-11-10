const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ticket = require('../models/Ticket');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB 연결됨');

    const sampleTickets = [
      {
        title: '롯데월드카드 전용',
        description: '본인 + 동반 1인 50%',
        price: '₩26,000 ~',
        category: '제휴 할인',
      },
      {
        title: '삼성카드 전 회원 프로모션',
        description: '본인 + 동반 1인 45%',
        price: '₩28,600 ~',
        category: '제휴 할인',
      },
      {
        title: '포켓몬 패키지',
        description: '포켓몬 코스프레 PKG',
        price: '₩45,000 ~',
        category: '이달의 할인',
      },
    ];

    await Ticket.insertMany(sampleTickets);
    console.log('티켓 데이터 삽입 완료');

    mongoose.connection.close();
  })
  .catch((err) => console.error('DB 연결 실패', err));