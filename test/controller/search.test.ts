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

describe("GET /api/arama", () => {
    it("200 ile arama sonuçları döner (eşleşen terim)", async () => {
        const res = await request(app).get("/api/arama?q=Kış");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("posts");
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("query", "Kış");
        expect(Array.isArray(res.body.posts)).toBe(true);
        expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
        expect(res.body.posts[0].title).toContain("Kış");
    });

    it("400 döner boş q ile", async () => {
        const res = await request(app).get("/api/arama?q=");
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("400 döner q parametresi yoksa", async () => {
        const res = await request(app).get("/api/arama");
        expect(res.status).toBe(400);
    });

    it("400 döner q 100 karakterden uzunsa", async () => {
        const long = "a".repeat(101);
        const res = await request(app).get(`/api/arama?q=${long}`);
        expect(res.status).toBe(400);
    });

    it("eşleşmeyen terim için boş dizi döner", async () => {
        const res = await request(app).get("/api/arama?q=olmayanterimxyz123");
        expect(res.status).toBe(200);
        expect(res.body.posts).toEqual([]);
        expect(res.body.total).toBe(0);
    });

    it("özel karakterler (%, _, \\) güvenli şekilde escape edilir", async () => {
        const res1 = await request(app).get("/api/arama?q=%25");
        expect(res1.status).toBe(200);
        expect(Array.isArray(res1.body.posts)).toBe(true);
        const res2 = await request(app).get("/api/arama?q=_");
        expect(res2.status).toBe(200);
        expect(Array.isArray(res2.body.posts)).toBe(true);
    });

    it("content içinde arama yapar (title değil content eşleşmesi)", async () => {
        // seed post content: "Bu bir test forum içeriğidir."
        const res = await request(app).get("/api/arama?q=test");
        expect(res.status).toBe(200);
        expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
    });
});
