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

describe("Admin — GET /admin/kullanicilar/:id", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("giriş yapmamış kullanıcı 404 görür", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const res = await request(app).get(`/admin/kullanicilar/${normalUserId}`);
        expect(res.status).toBe(404);
    });

    it("normal kullanıcı 404 görür", async () => {
        const bcrypt = (await import("bcryptjs")).default;
        const { default: User } = await import("../../src/models/user.js");
        const fresh = await User.create({
            email: "fresh@test.com",
            username: "freshuser",
            password: await bcrypt.hash("test1234", 10),
            role: "user",
            ip: "127.0.0.1",
            userAgent: "vitest",
        });

        const agent = request.agent(app);
        await loginAs(agent, "freshuser", "test1234");
        const res = await agent.get(`/admin/kullanicilar/${fresh.id}`);
        expect(res.status).toBe(404);
    });

    it("admin kullanıcı detayını 200 ile görür (form + postlar)", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const res = await adminAgent.get(`/admin/kullanicilar/${normalUserId}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kullanıcı Bilgileri");
        expect(res.text).toContain("testuser");
        expect(res.text).toContain("Bingöl&#39;de Kış Hazırlıkları");
    });

    it("yanıtı/postu olmayan kullanıcıda boş durum mesajları görünür", async () => {
        const { default: User } = await import("../../src/models/user.js");
        const fresh = await User.findOne({ where: { username: "freshuser" } });
        const res = await adminAgent.get(`/admin/kullanicilar/${fresh!.id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("henüz konu açmamış");
        expect(res.text).toContain("henüz yanıt vermemiş");
    });

    it("olmayan kullanıcıda 404 döner", async () => {
        const res = await adminAgent.get("/admin/kullanicilar/99999");
        expect(res.status).toBe(404);
    });

    it("geçersiz id listeye yönlendirir", async () => {
        const res = await adminAgent.get("/admin/kullanicilar/abc");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kullanicilar");
    });
});

describe("Admin — POST /admin/kullanicilar/:id", () => {
    let adminAgent: request.Agent;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("geçerli form ile kullanıcıyı günceller", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}`)
            .type("form")
            .send({
                _csrf: token,
                email: "updated@test.com",
                username: "testuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);

        const check = await adminAgent.get(`/admin/kullanicilar/${normalUserId}`);
        expect(check.status).toBe(200);
        expect(check.text).toContain("updated@test.com");
    });

    it("geçersiz e-posta ile güncelleme yapmaz (geri yönlendirir)", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}`)
            .type("form")
            .send({
                _csrf: token,
                email: "x",
                username: "testuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);
    });

    it("hatalı form sonrası alan hatası ve eski girdi formda görünür", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}`)
            .type("form")
            .send({
                _csrf: token,
                email: "x",
                username: "testuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        const page = await adminAgent.get(`/admin/kullanicilar/${normalUserId}`);
        expect(page.status).toBe(200);
        expect(page.text).toContain("Geçerli bir e-posta giriniz");
        expect(page.text).toContain('value="x"');
    });

    it("başkasına ait e-posta ile güncelleme yapmaz", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}`)
            .type("form")
            .send({
                _csrf: token,
                email: "admin@test.com",
                username: "testuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);
    });

    it("admin kendi rolünü düşüremez", async () => {
        const adminId = (globalThis as any).__testAdmin.id;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${adminId}`)
            .type("form")
            .send({
                _csrf: token,
                email: "admin@test.com",
                username: "adminuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        expect(res.status).toBe(302);

        const { default: User } = await import("../../src/models/user.js");
        const admin = await User.findByPk(adminId);
        expect(admin!.role).toBe("admin");
    });

    it("olmayan kullanıcı listeye yönlendirir", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post("/admin/kullanicilar/99999")
            .type("form")
            .send({
                _csrf: token,
                email: "a@test.com",
                username: "ghostuser",
                role: "user",
                ip: "127.0.0.1",
                userAgent: "vitest",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kullanicilar");
    });
});

describe("Admin — kullanıcı detayından post/yanıt silme", () => {
    let adminAgent: request.Agent;
    let targetPostId: number;

    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("kullanıcının yanıtlarını silip detaya döner", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const { default: Post } = await import("../../src/models/post.js");
        const { default: PostReply } = await import("../../src/models/postReply.js");
        const { default: PostCategory } = await import("../../src/models/postCategory.js");
        const category = await PostCategory.findOne({ where: { name: "Genel" } });

        const post = await Post.create({
            userId: normalUserId,
            title: "Silinecek yanıtların konusu",
            content: "Bu konu yanıt silme testi için oluşturuldu.",
            categoryId: category!.id,
        });
        targetPostId = post.id;
        await PostReply.create({ postId: post.id, userId: normalUserId, content: "Birinci yanıt" });
        await PostReply.create({ postId: post.id, userId: normalUserId, content: "İkinci yanıt" });

        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}/yanit-sil/${post.id}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);

        const remaining = await PostReply.count({ where: { postId: post.id, userId: normalUserId } });
        expect(remaining).toBe(0);
    });

    it("yanıtı olmayan postta bilgi mesajıyla detaya döner", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/kullanicilar/${normalUserId}/yanit-sil/${targetPostId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);
    });

    it("geçersiz id listeye yönlendirir", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post("/admin/kullanicilar/abc/yanit-sil/xyz")
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kullanicilar");
    });

    it("detay sayfasından konu silince detaya döner", async () => {
        const normalUserId = (globalThis as any).__testAdmin.id - 1;
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent
            .post(`/admin/konu-sil/${targetPostId}`)
            .set("Referer", `http://localhost/admin/kullanicilar/${normalUserId}`)
            .type("form")
            .send({ _csrf: token });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/admin/kullanicilar/${normalUserId}`);

        const page = await adminAgent.get(`/admin/kullanicilar/${normalUserId}`);
        expect(page.text).not.toContain("Silinecek yanıtların konusu");
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
