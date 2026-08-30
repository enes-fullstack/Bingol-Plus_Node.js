import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;

/**
 * GET a page and extract the CSRF token from an <input name="_csrf"> hidden field.
 */
async function getCsrfToken(agent: request.Agent, url: string): Promise<string> {
    const res = await agent.get(url);
    const match = res.text.match(/name="_csrf"\s+value="([^"]+)"/);
    if (!match) {
        throw new Error(`CSRF token not found on ${url}. Body: ${res.text.slice(0, 500)}`);
    }
    return match[1];
}

async function loginAs(agent: request.Agent, username: string, password: string) {
    const token = await getCsrfToken(agent, "/giris-yap");
    const res = await agent.post("/giris-yap").type("form").send({
        _csrf: token,
        username,
        password,
    });
    // Login redirects to / on success
    if (res.status !== 302) {
        throw new Error(`Login failed for ${username}: status ${res.status}, body: ${res.text.slice(0, 300)}`);
    }
}

beforeAll(async () => {
    await setupTestDatabase();
    const appModule = await import("../../src/app.js");
    app = appModule.default;
    const { admin, post } = await seedTestData();

    (globalThis as any).__testAdmin = admin;
    (globalThis as any).__testPost = post;
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("Admin — yetkilendirme", () => {
    it("giriş yapmamış kullanıcı 404 görür (yetkisiz)", async () => {
        const res = await request(app).get("/admin");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Sayfa Bulunamadı");
    });

    it("normal kullanıcı (user) 404 görür (yetkisiz)", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");

        const res = await agent.get("/admin");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Sayfa Bulunamadı");
    });
});

describe("Admin — GET", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("GET /admin -> dashboard 200 döner", async () => {
        const res = await adminAgent.get("/admin");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Admin Paneli");
    });

    it("GET /admin/ilan-ekle -> ilan ekleme formu 200 döner", async () => {
        const res = await adminAgent.get("/admin/ilan-ekle");
        expect(res.status).toBe(200);
        expect(res.text).toContain("İlan Ekle");
    });

    it("GET /admin/talepler -> talep listesi 200 döner", async () => {
        const res = await adminAgent.get("/admin/talepler");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Talep");
    });

    it("GET /admin/kullanicilar -> kullanıcı listesi 200 döner", async () => {
        const res = await adminAgent.get("/admin/kullanicilar");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kullanıcılar");
    });

    it("GET /admin/loglar -> log listesi 200 döner", async () => {
        const res = await adminAgent.get("/admin/loglar");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Log");
    });
});

describe("Admin — POST /admin/ilan-ekle", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("geçerli form ile ilan ekler", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/ilan-ekle");
        const res = await adminAgent
            .post("/admin/ilan-ekle")
            .type("form")
            .send({
                _csrf: token,
                title: "Yeni Test İlanı",
                description: "Uzun açıklama metni burada yer alıyor en az elli karakter olmalı.",
                company: "Test A.Ş.",
                location: "Bingöl",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin");
    });

    it("eksik alanlarla ilan eklenemez (yönlendirilir)", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/ilan-ekle");
        const res = await adminAgent
            .post("/admin/ilan-ekle")
            .type("form")
            .send({
                _csrf: token,
                title: "",
                company: "",
                location: "",
                description: "",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/ilan-ekle");
    });
});

describe("Admin — POST /admin/kullanici-ban/:id", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("normal kullanıcıyı banlar", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent.post(`/admin/kullanici-ban/${normalUserId}`).type("form").send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kullanicilar");
    });
});

describe("Admin — POST /admin/konu-sil/:postId", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("forum konusunu siler", async () => {
        const postId = (globalThis as any).__testPost.id;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent.post(`/admin/konu-sil/${postId}`).type("form").send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/forum");
    });
});
