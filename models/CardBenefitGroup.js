'use strict';

module.exports = (sequelize, DataTypes) => {
  const CardBenefitGroup = sequelize.define('CardBenefitGroup', {
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cardName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('이달의 혜택', '제휴카드', '포인트'),
      allowNull: false,
    },
  });

  CardBenefitGroup.associate = (models) => {
    CardBenefitGroup.belongsTo(models.Ticket, {
      foreignKey: 'ticketId',
    });

    CardBenefitGroup.hasMany(models.CardBenefitOption, {
      foreignKey: 'cardBenefitGroupId',
      as: 'options',
      onDelete: 'CASCADE',
    });
  };

  return CardBenefitGroup;
};