"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("post_replies", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            postId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "posts", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
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
        await queryInterface.dropTable("post_replies");
    }
};
