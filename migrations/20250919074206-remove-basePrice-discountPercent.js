module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('CardBenefitOptions', 'basePrice');
    } catch (e) {
      console.error('basePrice 삭제 중 오류:', e.message);
    }

    try {
      await queryInterface.removeColumn('CardBenefitOptions', 'discountPercent');
    } catch (e) {
      console.error('discountPercent 삭제 중 오류:', e.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('CardBenefitOptions', 'basePrice', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'discountPercent', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};