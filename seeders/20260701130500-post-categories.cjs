"use strict";

const CATEGORIES = [
    { name: "Genel", slug: "genel" },
    { name: "Soru & Cevap", slug: "soru-ve-cevap" },
    { name: "Üniversite", slug: "universite" },
    { name: "Şikayet", slug: "sikayet" },
    { name: "İş ve Kariyer", slug: "is-ve-kariyer" },
    { name: "Gündem", slug: "gundem" },
    { name: "Alım & Satım", slug: "alim-ve-satim" }
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const rows = CATEGORIES.map(c => ({ ...c, createdAt: now, updatedAt: now }));
        await queryInterface.bulkInsert("post_categories", rows);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("post_categories", null, {});
    }
};
