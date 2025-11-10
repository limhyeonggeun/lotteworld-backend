'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CardBenefitGroups', 'category', {
      type: Sequelize.ENUM('이달의 혜택', '제휴카드', '포인트'),
      allowNull: false,
      defaultValue: '제휴카드', 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CardBenefitGroups', 'category');
  }
};