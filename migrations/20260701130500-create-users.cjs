"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            email: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            username: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.STRING(5),
                allowNull: false,
                defaultValue: "user"
            },
            banned: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            ip: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "0"
            },
            userAgent: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "Unknown"
            },
            profileImage: {
                type: Sequelize.STRING,
                allowNull: true
            },
            profileImageDate: {
                type: Sequelize.STRING(10),
                allowNull: true
            },
            profileImageCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            deletedAt: {
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
        await queryInterface.dropTable("users");
    }
};
