'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.hasMany(models.Order, {
        foreignKey: 'ticketId',
        as: 'Orders',
      });
    }
  }

  Ticket.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
      price: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM('전체', '제휴 할인', '이달의 할인', '매직패스'),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING, 
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Ticket',
    }
  );

  return Ticket;
};