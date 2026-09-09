import config from "../config/config.js";
import { error as logError } from "./logger.js";
import { normalizeError } from "../helpers/normalizeError.js";

interface TelegramApiResponse {
    ok: boolean;
    description?: string;
}

type CrashType = "uncaughtException" | "unhandledRejection";

const TG_API_TIMEOUT_MS = 8000;
const TG_MAX_MESSAGE_LENGTH = 3500;
const TG_STACK_MAX_LINES = 12;
const TG_STACK_MAX_CHARS = 1500;

// Spam koruması: aynı hata kısa sürede tekrar gruba düşmez.
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const DEDUPE_MAX_KEYS = 500;
const recentSends = new Map<string, number>();

function shouldNotify(dedupeKey: string): boolean {
    const now = Date.now();
    const last = recentSends.get(dedupeKey);
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
    recentSends.set(dedupeKey, now);
    if (recentSends.size > DEDUPE_MAX_KEYS) {
        const oldest = recentSends.keys().next();
        if (!oldest.done) recentSends.delete(oldest.value);
    }
    return true;
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bilinen secret *değerlerini* mesajdan temizler (stack/URL içine sızmış olabilir). */
export function sanitizeSecrets(text: string): string {
    let out = text;
    const values: unknown[] = [
        config.telegram.bot_token,
        config.telegram.chat_id,
        config.database.password,
        config.session.key,
        config.email.password,
        config.cloudinary.apiSecret,
    ];
    for (const v of values) {
        if (typeof v === "string" && v.length >= 6 && out.includes(v)) {
            out = out.split(v).join("[REDACTED]");
        }
    }
    const patterns: RegExp[] = [
        /password\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /passwd\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /api[_-]?key\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /authorization\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /bearer\s+[A-Za-z0-9\-._~+/=]+/gi,
        /csrf[_-]?token\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /session[_-]?id\s*[:=]\s*['"]?[^\s'";,}]+/gi,
        /cookie\s*[:=]\s*[^\n;]+/gi,
    ];
    for (const re of patterns) {
        out = out.replace(re, "[REDACTED]");
    }
    return out;
}

export function truncateForTelegram(text: string, maxLength: number = TG_MAX_MESSAGE_LENGTH): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 20) + "\n…[kısaltıldı]";
}

/** Gönderim öncesi son adım: sanitize + truncate. */
export function prepareTelegramMessage(raw: string): string {
    return truncateForTelegram(sanitizeSecrets(raw));
}

export function splitError(err: unknown): { message: string; stack: string } {
    if (err instanceof Error) {
        const message = err.message ? `${err.name}: ${err.message}` : err.name;
        return { message, stack: typeof err.stack === "string" ? err.stack : "" };
    }
    return { message: normalizeError(err), stack: "" };
}

function shortStack(stack: string): string {
    if (!stack.trim()) return "(stack yok)";
    const lines = stack.split("\n");
    // İlk satır genelde "Name: message" tekrarıdır, atla.
    const frames = lines.length > 1 ? lines.slice(1) : lines;
    const joined = frames.slice(0, TG_STACK_MAX_LINES).join("\n").trim();
    if (!joined) return "(stack yok)";
    return joined.length > TG_STACK_MAX_CHARS
        ? joined.slice(0, TG_STACK_MAX_CHARS - 20) + "\n…[kısaltıldı]"
        : joined;
}

function timestamp(): string {
    return new Date().toISOString();
}

export function buildCrashMessage(type: CrashType, err: unknown): string {
    const { message, stack } = splitError(err);
    return [
        "🚨 KRİTİK UYGULAMA HATASI",
        "",
        "Tür:",
        type,
        "",
        "Mesaj:",
        message,
        "",
        "Zaman:",
        timestamp(),
        "",
        "Stack:",
        shortStack(stack),
    ].join("\n");
}

export function buildStartupMessage(reason: string, err: unknown, port?: number): string {
    const { message, stack } = splitError(err);
    const lines = [
        "🚨 UYGULAMA BAŞLATILAMADI",
        "",
        "Tür:",
        "Startup Error",
        "",
        "Sebep:",
        reason,
    ];
    if (port !== undefined) {
        lines.push("", "Port:", String(port));
    }
    lines.push("", "Hata:", message, "", "Zaman:", timestamp(), "", "Stack:", shortStack(stack));
    return lines.join("\n");
}

export function buildExpressMessage(method: string, path: string, err: unknown): string {
    const { message, stack } = splitError(err);
    return [
        "⚠️ EXPRESS SERVER ERROR",
        "",
        "Method:",
        method,
        "",
        "Path:",
        path,
        "",
        "Status:",
        "500",
        "",
        "Hata:",
        message,
        "",
        "Zaman:",
        timestamp(),
        "",
        "Stack:",
        shortStack(stack),
    ].join("\n");
}

export function buildDatabaseMessage(err: unknown): string {
    const { message, stack } = splitError(err);
    return [
        "🚨 DATABASE HATASI",
        "",
        "Tür:",
        "MySQL / Sequelize",
        "",
        "Mesaj:",
        message,
        "",
        "Zaman:",
        timestamp(),
        "",
        "Stack:",
        shortStack(stack),
    ].join("\n");
}

