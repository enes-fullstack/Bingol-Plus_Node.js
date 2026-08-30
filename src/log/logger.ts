import winston from "winston";
import Transport from "winston-transport";

import Log from "../models/log.js";
import { formatLogMessage } from "../helpers/formatLogMessage.js";

const LOG_TYPES = ["success", "info", "warning", "error", "critical"] as const;
export type LogType = typeof LOG_TYPES[number];

class SequelizeTransport extends Transport {
    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    async log(info: { message: unknown; type?: string; level: string }, callback: () => void): Promise<void> {
        const type = info.type || info.level;
        const message = formatLogMessage(info.message);

        if (!LOG_TYPES.includes(type as LogType)) {
            setImmediate(() => callback());
            return;
        }

        try {
            await Log.create({ type, message });
        } catch (err) {
            console.log("Error Code:", 1001);
        }

        setImmediate(() => callback());
    }
}

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf((info: Record<string, unknown>) => {
            const ts = info.timestamp as string;
            const t = String((info.type as string) || info.level);
            return `[${ts}] [${t.toUpperCase()}] ${info.message}`;
        })
    ),
    transports: [new SequelizeTransport()]
});

export const success = (message: unknown): void => {
    logger.log({ level: "info", message: formatLogMessage(message), type: "success" });
};

export const info = (message: unknown): void => {
    logger.log({ level: "info", message: formatLogMessage(message), type: "info" });
};

export const warning = (message: unknown): void => {
    logger.log({ level: "warn", message: formatLogMessage(message), type: "warning" });
};

export const error = (message: unknown): void => {
    logger.log({ level: "error", message: formatLogMessage(message), type: "error" });
};

export const critical = (message: unknown): void => {
    logger.log({ level: "error", message: formatLogMessage(message), type: "critical" });
};
