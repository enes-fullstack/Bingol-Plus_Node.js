// IMPORT LIBRARY
import dotenv from "dotenv";
dotenv.config();

// IMPORT FILE
import app from "./app.js";
import { connection } from "./database/connection.js";
import { defineRelationships } from "./database/relationships.js";
import { sessionStore } from "./config/session.js";
import { error } from "./log/logger.js";
import { normalizeError } from "./helpers/normalizeError.js";
import { setupCrashHandlers, withTimeout } from "./log/crashHandler.js";
import { sendStartupErrorLog } from "./log/telegramBot.js";

const STARTUP_SEND_TIMEOUT_MS = 10000;

// uncaughtException / unhandledRejection -> Telegram + exit(1)
setupCrashHandlers();

// PROMISE CHAIN
(async () => {
    try {
        await connection();
        await sessionStore.sync();
        defineRelationships();
    } catch (err) {
        error(`Uygulama başlatılırken hata: ${normalizeError(err)}`);
        // Telegram başarısız olsa bile tavan sürede çıkış yapılır.
        await withTimeout(sendStartupErrorLog("Uygulama başlatılamadı", err), STARTUP_SEND_TIMEOUT_MS, false);
        process.exit(1);
    }
})();

// PORT
const port: number = process.env.PORT ? Number(process.env.PORT) : 3000;
const server = app.listen(port, "0.0.0.0", () => console.log(`\nEnvironment: ${process.env.NODE_ENV}\nServer is running on port ${port}`));

function listenErrorCode(err: unknown): string {
    if (typeof err === "object" && err !== null && "code" in err) {
        const code = (err as { code: unknown }).code;
        return typeof code === "string" ? code : "";
    }
    return "";
}

server.on("error", (err: unknown) => {
    const code = listenErrorCode(err);
    const reason = code === "EADDRINUSE" ? "Port kullanılıyor" : "Server başlatılamadı";
    error(`Server başlatılırken hata: ${normalizeError(err)}`);
    void withTimeout(sendStartupErrorLog(reason, err, port), STARTUP_SEND_TIMEOUT_MS, false).finally(() => process.exit(1));
});
