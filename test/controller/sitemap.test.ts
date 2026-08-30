import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;

beforeAll(async () => {
    await setupTestDatabase();
    const appModule = await import("../../src/app.js");
    app = appModule.default;
    await seedTestData();
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("GET /sitemap.xml", () => {
    it("200 ile XML döner ve content-type doğru", async () => {
        const res = await request(app).get("/sitemap.xml");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/xml/);
        expect(res.text).toContain("<?xml");
        expect(res.text).toContain("<urlset");
    });

    it("statik sayfaları içerir", async () => {
        const res = await request(app).get("/sitemap.xml");
        expect(res.text).toContain("<loc>https://bingolplus.com/</loc>");
        expect(res.text).toContain("/forum");
        expect(res.text).toContain("/ilanlar");
        expect(res.text).toContain("/hakkimizda");
        expect(res.text).toContain("/iletisim");
    });

    it("forum konularını slug ile içerir", async () => {
        const res = await request(app).get("/sitemap.xml");
        // seed'deki post başlığı "Bingöl'de Kış Hazırlıkları" slug'ı "bingolde-kis-hazirliklari"
        expect(res.text).toContain("/forum/konu/");
        expect(res.text).toContain("bingolde-kis-hazirliklari");
        expect(res.text).toContain("<lastmod>");
    });

    it("iş ilanlarını slug ile içerir", async () => {
        const res = await request(app).get("/sitemap.xml");
        expect(res.text).toContain("/ilanlar/");
        expect(res.text).toContain("web-gelistirici");
    });

    it("SITE_URL base kullanır (undefined değil)", async () => {
        const res = await request(app).get("/sitemap.xml");
        expect(res.text).not.toContain("undefined/forum");
        expect(res.text).not.toContain("undefined/ilanlar");
    });
});
