import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;
let agent: request.Agent;
let adminAgent: request.Agent;
let testPostId: number;
let testJobId: number;

async function getCsrfToken(agent: request.Agent, url: string): Promise<string> {
    const res = await agent.get(url);
    // try hidden input first
    let match = res.text.match(/name="_csrf"\s+value="([^"]+)"/);
    // fall back to meta tag
    if (!match) {
        match = res.text.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
    }
    if (!match) {
        throw new Error(`CSRF token not found on ${url}. Body: ${res.text.slice(0, 500)}`);
    }
    return match[1];
}

async function loginAs(agent: request.Agent, username: string, password: string) {
    const token = await getCsrfToken(agent, "/forum/akis");
    const res = await agent.post("/giris-yap").type("form").send({ _csrf: token, username, password });
    if (res.status !== 302) {
        throw new Error(`Login failed for ${username}: ${res.status}`);
    }
}

beforeAll(async () => {
    await setupTestDatabase();
    const appModule = await import("../../src/app.js");
    app = appModule.default;
    const { user, admin, post } = await seedTestData();

    testPostId = post.id;
    testJobId = 1; // first job created by seed

    agent = request.agent(app);
    await loginAs(agent, "testuser", "test1234");

    adminAgent = request.agent(app);
    await loginAs(adminAgent, "adminuser", "test1234");
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("GET /api/posts", () => {
    it("200 ile post listesi döner", async () => {
        const res = await request(app).get("/api/posts");

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("posts");
        expect(res.body).toHaveProperty("hasMore");
        expect(res.body).toHaveProperty("isAdmin");
        expect(Array.isArray(res.body.posts)).toBe(true);
        expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
        expect(res.body.posts[0]).toHaveProperty("title");
        expect(res.body.posts[0]).toHaveProperty("slug");
    });

    it("isAdmin false olmali giris yapmamissa", async () => {
        const res = await request(app).get("/api/posts");
        expect(res.body.isAdmin).toBe(false);
    });

    it("isAdmin true olmali admin kullanici icin", async () => {
        const res = await adminAgent.get("/api/posts");
        expect(res.body.isAdmin).toBe(true);
    });

    it("offset ile sayfalama calisiyor", async () => {
        const res = await request(app).get("/api/posts?offset=0");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.posts)).toBe(true);
    });

    it("offset cok yuksekse bos dizi gelir", async () => {
        const res = await request(app).get("/api/posts?offset=9999");
        expect(res.status).toBe(200);
        expect(res.body.posts).toEqual([]);
        expect(res.body.hasMore).toBe(false);
    });

    it("kategori filtresi calisiyor", async () => {
        const res = await request(app).get("/api/posts?category=bingol-gundemi");
        expect(res.status).toBe(200);
        expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
    });

    it("gecersiz kategori filtresinde bos dizi gelir", async () => {
        const res = await request(app).get("/api/posts?category=olmayan-kategori");
        expect(res.status).toBe(200);
        expect(res.body.posts).toEqual([]);
    });
});

describe("GET /api/yanitlar/:postId", () => {
    it("200 ile yanit listesi döner (bos liste olabilir)", async () => {
        const res = await request(app).get(`/api/yanitlar/${testPostId}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("replies");
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("hasMore");
        expect(Array.isArray(res.body.replies)).toBe(true);
    });

    it("400 hata verir gecersiz postId ile", async () => {
        const res = await request(app).get("/api/yanitlar/abc");
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });
});

describe("POST /api/ilan-kaydet/:jobId", () => {
    it("giris yapmamissa 302 ile giris sayfasina yonlendirir", async () => {
        const unauthAgent = request.agent(app);
        const token = await getCsrfToken(unauthAgent, "/forum/akis");
        const res = await unauthAgent.post(`/api/ilan-kaydet/${testJobId}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
    });

    it("201 ile ilani kaydeder", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/ilan-kaydet/${testJobId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ saved: true });
    });

    it("200 ile kaydi geri alir", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/ilan-kaydet/${testJobId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ saved: false });
    });

    it("400 hata verir gecersiz jobId ile", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post("/api/ilan-kaydet/abc")
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ saved: false, error: "Geçersiz ilan ID" });
    });
});

describe("POST /api/post-begen/:postId", () => {
    it("giris yapmamissa 302 ile giris sayfasina yonlendirir", async () => {
        const unauthAgent = request.agent(app);
        const token = await getCsrfToken(unauthAgent, "/forum/akis");
        const res = await unauthAgent.post(`/api/post-begen/${testPostId}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
    });

    it("201 ile postu begenir", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/post-begen/${testPostId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(201);
        expect(res.body.liked).toBe(true);
        expect(typeof res.body.likes).toBe("number");
    });

    it("200 ile begeniyi geri alir", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/post-begen/${testPostId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(200);
        expect(res.body.liked).toBe(false);
        expect(typeof res.body.likes).toBe("number");
    });

    it("400 hata verir gecersiz postId ile", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post("/api/post-begen/abc")
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ liked: false, error: "Geçersiz post ID" });
    });
});

describe("POST /api/yanit-ekle/:postId", () => {
    it("giris yapmamissa 302 ile giris sayfasina yonlendirir", async () => {
        const unauthAgent = request.agent(app);
        const token = await getCsrfToken(unauthAgent, "/forum/akis");
        const res = await unauthAgent.post(`/api/yanit-ekle/${testPostId}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
    });

    it("201 ile yanit ekler", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/yanit-ekle/${testPostId}`)
            .type("form")
            .send({ _csrf: token, content: "Harika bir konu, teşekkürler!" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("reply");
        expect(res.body.reply).toHaveProperty("content", "Harika bir konu, teşekkürler!");
        expect(res.body.reply).toHaveProperty("postId", testPostId);
    });

    it("400 hata verir bos icerikle", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post(`/api/yanit-ekle/${testPostId}`)
            .type("form")
            .send({ _csrf: token, content: "" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("400 hata verir gecersiz postId ile", async () => {
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent
            .post("/api/yanit-ekle/abc")
            .type("form")
            .send({ _csrf: token, content: "Geçerli içerik" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("eklenen yanit GET /api/yanitlar/:postId ile goruntulenebilir", async () => {
        const res = await request(app).get(`/api/yanitlar/${testPostId}`);

        expect(res.status).toBe(200);
        expect(res.body.total).toBeGreaterThanOrEqual(1);
        const found = res.body.replies.find((r: any) => r.content === "Harika bir konu, teşekkürler!");
        expect(found).toBeTruthy();
    });
});
