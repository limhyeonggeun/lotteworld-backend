module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          'system',
          'ride_closed',
          'ride_resumed',
          'event',
          'parade'
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryMethod: {
        type: DataTypes.ENUM('push', 'email'),
        allowNull: false,
        defaultValue: 'push',
      },
      recipient: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "all_users",
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'sent', 'failed'),
        defaultValue: 'scheduled',
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
    };
  
    return Notification;
  };