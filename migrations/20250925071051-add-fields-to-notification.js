'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('Notifications', 'deliveryMethod', {
        type: Sequelize.ENUM('push', 'email'),
        allowNull: false,
        defaultValue: 'push',
      }),
      queryInterface.addColumn('Notifications', 'recipient', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      }),
      queryInterface.addColumn('Notifications', 'status', {
        type: Sequelize.ENUM('scheduled', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'scheduled',
      }),
      queryInterface.addColumn('Notifications', 'scheduledAt', {
        type: Sequelize.DATE,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('Notifications', 'deliveryMethod'),
      queryInterface.removeColumn('Notifications', 'recipient'),
      queryInterface.removeColumn('Notifications', 'status'),
      queryInterface.removeColumn('Notifications', 'scheduledAt'),
      // ENUM 타입은 따로 제거 필요
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_deliveryMethod";'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_status";'),
    ]);
  },
};