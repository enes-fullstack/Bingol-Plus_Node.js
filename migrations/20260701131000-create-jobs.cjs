"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("jobs", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            company: {
                type: Sequelize.STRING,
                allowNull: false
            },
            location: {
                type: Sequelize.STRING,
                allowNull: false
            },
            salary: {
                type: Sequelize.STRING,
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true
            },
            type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
        await queryInterface.dropTable("jobs");
    }
};
