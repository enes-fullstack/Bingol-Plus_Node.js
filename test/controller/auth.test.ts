import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

vi.mock("../../src/services/mail.js", () => ({
    sendResetEmail: vi.fn().mockResolvedValue(undefined),
    sendJobNotification: vi.fn().mockResolvedValue(undefined),
}));

let app: any;

async function getCsrfToken(agent: request.Agent, url: string): Promise<string> {
    const res = await agent.get(url);
    const match = res.text.match(/name="_csrf"\s+value="([^"]+)"/);
    if (!match) {
        throw new Error(`CSRF token not found on ${url}. Body: ${res.text.slice(0, 500)}`);
    }
    return match[1];
}

function expectRedirect(res: request.Response, location: string) {
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(location);
}

beforeAll(async () => {
    await setupTestDatabase();
    const appModule = await import("../../src/app.js");
    app = appModule.default;
    await seedTestData();
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("GET — auth sayfaları", () => {
    it("GET /giris-yap → 200 giriş formu", async () => {
        const res = await request(app).get("/giris-yap");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Giriş Yap");
    });

    it("GET /kayit-ol → 200 kayıt formu", async () => {
        const res = await request(app).get("/kayit-ol");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kayıt Ol");
    });

    it("GET /sifremi-unuttum → 200 şifre sıfırlama formu", async () => {
        const res = await request(app).get("/sifremi-unuttum");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Şifremi Unuttum");
    });

    it("GET /cikis-yap → 302 anasayfa", async () => {
        const res = await request(app).get("/cikis-yap");
        expectRedirect(res, "/");
    });
});

describe("POST /giris-yap", () => {
    let agent: request.Agent;

    beforeAll(() => { agent = request.agent(app); });

    it("yanlış şifre ile giriş başarısız", async () => {
        const token = await getCsrfToken(agent, "/giris-yap");
        const res = await agent.post("/giris-yap").type("form").send({ _csrf: token, username: "testuser", password: "wrongpass1" });
        expectRedirect(res, "/giris-yap");
    });

    it("başarılı giriş anasayfaya yönlendirir", async () => {
        const token = await getCsrfToken(agent, "/giris-yap");
        const res = await agent.post("/giris-yap").type("form").send({ _csrf: token, username: "testuser", password: "test1234" });
        expectRedirect(res, "/");
    });
});

describe("POST /kayit-ol", () => {
    let agent: request.Agent;

    beforeAll(() => { agent = request.agent(app); });

    it("mevcut email ile kayıt başarısız", async () => {
        const token = await getCsrfToken(agent, "/kayit-ol");
        const res = await agent.post("/kayit-ol").type("form").send({ _csrf: token, email: "test@test.com", username: "baskauser", password: "sifre1234" });
        expectRedirect(res, "/kayit-ol");
    });

    it("başarılı kayıt giriş sayfasına yönlendirir", async () => {
        const token = await getCsrfToken(agent, "/kayit-ol");
        const res = await agent.post("/kayit-ol").type("form").send({ _csrf: token, email: "yeni@test.com", username: "yenikullanici", password: "sifre1234" });
        expectRedirect(res, "/giris-yap");
    });
});

describe("POST /sifremi-unuttum", () => {
    it("geçerli email ile başarılı mesaj", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/sifremi-unuttum");
        const res = await agent.post("/sifremi-unuttum").type("form").send({ _csrf: token, email: "test@test.com" });
        expectRedirect(res, "/giris-yap");
    });

    it("var olmayan email ile de başarılı mesaj (güvenlik)", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/sifremi-unuttum");
        const res = await agent.post("/sifremi-unuttum").type("form").send({ _csrf: token, email: "olmayan@test.com" });
        expectRedirect(res, "/giris-yap");
    });
});

describe("GET /sifre-sifirla/:token", () => {
    let validToken: string;

    beforeAll(async () => {
        const { default: User } = await import("../../src/models/user.js");
        const { default: PasswordReset } = await import("../../src/models/passwordReset.js");
        const user = await User.findOne({ where: { username: "testuser" } });
        // Yeni token oluştur (plaintext) ve hash'ini DB'ye kaydet — controller artık hash saklıyor
        validToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(validToken).digest("hex");
        await PasswordReset.create({ userId: user!.id, token: tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    });

    it("geçerli token ile form gösterir", async () => {
        const res = await request(app).get(`/sifre-sifirla/${validToken}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Şifre Sıfırla");
    });

    it("geçersiz token ile 404 döner", async () => {
        const res = await request(app).get("/sifre-sifirla/gecersiz-token-123456");
        expect(res.status).toBe(404);
    });
});

describe("POST /sifre-sifirla/:token", () => {
    let agent: request.Agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    it("başarılı şifre sıfırlama ve token işaretlenir", async () => {
        const { default: User } = await import("../../src/models/user.js");
        const { default: PasswordReset } = await import("../../src/models/passwordReset.js");
        const user = await User.findOne({ where: { username: "testuser" } });
        const newToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(newToken).digest("hex");
        await PasswordReset.create({ userId: user!.id, token: tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });

        const csrf = await getCsrfToken(agent, `/sifre-sifirla/${newToken}`);
        const res = await agent.post(`/sifre-sifirla/${newToken}`).type("form").send({ _csrf: csrf, password: "yenisifre123" });
        expectRedirect(res, "/giris-yap");

        const record = await PasswordReset.findOne({ where: { token: tokenHash } });
        expect(record?.usedAt).not.toBeNull();
    });
});
