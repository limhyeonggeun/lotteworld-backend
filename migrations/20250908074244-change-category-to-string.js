'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('TicketBenefits', 'category', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('TicketBenefits', 'category', {
      type: Sequelize.ENUM('monthlyDeals', 'pointDeals'),
      allowNull: false,
    });
  },
};