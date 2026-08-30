import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;

async function getCsrfToken(agent: request.Agent, url: string): Promise<string> {
    const res = await agent.get(url);
    let match = res.text.match(/name="_csrf"\s+value="([^"]+)"/);
    if (!match) match = res.text.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
    if (!match) throw new Error(`CSRF not found on ${url}`);
    return match[1];
}

async function loginAs(agent: request.Agent, username: string, password: string) {
    const token = await getCsrfToken(agent, "/giris-yap");
    const res = await agent.post("/giris-yap").type("form").send({ _csrf: token, username, password });
    if (res.status !== 302) throw new Error(`Login failed ${username}: ${res.status}`);
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

describe("Statik sayfalar", () => {
    const pages: [string, string][] = [
        ["/hakkimizda", "Hakkımızda"],
        ["/gizlilik-politikasi", "Gizlilik"],
        ["/kullanim-sartlari", "Kullanım"],
        ["/cerez-politikasi", "Çerez"],
        ["/iletisim", "İletişim"],
    ];
    for (const [path, needle] of pages) {
        it(`GET ${path} -> 200 ve '${needle}' içerir`, async () => {
            const res = await request(app).get(path);
            expect(res.status).toBe(200);
            expect(res.text).toContain(needle);
        });
    }
});

describe("Auth ek senaryolar", () => {
    it("giriş yapmış kullanıcı /giris-yap'a giderse anasayfaya yönlenir", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const res = await agent.get("/giris-yap");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/");
    });

    it("giriş yapmış kullanıcı /kayit-ol'a giderse anasayfaya yönlenir", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const res = await agent.get("/kayit-ol");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/");
    });

    it("banlı kullanıcı giriş yapamaz", async () => {
        const { default: User } = await import("../../src/models/user.js");
        const testUser = await User.findOne({ where: { username: "testuser" } });
        await testUser!.update({ banned: true });
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/giris-yap");
        const res = await agent.post("/giris-yap").type("form").send({ _csrf: token, username: "testuser", password: "test1234" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
        // ban'ı geri al (diğer testler için)
        await testUser!.update({ banned: false });
    });

    it("aynı email ile ikinci kayıt başarısız olur", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/kayit-ol");
        const res = await agent.post("/kayit-ol").type("form").send({ _csrf: token, email: "test@test.com", username: "yeniuser123", password: "sifre1234" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/kayit-ol");
    });

    it("aynı username ile ikinci kayıt başarısız olur", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/kayit-ol");
        const res = await agent.post("/kayit-ol").type("form").send({ _csrf: token, email: "baska@test.com", username: "testuser", password: "sifre1234" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/kayit-ol");
    });

    it("geçersiz email formatı ile kayıt başarısız olur", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/kayit-ol");
        const res = await agent.post("/kayit-ol").type("form").send({ _csrf: token, email: "gecersiz", username: "validuser", password: "sifre1234" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/kayit-ol");
    });

    it("sifremi-unuttum geçersiz email ile 302 /sifremi-unuttum döner", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/sifremi-unuttum");
        const res = await agent.post("/sifremi-unuttum").type("form").send({ _csrf: token, email: "gecersiz" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/sifremi-unuttum");
    });

    it("sifre-sifirla geçersiz token 404", async () => {
        const res = await request(app).get("/sifre-sifirla/gecersiz-token-xyz");
        expect(res.status).toBe(404);
    });
});

describe("İlan ekleme talebi akışı", () => {
    it("giriş yapmamış POST /ilanlar/ilan-ekle -> /giris-yap", async () => {
        const agent = request.agent(app);
        const token = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({ _csrf: token, title: "X", company: "Y", location: "Z", description: "W" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
    });

    it("giriş yapmış geçerli POST /ilanlar/ilan-ekle -> /ilanlar ve JobRequest oluşur", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const token = await getCsrfToken(agent, "/ilanlar/ilan-ekle");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({
            _csrf: token,
            title: "Deneme İlanı",
            company: "Deneme A.Ş.",
            location: "Bingöl",
            description: "Bu bir deneme ilanı açıklamasıdır, yeterince uzun.",
            salary: "25000",
            phone: "0555 123 4567"
        });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/ilanlar");
        const { default: JobRequest } = await import("../../src/models/jobRequest.js");
        const reqCount = await JobRequest.count({ where: { title: "Deneme İlanı" } });
        expect(reqCount).toBe(1);
    });

    it("GET /ilanlar/ilan-ekle pending varken sayfayı gösterir", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const res = await agent.get("/ilanlar/ilan-ekle");
        expect(res.status).toBe(200);
        expect(res.text).toContain("İlan Ekle");
    });

    it("geçersiz ilan formu aynı sayfaya yönlendirir", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const token = await getCsrfToken(agent, "/ilanlar/ilan-ekle");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({ _csrf: token, title: "", company: "", location: "", description: "" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/ilanlar/ilan-ekle");
    });
});

describe("Profil ve avatar guard", () => {
    it("GET /profilim girişsiz 302", async () => {
        const res = await request(app).get("/profilim");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/giris-yap");
    });

    it("GET /profilim girişli 200 ve kullanıcı bilgileri", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const res = await agent.get("/profilim");
        expect(res.status).toBe(200);
        expect(res.text).toContain("testuser");
        expect(res.text).toContain("test@test.com");
    });

    it("POST /profilim/resim-yukle dosya olmadan hata ve redirect /profilim", async () => {
        const agent = request.agent(app);
        await loginAs(agent, "testuser", "test1234");
        const csrf = await getCsrfToken(agent, "/profilim");
        // multer single file olmadan => req.file undefined => controller 302 /profilim
        const res = await agent.post("/profilim/resim-yukle").type("form").send({ _csrf: csrf });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/profilim");
    });
});

describe("Admin ek senaryolar", () => {
    let adminAgent: request.Agent;
    beforeAll(async () => {
        adminAgent = request.agent(app);
        await loginAs(adminAgent, "adminuser", "test1234");
    });

    it("normal kullanıcı admin sayfalarına erişemez (404)", async () => {
        const userAgent = request.agent(app);
        await loginAs(userAgent, "testuser", "test1234");
        const paths = ["/admin/kategoriler", "/admin/talepler", "/admin/kullanicilar", "/admin/loglar"];
        for (const p of paths) {
            const res = await userAgent.get(p);
            expect(res.status).toBe(404);
            expect(res.text).toContain("Sayfa Bulunamadı");
        }
    });

    it("GET /admin/kategoriler -> 200 ve kategori listesi", async () => {
        const res = await adminAgent.get("/admin/kategoriler");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kategoriler");
        expect(res.text).toContain("Genel");
        expect(res.text).toContain("Bingöl Gündemi");
    });

    it("POST /admin/kategori-ekle boş isim -> redirect /admin/kategoriler", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/kategoriler");
        const res = await adminAgent.post("/admin/kategori-ekle").type("form").send({ _csrf: token, name: "" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kategoriler");
    });

    it("POST /admin/kategori-ekle geçerli kategori oluşturur", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/kategoriler");
        const res = await adminAgent.post("/admin/kategori-ekle").type("form").send({ _csrf: token, name: "TestKategori" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kategoriler");
        const { default: PostCategory } = await import("../../src/models/postCategory.js");
        const cat = await PostCategory.findOne({ where: { name: "TestKategori" } });
        expect(cat).not.toBeNull();
        expect(cat!.slug).toBe("testkategori");
    });

    it("POST /admin/kategori-ekle aynı isim tekrar -> redirect ve oluşturmaz (duplicate)", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/kategoriler");
        const res = await adminAgent.post("/admin/kategori-ekle").type("form").send({ _csrf: token, name: "TestKategori" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kategoriler");
    });

    it("POST /admin/kategori-sil/:id -> boş kategori silinir", async () => {
        const { default: PostCategory } = await import("../../src/models/postCategory.js");
        const cat = await PostCategory.findOne({ where: { name: "TestKategori" } });
        const token = await getCsrfToken(adminAgent, "/admin/kategoriler");
        const res = await adminAgent.post(`/admin/kategori-sil/${cat!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kategoriler");
        const after = await PostCategory.findByPk(cat!.id);
        expect(after).toBeNull();
    });

    it("POST /admin/kategori-sil/:id -> dolu kategori silinemez", async () => {
        const { default: PostCategory } = await import("../../src/models/postCategory.js");
        const cat = await PostCategory.findOne({ where: { slug: "bingol-gundemi" } });
        const token = await getCsrfToken(adminAgent, "/admin/kategoriler");
        const res = await adminAgent.post(`/admin/kategori-sil/${cat!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kategoriler");
        const still = await PostCategory.findByPk(cat!.id);
        expect(still).not.toBeNull();
    });

    it("GET /admin/talepler -> bekleyen talepleri listeler", async () => {
        const res = await adminAgent.get("/admin/talepler");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Talep");
        // önceki testte oluşturulan "Deneme İlanı" pending olmalı
        expect(res.text).toContain("Deneme İlanı");
    });

    it("GET /admin/talep/:id -> detay 200", async () => {
        const { default: JobRequest } = await import("../../src/models/jobRequest.js");
        const req = await JobRequest.findOne({ where: { title: "Deneme İlanı" } });
        const res = await adminAgent.get(`/admin/talep/${req!.id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Deneme İlanı");
        expect(res.text).toContain("Deneme A.Ş.");
    });

    it("POST /admin/talep-onayla/:id -> onaylar ve Job oluşturur", async () => {
        const { default: JobRequest } = await import("../../src/models/jobRequest.js");
        const { default: Job } = await import("../../src/models/jobs.js");
        const req = await JobRequest.findOne({ where: { title: "Deneme İlanı", status: "pending" } });
        const token = await getCsrfToken(adminAgent, "/admin/talepler");
        const res = await adminAgent.post(`/admin/talep-onayla/${req!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/talepler");
        const updated = await JobRequest.findByPk(req!.id);
        expect(updated!.status).toBe("approved");
        const job = await Job.findOne({ where: { title: "Deneme İlanı" } });
        expect(job).not.toBeNull();
    });

    it("POST /admin/talep-reddet/:id -> reddeder", async () => {
        // yeni bir talep oluştur
        const { default: JobRequest } = await import("../../src/models/jobRequest.js");
        const { default: User } = await import("../../src/models/user.js");
        const user = await User.findOne({ where: { username: "testuser" } });
        const newReq = await JobRequest.create({
            title: "Reddedilecek İlan",
            description: "Açıklama yeterince uzun olmalı test için",
            company: "Firma X",
            location: "Bingöl",
            userId: user!.id,
            status: "pending"
        });
        const token = await getCsrfToken(adminAgent, "/admin/talepler");
        const res = await adminAgent.post(`/admin/talep-reddet/${newReq.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/talepler");
        const updated = await JobRequest.findByPk(newReq.id);
        expect(updated!.status).toBe("rejected");
    });

    it("GET /admin/loglar -> 200 ve log tipi filtresi", async () => {
        const res = await adminAgent.get("/admin/loglar");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Sistem Logları");
        const filtered = await adminAgent.get("/admin/loglar?type=success");
        expect(filtered.status).toBe(200);
        expect(filtered.text).toContain("Sistem Logları");
    });

    it("GET /admin/kullanicilar?q= arama çalışır", async () => {
        const res = await adminAgent.get("/admin/kullanicilar?q=testuser");
        expect(res.status).toBe(200);
        expect(res.text).toContain("testuser");
        expect(res.text).toContain("Kullanıcılar");
    });

    it("GET /admin/ilan-ekle -> form ve ilan listesi", async () => {
        const res = await adminAgent.get("/admin/ilan-ekle");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Yeni İş İlanı Ekle");
        expect(res.text).toContain("Aktif İlanlar");
    });

    it("POST /admin/ilan-ekle geçersiz form -> /admin/ilan-ekle", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/ilan-ekle");
        const res = await adminAgent.post("/admin/ilan-ekle").type("form").send({ _csrf: token, title: "", company: "", location: "", description: "" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/ilan-ekle");
    });

    it("POST /admin/ilan-ekle geçerli -> /admin ve ilan oluşur", async () => {
        const token = await getCsrfToken(adminAgent, "/admin/ilan-ekle");
        const res = await adminAgent.post("/admin/ilan-ekle").type("form").send({
            _csrf: token,
            title: "Admin İlanı",
            description: "Admin tarafından eklenen ilan açıklaması yeterince uzun.",
            company: "Admin Co",
            location: "Bingöl"
        });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin");
        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findOne({ where: { title: "Admin İlanı" } });
        expect(job).not.toBeNull();
    });

    it("GET /admin/ilan-duzenle/:id -> 200", async () => {
        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findOne({ where: { title: "Admin İlanı" } });
        const res = await adminAgent.get(`/admin/ilan-duzenle/${job!.id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Admin İlanı");
    });

    it("POST /admin/ilan-duzenle/:id -> günceller", async () => {
        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findOne({ where: { title: "Admin İlanı" } });
        const token = await getCsrfToken(adminAgent, `/admin/ilan-duzenle/${job!.id}`);
        const res = await adminAgent.post(`/admin/ilan-duzenle/${job!.id}`).type("form").send({
            _csrf: token,
            title: "Admin İlanı Güncel",
            description: "Güncellenmiş açıklama",
            company: "Admin Co",
            location: "Bingöl"
        });
        expect(res.status).toBe(302);
        const updated = await Job.findByPk(job!.id);
        expect(updated!.title).toBe("Admin İlanı Güncel");
    });

    it("POST /admin/ilan-sil/:id -> siler", async () => {
        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findOne({ where: { title: "Admin İlanı Güncel" } });
        const token = await getCsrfToken(adminAgent, "/admin/ilan-ekle");
        const res = await adminAgent.post(`/admin/ilan-sil/${job!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/ilan-ekle");
        const deleted = await Job.findByPk(job!.id);
        expect(deleted).toBeNull();
    });

    it("POST /admin/kullanici-ban/:id -> banlar ve kaldırır (toggle)", async () => {
        const { default: User } = await import("../../src/models/user.js");
        const target = await User.findOne({ where: { username: "testuser" } });
        // ensure not banned at start
        await target!.update({ banned: false });
        let token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        let res = await adminAgent.post(`/admin/kullanici-ban/${target!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        let after = await User.findByPk(target!.id);
        expect(after!.banned).toBe(true);
        token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        res = await adminAgent.post(`/admin/kullanici-ban/${target!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        after = await User.findByPk(target!.id);
        expect(after!.banned).toBe(false);
    });

    it("POST /admin/kullanici-sil/:id -> kendini silemez", async () => {
        const { default: User } = await import("../../src/models/user.js");
        const admin = await User.findOne({ where: { username: "adminuser" } });
        const token = await getCsrfToken(adminAgent, "/admin/kullanicilar");
        const res = await adminAgent.post(`/admin/kullanici-sil/${admin!.id}`).type("form").send({ _csrf: token });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/kullanicilar");
        const still = await User.findByPk(admin!.id);
        expect(still).not.toBeNull();
    });
});

describe("Forum ek senaryolar", () => {
    it("GET /forum/akis/olmayan-kategori -> 404", async () => {
        const res = await request(app).get("/forum/akis/olmayan-kategori-xyz");
        expect(res.status).toBe(404);
    });

    it("GET /api/posts?category=olmayan -> boş liste", async () => {
        const res = await request(app).get("/api/posts?category=olmayan-kategori");
        expect(res.status).toBe(200);
        expect(res.body.posts).toEqual([]);
        expect(res.body.hasMore).toBe(false);
    });

    it("GET /forum/konu/:id slug'lı versiyon da 200", async () => {
        const { default: Post } = await import("../../src/models/post.js");
        const post = await Post.findOne();
        const res = await request(app).get(`/forum/konu/${post!.id}/bingolde-kis-hazirliklari`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Kış Hazırlıkları");
    });
});

describe("Job detay slug", () => {
    it("GET /ilanlar/:id/:slug -> 200 aynı içerik", async () => {
        const res = await request(app).get("/ilanlar/1/web-gelistirici");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Web Geliştirici");
    });
    it("GET /ilanlar/abc -> redirect /ilanlar", async () => {
        const res = await request(app).get("/ilanlar/abc");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/ilanlar");
    });
});
