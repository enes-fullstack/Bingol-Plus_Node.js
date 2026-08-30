"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("password_resets", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            token: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            expiresAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            usedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("password_resets");
    }
};
