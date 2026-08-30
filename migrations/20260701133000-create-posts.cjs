"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("posts", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            category: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "Genel"
            },
            likes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
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
        await queryInterface.dropTable("posts");
    }
};
