import { Sequelize } from "sequelize";

import config from "../config/config.js";
import { normalizeError } from "../helpers/normalizeError.js";

// Veri tabanı bilgieri
const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    dialect: config.database.dialect as any,
    logging: false
});

// Bağlantı kontrolu
const connection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log("Database connection successful");
    } catch (err) {
        console.log("Error Code:", 1002);
        import("../log/logger.js").then(m => m.error(`Database connection failed: ${normalizeError(err)}`));
    };
};

export { sequelize, connection };
