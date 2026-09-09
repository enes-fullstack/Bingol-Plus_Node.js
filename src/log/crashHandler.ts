import { sendCrashLog } from "./telegramBot.js";
import { normalizeError } from "../helpers/normalizeError.js";

type CrashType = "uncaughtException" | "unhandledRejection";

const CRASH_SEND_TIMEOUT_MS = 10000;

let installed = false;

/** Sözü tavan sürede yerine getirir; asla takılı kalmaz, asla throw etmez. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), ms);
            }),
        ]);
    } catch {
        return fallback;
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

async function handleFatal(type: CrashType, err: unknown): Promise<void> {
    try {
        console.error(`[FATAL] ${type}:`, normalizeError(err));
    } catch {
        // console bile yazamazsa yapacak bir şey yok
    }
    try {
        await withTimeout(sendCrashLog(type, err), CRASH_SEND_TIMEOUT_MS, false);
    } catch {
        // sendCrashLog zaten asla throw etmez; ekstra güvence
    }
    process.exit(1);
}

/**
 * uncaughtException / unhandledRejection yakalayıcılarını kurar.
 * Telegram gönderimi tavanlı beklenir, ardından process.exit(1) uygulanır.
 * Test ortamında (vitest worker'ını öldürmemek için) pasif kalır.
 */
export function setupCrashHandlers(): void {
    if (installed) return;
    installed = true;
    if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
    process.on("uncaughtException", (err) => {
        void handleFatal("uncaughtException", err);
    });
    process.on("unhandledRejection", (reason) => {
        void handleFatal("unhandledRejection", reason);
    });
}
