'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      sid: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('Sessions', ['expires']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Sessions');
  }
};