// migrations/XXXXXX-add-maxcount-to-card-benefit-options.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CardBenefitOptions', 'maxCount', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CardBenefitOptions', 'maxCount');
  },
};