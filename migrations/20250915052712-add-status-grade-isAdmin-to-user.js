'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'active',
    });

    await queryInterface.addColumn('Users', 'grade', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '일반회원',
    });

    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'status');
    await queryInterface.removeColumn('Users', 'grade');
    await queryInterface.removeColumn('Users', 'isAdmin');
  },
};