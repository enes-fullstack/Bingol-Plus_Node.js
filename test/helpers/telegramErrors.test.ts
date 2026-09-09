import { describe, it, expect } from "vitest";
import {
    truncateForTelegram,
    sanitizeSecrets,
    prepareTelegramMessage,
    splitError,
    buildCrashMessage,
    buildStartupMessage,
    buildExpressMessage,
    buildDatabaseMessage,
    isInfrastructureDatabaseError,
    sendTelegramLog,
    sendDatabaseErrorLog,
} from "../../src/log/telegramBot.js";
import { withTimeout } from "../../src/log/crashHandler.js";

describe("truncateForTelegram", () => {
    it("kısa metni aynen bırakır", () => {
        expect(truncateForTelegram("hata")).toBe("hata");
    });

    it("uzun metni limitte keser", () => {
        const out = truncateForTelegram("x".repeat(5000), 100);
        expect(out.length).toBeLessThanOrEqual(100);
        expect(out).toContain("kısaltıldı");
    });
});

describe("sanitizeSecrets", () => {
    it("password= değerini redact eder", () => {
        const out = sanitizeSecrets("login failed password=hunter2 end");
        expect(out).not.toContain("hunter2");
        expect(out).toContain("[REDACTED]");
    });

    it("Bearer tokeni redact eder", () => {
        const out = sanitizeSecrets("Authorization Bearer abcdef123456 tail");
        expect(out).not.toContain("abcdef123456");
    });

    it("normal metne dokunmaz", () => {
        const text = "Cannot read properties of undefined (reading 'title')";
        expect(sanitizeSecrets(text)).toBe(text);
    });
});

describe("splitError", () => {
    it("Error nesnesinden mesaj ve stack çıkarır", () => {
        const err = new Error("boom");
        const { message, stack } = splitError(err);
        expect(message).toContain("boom");
        expect(stack).toContain("boom");
    });

    it("Error olmayan değerleri normalize eder, çökmez", () => {
        expect(splitError("düz string").message).toBe("düz string");
        expect(splitError(null).message).toBe("null");
        expect(splitError(undefined).message).toBe("undefined");
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        expect(() => splitError(circular)).not.toThrow();
    });
});

describe("mesaj builder'lar", () => {
    it("crash mesajı tür/zaman/stack içerir", () => {
        const out = buildCrashMessage("uncaughtException", new Error("Cannot read properties of undefined"));
        expect(out).toContain("KRİTİK UYGULAMA HATASI");
        expect(out).toContain("uncaughtException");
        expect(out).toContain("Zaman:");
        expect(out).toContain("Cannot read properties of undefined");
    });

    it("startup mesajı sebep ve port içerir", () => {
        const out = buildStartupMessage("Port kullanılıyor", new Error("EADDRINUSE"), 3000);
        expect(out).toContain("BAŞLATILAMADI");
        expect(out).toContain("Port kullanılıyor");
        expect(out).toContain("3000");
    });

    it("express mesajı method/path içerir, secret içermez (prepare sonrası)", () => {
        const raw = buildExpressMessage("GET", "/profilim", new Error("boom password=s3cr3t-x"));
        expect(raw).toContain("GET");
        expect(raw).toContain("/profilim");
        const prepared = prepareTelegramMessage(raw);
        expect(prepared).not.toContain("s3cr3t-x");
        expect(prepared.length).toBeLessThanOrEqual(3500);
    });

    it("uzun stack limit altında kalır", () => {
        const err = new Error("boom");
        err.stack = "Error: boom\n" + Array.from({ length: 200 }, (_, i) => `    at fn${i} (file.js:${i}:1)`).join("\n");
        const prepared = prepareTelegramMessage(buildDatabaseMessage(err));
        expect(prepared.length).toBeLessThanOrEqual(3500);
    });
});

describe("isInfrastructureDatabaseError", () => {
    it("bağlantı hatalarını altyapı sayar", () => {
        expect(isInfrastructureDatabaseError({ name: "SequelizeConnectionRefusedError", message: "x" })).toBe(true);
        expect(isInfrastructureDatabaseError({ name: "SequelizeHostNotFoundError", message: "x" })).toBe(true);
        expect(
            isInfrastructureDatabaseError({ name: "SequelizeConnectionError", parent: { code: "ECONNREFUSED" } })
        ).toBe(true);
    });

    it("iş mantığı hatalarını filtreler", () => {
        expect(isInfrastructureDatabaseError({ name: "SequelizeUniqueConstraintError" })).toBe(false);
        expect(isInfrastructureDatabaseError({ name: "SequelizeValidationError" })).toBe(false);
        expect(isInfrastructureDatabaseError({ name: "SequelizeForeignKeyConstraintError" })).toBe(false);
        expect(isInfrastructureDatabaseError({ name: "Error", message: "sıradan" })).toBe(false);
        expect(isInfrastructureDatabaseError(null)).toBe(false);
        expect(isInfrastructureDatabaseError("ECONNREFUSED")).toBe(false);
    });
});

describe("ağa çıkmayan no-op yollar", () => {
    it("boş mesaj ağa çıkmadan false döner", async () => {
        await expect(sendTelegramLog("")).resolves.toBe(false);
        await expect(sendTelegramLog("   ")).resolves.toBe(false);
    });

    it("validation hatası DB bildirimi göndermez", async () => {
        await expect(sendDatabaseErrorLog({ name: "SequelizeUniqueConstraintError" })).resolves.toBe(false);
    });
});

describe("withTimeout", () => {
    it("hızlı promise sonucunu geçirir", async () => {
        await expect(withTimeout(Promise.resolve(42), 1000, -1)).resolves.toBe(42);
    });

    it("yavaş promise'te fallback döner, takılmaz", async () => {
        const slow = new Promise<boolean>(() => {});
        await expect(withTimeout(slow, 20, false)).resolves.toBe(false);
    });

    it("reject eden promise'te fallback döner", async () => {
        await expect(withTimeout(Promise.reject(new Error("x")), 1000, "fb")).resolves.toBe("fb");
    });
});
