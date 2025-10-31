'use strict';

module.exports = (sequelize, DataTypes) => {
  const CardBenefitOption = sequelize.define('CardBenefitOption', {
    cardBenefitGroupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    optionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    benefit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detailText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxCount: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    maxAdult: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maxTeen: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maxChild: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    basePriceAdult: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    basePriceTeen: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    basePriceChild: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discountPercentAdult: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discountPercentTeen: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discountPercentChild: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'CardBenefitOptions',
  });

  CardBenefitOption.associate = (models) => {
    CardBenefitOption.belongsTo(models.CardBenefitGroup, {
      foreignKey: 'cardBenefitGroupId',
    });
  };

  return CardBenefitOption;
};