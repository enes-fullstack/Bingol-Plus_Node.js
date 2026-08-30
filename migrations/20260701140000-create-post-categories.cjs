"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("post_categories", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            slug: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
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
        await queryInterface.dropTable("post_categories");
    }
};