const DB_INFRA_ERROR_NAMES: ReadonlySet<string> = new Set([
    "SequelizeConnectionError",
    "SequelizeConnectionRefusedError",
    "SequelizeHostNotFoundError",
    "SequelizeConnectionTimedOutError",
    "SequelizeConnectionAcquireTimeoutError",
]);

const DB_IGNORED_ERROR_NAMES: ReadonlySet<string> = new Set([
    "SequelizeUniqueConstraintError",
    "SequelizeValidationError",
    "SequelizeForeignKeyConstraintError",
    "SequelizeEmptyResultError",
    "SequelizeOptimisticLockError",
]);

const DB_INFRA_CODES: ReadonlySet<string> = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "EHOSTUNREACH",
    "ETIMEDOUT",
    "ESOCKETTIMEDOUT",
    "ECONNRESET",
    "PROTOCOL_CONNECTION_LOST",
    "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
]);

function codeOf(value: unknown): string | undefined {
    if (typeof value === "object" && value !== null && "code" in value) {
        const code = (value as { code: unknown }).code;
        return typeof code === "string" ? code : undefined;
    }
    return undefined;
}

/** Yalnızca altyapı kaynaklı DB hataları için true (validation/unique/FK elenir). */
export function isInfrastructureDatabaseError(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const rec = err as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name : "";
    if (!name) return false;
    if (DB_IGNORED_ERROR_NAMES.has(name)) return false;
    if (DB_INFRA_ERROR_NAMES.has(name)) return true;
    if (name.startsWith("Sequelize")) {
        const codes = [codeOf(err), codeOf(rec.parent), codeOf(rec.original), codeOf(rec.cause)];
        return codes.some((c) => c !== undefined && DB_INFRA_CODES.has(c));
    }
    return false;
}

type ErrorSink = (msg: string) => void;
const dbErrorSink: ErrorSink = (msg) => logError(msg);
const consoleErrorSink: ErrorSink = (msg) => console.error(msg);

/** Ortak Telegram gönderim çekirdeği. Asla throw etmez. */
async function deliverMessage(text: string, onFailure: ErrorSink): Promise<boolean> {
    const token = config.telegram.bot_token || "";
    const chatId = config.telegram.chat_id || "";
    if (!token || !chatId) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
            signal: AbortSignal.timeout(TG_API_TIMEOUT_MS),
        });

        if (!res.ok) {
            onFailure(`Telegram logu gönderilemedi (HTTP ${res.status})`);
            return false;
        }

        const data = (await res.json()) as TelegramApiResponse;
        if (!data.ok) {
            onFailure(`Telegram logu gönderilemedi: ${data.description || "bilinmeyen hata"}`);
            return false;
        }

        return true;
    } catch (err) {
        onFailure(`Telegram logu gönderilemedi: ${err instanceof Error ? err.message : String(err)}`);
        return false;
    }
}

/**
 * Admin Telegram grubuna log mesajı gönderir (iş ilanı bildirimi bunu kullanır).
 *
 * - Başarılıysa `true`, her türlü başarısızlıkta `false` döner; asla throw etmez.
 * - Token/chatId tanımsızsa ağ isteği yapmadan sessizce `false` döner
 *   (test ortamı veya kredensiyelsiz kurulum akışı bozmaz).
 * - Hata durumunda server loguna yazar, kullanıcıya bir şey yansıtmaz.
 */
export const sendTelegramLog = async (message: string): Promise<boolean> => {
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) return false;
    return deliverMessage(text, dbErrorSink);
};

/** uncaughtException / unhandledRejection bildirimi. DB'ye dokunmaz (console yedekli). */
export const sendCrashLog = async (type: CrashType, err: unknown): Promise<boolean> => {
    return deliverMessage(prepareTelegramMessage(buildCrashMessage(type, err)), consoleErrorSink);
};

/** Startup hatası bildirimi. DB'ye dokunmaz (console yedekli). */
export const sendStartupErrorLog = async (reason: string, err: unknown, port?: number): Promise<boolean> => {
    return deliverMessage(prepareTelegramMessage(buildStartupMessage(reason, err, port)), consoleErrorSink);
};

/** Express 500 bildirimi. Fire-and-forget kullanılır; aynı hata 5 dk'da 1 kez gönderilir. */
export const sendServerErrorLog = async (method: string, path: string, err: unknown): Promise<boolean> => {
    const { message } = splitError(err);
    const errName = err instanceof Error ? err.name : typeof err;
    if (!shouldNotify(`express:${method}:${path}:${errName}:${message.slice(0, 200)}`)) return false;
    return deliverMessage(prepareTelegramMessage(buildExpressMessage(method, path, err)), consoleErrorSink);
};

/**
 * Altyapı kaynaklı DB hatası bildirimi.
 * Validation/unique/FK gibi iş mantığı hatalarında ağa çıkmadan `false` döner.
 */
export const sendDatabaseErrorLog = async (err: unknown): Promise<boolean> => {
    if (!isInfrastructureDatabaseError(err)) return false;
    if (!shouldNotify(`database:${splitError(err).message.slice(0, 200)}`)) return false;
    return deliverMessage(prepareTelegramMessage(buildDatabaseMessage(err)), consoleErrorSink);
};
