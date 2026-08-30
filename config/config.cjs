const dotenv = require("dotenv");

let envFile;

if (process.env.NODE_ENV === "test") {
    envFile = ".env.test";
} else if (process.env.NODE_ENV === "development") {
    envFile = ".env.development";
} else {
    envFile = ".env";
}

dotenv.config({
    path: envFile,
    override: true
});

const database = {
    development: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
    },

    test: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_TEST,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
    },

    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
    }
};

module.exports = database;