"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const users = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE role = 'user'`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        const userIds = users.map(u => u.id);

        const posts = await queryInterface.sequelize.query(
            `SELECT id FROM posts`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        const now = new Date();
        const likes = [];

        posts.forEach(post => {
            const count = Math.floor(Math.random() * 26) + 5;
            const shuffled = [...userIds].sort(() => Math.random() - 0.5);
            shuffled.slice(0, count).forEach(userId => {
                likes.push({
                    userId,
                    postId: post.id,
                    createdAt: now,
                    updatedAt: now
                });
            });
        });

        if (likes.length > 0) {
            await queryInterface.bulkInsert("post_likes", likes);
        }

        await queryInterface.sequelize.query(
            `UPDATE posts SET likes = (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id)`
        );
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("post_likes", null, {});
        await queryInterface.sequelize.query(`UPDATE posts SET likes = 0`);
    }
};
