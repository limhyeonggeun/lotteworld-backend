'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BenefitOptions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ticketBenefitId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TicketBenefits',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      cardName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      optionName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      basePrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      discountPercent: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      detailText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      maxCount: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('BenefitOptions');
  },
};