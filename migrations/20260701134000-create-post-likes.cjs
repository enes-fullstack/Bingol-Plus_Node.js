"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("post_likes", {
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
            postId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "posts", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
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

        await queryInterface.addConstraint("post_likes", {
            fields: ["userId", "postId"],
            type: "unique",
            name: "unique_user_post_like"
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("post_likes");
    }
};
