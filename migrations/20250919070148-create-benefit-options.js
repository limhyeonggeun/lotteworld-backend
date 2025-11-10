'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CardBenefitOptions', 'basePriceAdult', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'basePriceTeen', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'basePriceChild', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'discountPercentAdult', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'discountPercentTeen', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('CardBenefitOptions', 'discountPercentChild', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CardBenefitOptions', 'basePriceAdult');
    await queryInterface.removeColumn('CardBenefitOptions', 'basePriceTeen');
    await queryInterface.removeColumn('CardBenefitOptions', 'basePriceChild');
    await queryInterface.removeColumn('CardBenefitOptions', 'discountPercentAdult');
    await queryInterface.removeColumn('CardBenefitOptions', 'discountPercentTeen');
    await queryInterface.removeColumn('CardBenefitOptions', 'discountPercentChild');
  }
};