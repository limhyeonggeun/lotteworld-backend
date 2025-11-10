'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'optionName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('Orders', 'price', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addColumn('Orders', 'payMethod', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'optionName');
    await queryInterface.removeColumn('Orders', 'price');
    await queryInterface.removeColumn('Orders', 'payMethod');
  },
};