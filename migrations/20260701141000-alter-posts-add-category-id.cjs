"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("posts", "categoryId", {
            type: Sequelize.INTEGER,
            allowNull: true
        });

        await queryInterface.sequelize.query(`
            UPDATE posts SET categoryId = (
                SELECT id FROM post_categories WHERE post_categories.name = posts.category
            )
        `);

        await queryInterface.changeColumn("posts", "categoryId", {
            type: Sequelize.INTEGER,
            allowNull: false
        });

        await queryInterface.addConstraint("posts", {
            fields: ["categoryId"],
            type: "foreign key",
            name: "fk_posts_category",
            references: {
                table: "post_categories",
                field: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
        });

        await queryInterface.removeColumn("posts", "category");
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn("posts", "category", {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "Genel"
        });

        await queryInterface.sequelize.query(`
            UPDATE posts SET category = (
                SELECT name FROM post_categories WHERE post_categories.id = posts.categoryId
            )
        `);

        await queryInterface.removeConstraint("posts", "fk_posts_category");
        await queryInterface.removeColumn("posts", "categoryId");
    }
};
