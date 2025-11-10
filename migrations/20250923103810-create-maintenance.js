// migrations/xxxx-create-maintenance.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Maintenances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Maintenances')
  },
}