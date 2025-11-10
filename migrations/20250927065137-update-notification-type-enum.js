'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ENUM 필드 직접 수정: 기존 컬럼 삭제 후 다시 생성
    await queryInterface.changeColumn('Notifications', 'type', {
      type: Sequelize.STRING, // 임시로 STRING으로 변경
      allowNull: false,
    });

    await queryInterface.changeColumn('Notifications', 'type', {
      type: Sequelize.ENUM(
        'system',
        'ride_closed',
        'ride_resumed',
        'event',
        'parade'
      ),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 원복 (rollback) — 'system' 제거, 'weather' 복원
    await queryInterface.changeColumn('Notifications', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Notifications', 'type', {
      type: Sequelize.ENUM(
        'weather',
        'ride_closed',
        'ride_resumed',
        'event',
        'parade'
      ),
      allowNull: false,
    });
  }
};