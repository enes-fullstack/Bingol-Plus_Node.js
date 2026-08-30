// IMPORT LIBRARY
import dotenv from "dotenv";
dotenv.config();

// IMPORT FILE
import app from "./app.js";
import { connection } from "./database/connection.js";
import { defineRelationships } from "./database/relationships.js";
import { sessionStore } from "./config/session.js";
import { error } from "./log/logger.js";
import { formatLogMessage } from "./helpers/formatLogMessage.js";

// PROMISE CHAIN
(async () => {
    try {
        await connection();
        await sessionStore.sync();
        defineRelationships();
    } catch (err) {
        error(`Uygulama başlatılırken hata: ${formatLogMessage(err)}`);
        process.exit(1);
    }
})();

// PORT
const port: number = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, "0.0.0.0", () => console.log(`\nEnvironment: ${process.env.NODE_ENV}\nServer is running on port ${port}`));
