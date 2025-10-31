const { Op } = require('sequelize');
const { Order } = require('../models');

async function expirePastTickets() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [count] = await Order.update(
      { status: '사용불가' },
      {
        where: {
          visitDate: { [Op.lt]: today },
          status: '예매완료',  
        },
      }
    );
    console.log(`✅ 티켓 만료 상태 변경 완료: ${count}건`);
  } catch (error) {
    console.error('❌ 티켓 만료 처리 실패:', error);
  }
}

module.exports = expirePastTickets;