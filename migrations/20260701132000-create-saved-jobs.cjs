"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("saved_jobs", {
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
            jobId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "jobs",
                    key: "id"
                },
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

        await queryInterface.addConstraint("saved_jobs", {
            fields: ["userId", "jobId"],
            type: "unique",
            name: "unique_user_job"
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("saved_jobs");
    }
};
