"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("job_applications", {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            jobId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "jobs",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            ad: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            soyad: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            telefon: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            ilIlce: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            yas: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            medeniDurumu: {
                type: Sequelize.ENUM("Bekar", "Evli"),
                allowNull: false,
            },
            ogrenimDurumu: {
                type: Sequelize.ENUM("İlköğretim", "Ortaöğretim", "Lise", "Ön Lisans", "Lisans", "Eğitim Yok"),
                allowNull: false,
            },
            surucuBelgesi: {
                type: Sequelize.ENUM("Var", "Yok"),
                allowNull: false,
            },
            yabanciDil: {
                type: Sequelize.ENUM("Yok", "İngilizce", "Almanca", "Arapça", "Diğer"),
                allowNull: false,
            },
            ekNotlar: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("inceleniyor", "kabul_edildi", "reddedildi"),
                allowNull: false,
                defaultValue: "inceleniyor",
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addConstraint("job_applications", {
            fields: ["jobId", "userId"],
            type: "unique",
            name: "unique_job_user_application",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("job_applications");
    },
};
