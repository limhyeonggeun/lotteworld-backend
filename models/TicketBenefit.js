'use strict';

module.exports = (sequelize, DataTypes) => {
  const TicketBenefit = sequelize.define('TicketBenefit', {
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('이달의 혜택', '제휴카드', '포인트'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  TicketBenefit.associate = (models) => {
    TicketBenefit.belongsTo(models.Ticket, {
      foreignKey: 'ticketId',
    });
  };

  return TicketBenefit;
};