import session from "express-session";
import connectSessionSequelize from "connect-session-sequelize";
import { Op } from "sequelize";
import { sequelize } from "../database/connection.js";
import config from "./config.js";

const SequelizeStore = connectSessionSequelize(session.Store);
export const sessionStore = new SequelizeStore({ db: sequelize });

export const destroyUserSessions = async (userId: number): Promise<void> => {
    const model = (sessionStore as unknown as { sessionModel?: any }).sessionModel;
    if (!model || !userId) return;

    const rows = await model.findAll({
        where: { data: { [Op.like]: `%"userId":${userId}%` } }
    });

    const sids = rows
        .map((row: any) => ({ sid: row.get("sid"), data: row.get("data") }))
        .filter(({ data }: { data: unknown }) => {
            try {
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                return parsed?.userId === userId;
            } catch {
                return false;
            }
        })
        .map(({ sid }: { sid: string }) => sid);

    for (const sid of sids) {
        await new Promise<void>((resolve) => {
            sessionStore.destroy(sid, () => resolve());
        });
    }
};

const SESSION_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export const destroyStaleUserSessions = async (userId: number): Promise<void> => {
    const model = (sessionStore as unknown as { sessionModel?: any }).sessionModel;
    if (!model || !userId) return;

    const rows = await model.findAll({
        where: { data: { [Op.like]: `%"userId":${userId}%` } }
    });

    const userSessions = rows
        .map((row: any) => ({
            sid: row.get("sid") as string,
            createdAt: row.get("createdAt") ? new Date(row.get("createdAt")).getTime() : Date.now(),
            data: row.get("data")
        }))
        .filter(({ data }: { data: unknown }) => {
            try {
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                return parsed?.userId === userId;
            } catch {
                return false;
            }
        });

    if (userSessions.length === 0) return;

    const lastLoginAt = Math.max(...userSessions.map((s: { createdAt: number }) => s.createdAt));
    if (Date.now() - lastLoginAt < SESSION_STALE_MS) return;

    for (const { sid } of userSessions) {
        await new Promise<void>((resolve) => {
            sessionStore.destroy(sid, () => resolve());
        });
    }
};

export const sessionMiddleware = session({
    store: sessionStore,
    secret: config.session.key,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
        httpOnly: true,
        // "auto" -> https'te Secure, http'te değil; development http + production https ikisi de çalışır
        secure: process.env.NODE_ENV === "production" ? "auto" : false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
});
