module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('CardBenefitOptions', 'basePrice', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('CardBenefitOptions', 'discountPercent', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('CardBenefitOptions', 'basePrice', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('CardBenefitOptions', 'discountPercent', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};