'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];


const db = {};
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const Ticket = require('./ticket')(sequelize, Sequelize.DataTypes);
const User = require('./user')(sequelize, Sequelize.DataTypes);
const TicketBenefit = require('./TicketBenefit')(sequelize, Sequelize.DataTypes);
const CardBenefitGroup = require('./CardBenefitGroup')(sequelize, Sequelize.DataTypes);
const CardBenefitOption = require('./CardBenefitOption')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const Maintenance = require('./Maintenance')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
const AdminUser = require('./AdminUser')(sequelize, Sequelize.DataTypes);

Ticket.hasOne(TicketBenefit, { foreignKey: 'ticketId' });
TicketBenefit.belongsTo(Ticket, { foreignKey: 'ticketId' });

CardBenefitGroup.hasMany(CardBenefitOption, {
  foreignKey: 'cardBenefitGroupId',
  as: 'options',
});
CardBenefitOption.belongsTo(CardBenefitGroup, {
  foreignKey: 'cardBenefitGroupId',
});

Order.belongsTo(Ticket, { foreignKey: 'ticketId' });
Ticket.hasMany(Order, { foreignKey: 'ticketId' });

Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });

db.Ticket = Ticket;
db.User = User;
db.TicketBenefit = TicketBenefit;
db.CardBenefitGroup = CardBenefitGroup;
db.CardBenefitOption = CardBenefitOption;
db.Order = Order;
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Maintenance = Maintenance;
db.Notification = Notification;
db.AdminUser = AdminUser;

module.exports = db;