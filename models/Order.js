'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ticketId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    visitDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    counts: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    optionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    buyerName: {
      type: DataTypes.STRING,
    },
    buyerEmail: {
      type: DataTypes.STRING,
    },
    buyerPhone: {
      type: DataTypes.STRING,
    },
    visitorName: {
      type: DataTypes.STRING,
    },
    visitorEmail: {
      type: DataTypes.STRING,
    },
    visitorPhone: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '예매완료',
    },
    bookingNo: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    orderNo: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Ticket, {
      foreignKey: 'ticketId',
      as: 'Ticket',
    });

    Order.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'User',
    });
  };

  return Order;
};