"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("posts", "first_reply_notified_at", {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("posts", "first_reply_notified_at");
    }
};
