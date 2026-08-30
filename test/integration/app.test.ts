import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "./setup.js";
import { seedTestData } from "./seed.js";

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

describe("Ana Sayfa", () => {
    it("GET / -> 200 dönmeli ve seed verilerini içermeli", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        // Homepage artık job strip göstermiyor, forum akışını gösteriyor
        expect(res.text).toContain("Bingöl'de neler konuşuluyor");
        expect(res.text).toContain("Kış Hazırlıkları");
        expect(res.text).toContain("Bingöl Gündemi");
        expect(res.text).toContain("Bingöl Plus");
    });

    it("session middleware çalışıyor (flash mesajı eklenebiliyor)", async () => {
        const agent = request.agent(app);
        const res = await agent.get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kış Hazırlıkları");
    });

    it("GET /ilanlar -> iş ilanlarını listeler", async () => {
        const res = await request(app).get("/ilanlar");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Web Geliştirici");
        expect(res.text).toContain("Muhasebe Uzmanı");
        expect(res.text).toContain("Satış Danışmanı");
        expect(res.text).toContain("İş İlanları");
    });

    it("GET /iletisim, /hakkimizda, /gizlilik-politikasi gibi statik sayfalar 200 döner", async () => {
        const pages = [
            ["/iletisim", "İletişim"],
            ["/hakkimizda", "Hakkımızda"],
            ["/gizlilik-politikasi", "Gizlilik"],
            ["/kullanim-sartlari", "Kullanım"],
            ["/cerez-politikasi", "Çerez"],
        ] as const;
        for (const [path, needle] of pages) {
            const res = await request(app).get(path);
            expect(res.status).toBe(200);
            expect(res.text).toContain(needle);
        }
    });
});

describe("Veritabanı", () => {
    it("seed verileri gerçek MySQL'de sorgulanabiliyor", async () => {
        const { sequelize } = await import("../../src/database/connection.js");
        const [jobs] = await sequelize.query("SELECT COUNT(*) as count FROM jobs");
        const jobCount = (jobs as any[])[0].count;
        expect(jobCount).toBe(3);

        const [posts] = await sequelize.query("SELECT COUNT(*) as count FROM posts");
        const postCount = (posts as any[])[0].count;
        expect(postCount).toBe(1);

        const [users] = await sequelize.query("SELECT COUNT(*) as count FROM users");
        const userCount = (users as any[])[0].count;
        expect(userCount).toBe(2);
    });

    it("bingol_test veritabanında çalışıyor", async () => {
        const { sequelize } = await import("../../src/database/connection.js");
        const [rows] = await sequelize.query("SELECT DATABASE() as db");
        const dbName = (rows as any[])[0].db;
        expect(dbName).toBe(process.env.DB_NAME);
    });
});
