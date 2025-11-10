'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      visitDate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      optionName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payMethod: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      counts: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      buyerName: {
        type: Sequelize.STRING,
      },
      buyerEmail: {
        type: Sequelize.STRING,
      },
      buyerPhone: {
        type: Sequelize.STRING,
      },
      visitorName: {
        type: Sequelize.STRING,
      },
      visitorEmail: {
        type: Sequelize.STRING,
      },
      visitorPhone: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Orders');
  },
};