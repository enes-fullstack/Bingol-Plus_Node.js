"use strict";

const bcrypt = require("bcryptjs");
require("dotenv").config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const adminHashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        const hashedPassword = await bcrypt.hash(process.env.USER_PASSWORD, 10);

        await queryInterface.bulkInsert("users", [
            {
                email: process.env.ADMIN_EMAIL,
                username: process.env.ADMIN_USERNAME,
                password: adminHashedPassword,
                role: "admin",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "faruk@gmail.com",
                username: "Faruk",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899792/x1_sg9rmv.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "bingollu@gmail.com",
                username: "bingollu",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899793/x2_eqvc86.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "deza@gmail.com",
                username: "deza",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899793/x6_spn77w.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "uydukent@gmail.com",
                username: "Uydukent",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899794/x8_giqy4o.png",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "sevdahanim@gmail.com",
                username: "sevdahanim",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899798/x4_obltqk.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "mustafa@gmail.com",
                username: "mustafa",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899794/x5_blawtp.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "murat12@gmail.com",
                username: "Murat12",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899793/x3_jescmp.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "ahmet38@gmail.com",
                username: "Ahmet38",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899795/x9_egmnzu.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "gencli49@gmail.com",
                username: "Gencli49",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899795/xqp_ogst5u.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "solhanli@gmail.com",
                username: "Solhanli",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899793/x3_jescmp.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "hasasn23i@gmail.com",
                username: "hasasn23",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899795/zx1_deg0xw.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "gencli@gmail.com",
                username: "Gencli",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899795/x7_fopjcv.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "yayladere@gmail.com",
                username: "Yayladere",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "adakli@gmail.com",
                username: "Adakli",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "kigiliseyyah@gmail.com",
                username: "Kigiliseyyah",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "defne49@gmail.com",
                username: "Defne49",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899796/xqy_ske84s.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "yusufbingol@gmail.com",
                username: "YusufBingol",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899795/xqy_aiojwo.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "burcu2@gmail.com",
                username: "Burcu",
                password: hashedPassword,
                profileImage: "https://res.cloudinary.com/diro3o1um/image/upload/v1786899796/xqu_f1wokh.jpg",
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "bingollisesi@gmail.com",
                username: "BingolLisesi",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "mehmetk@gmail.com",
                username: "MehmetK",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "emre49@gmail.com",
                username: "Emre49",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "karliova12@gmail.com",
                username: "Karliova12",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "saricicek@gmail.com",
                username: "SariCicek",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                email: "muratnehir@gmail.com",
                username: "MuratNehir",
                password: hashedPassword,
                role: "user",
                banned: false,
                ip: "127.0.0.1",
                userAgent: "Seeder",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("users", { username: "enes" }, {});
    }
};
