import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;
let postId: number;

async function getCsrfToken(agent: request.Agent, url: string): Promise<string> {
    const res = await agent.get(url);
    let match = res.text.match(/name="_csrf"\s+value="([^"]+)"/);
    if (!match) {
        match = res.text.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
    }
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
    const result = await seedTestData();
    postId = result.post.id;
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("GET /forum", () => {
    it("200 ile forum listesini döner (kategori kartları)", async () => {
        const res = await request(app).get("/forum");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Bingöl Forumu");
        expect(res.text).toContain("Genel");
        expect(res.text).toContain("Bingöl Gündemi");
        expect(res.text).toContain("Soru &amp; Cevap");
    });

    it("kategori sayılarını içerir", async () => {
        const res = await request(app).get("/forum");
        expect(res.status).toBe(200);
        // Bingöl Gündemi kategorisinde 1 konu var (seed)
        expect(res.text).toContain("Bingöl Gündemi");
        expect(res.text).toContain("1</span> konu");
    });
});

describe("GET /forum/konu/:id", () => {
    it("200 ile detay sayfasını döner", async () => {
        const res = await request(app).get(`/forum/konu/${postId}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kış Hazırlıkları");
    });

    it("var olmayan postId ile 404 döner", async () => {
        const res = await request(app).get("/forum/konu/999");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Sayfa Bulunamadı");
    });

    it("geçersiz id ile /forum yönlendirir", async () => {
        const res = await request(app).get("/forum/konu/abc");
        expectRedirect(res, "/forum");
    });
});

describe("GET /forum/akis", () => {
    it("200 ile akış sayfasını döner", async () => {
        const res = await request(app).get("/forum/akis");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kış Hazırlıkları");
    });
});

describe("GET /forum/akis/:kategori", () => {
    it("200 ile kategoriye göre akış sayfasını döner", async () => {
        const res = await request(app).get("/forum/akis/bingol-gundemi");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kış Hazırlıkları");
    });

    it("var olmayan kategori ile 404 döner", async () => {
        const res = await request(app).get("/forum/akis/olmayan-kategori");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Sayfa Bulunamadı");
    });
});

describe("POST /forum/konu-ac", () => {
    it("giriş yapmamışsa 302 ile /giris-yap yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post("/forum/konu-ac").type("form").send({ _csrf: csrf, title: "Başlık", content: "İçerik" });
        expectRedirect(res, "/giris-yap");
    });

    it("giriş yapmışsa 302 ile /forum yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/konu-ac");

        const { default: PostCategory } = await import("../../src/models/postCategory.js");
        const cat = await PostCategory.findOne({ where: { name: "Genel" } });

        const res = await agent.post("/forum/konu-ac").type("form").send({ _csrf: csrf2, title: "Test Konu Başlığı", content: "Bu bir test konusu içeriğidir. Yeterli uzunlukta olmalıdır.", categoryId: cat!.id });
        expectRedirect(res, "/forum");
    });

    it("geçersiz veri ile aynı sayfaya yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/konu-ac");
        const res = await agent.post("/forum/konu-ac").type("form").send({ _csrf: csrf2, title: "abc", content: "kısa" });
        expectRedirect(res, "/forum/konu-ac");
    });
});
