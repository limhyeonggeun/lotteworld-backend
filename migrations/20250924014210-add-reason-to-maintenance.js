module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Maintenances', 'reason', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '기타',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Maintenances', 'reason');
  },
};