import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { setupTestDatabase, teardownTestDatabase } from "../integration/setup.js";
import { seedTestData } from "../integration/seed.js";

let app: any;

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
    await seedTestData();
});

afterAll(async () => {
    await teardownTestDatabase();
});

describe("GET /", () => {
    it("200 ile anasayfayı döner", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Bingöl Plus");
    });
});

describe("GET /ilanlar", () => {
    it("200 ile ilan listesini döner", async () => {
        const res = await request(app).get("/ilanlar");
        expect(res.status).toBe(200);
        expect(res.text).toContain("İş İlanları");
        expect(res.text).toContain("Web Geliştirici");
    });
});

describe("GET /ilanlar/:id", () => {
    it("200 ile ilan detayını döner", async () => {
        const res = await request(app).get("/ilanlar/1");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Web Geliştirici");
    });

    it("var olmayan jobId ile 404 döner", async () => {
        const res = await request(app).get("/ilanlar/999");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Sayfa Bulunamadı");
    });

    it("geçersiz id ile /ilanlar yönlendirir", async () => {
        const res = await request(app).get("/ilanlar/abc");
        expectRedirect(res, "/ilanlar");
    });
});

describe("GET /iletisim", () => {
    it("200 ile iletişim sayfasını döner", async () => {
        const res = await request(app).get("/iletisim");
        expect(res.status).toBe(200);
        expect(res.text).toContain("İletişim");
    });
});

describe("GET /profilim", () => {
    it("giriş yapmamışsa 302 ile /giris-yap yönlendirir", async () => {
        const res = await request(app).get("/profilim");
        expectRedirect(res, "/giris-yap");
    });

    it("giriş yapmışsa 200 ile profil sayfasını döner", async () => {
        const agent = request.agent(app);
        const csrf = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf, username: "testuser", password: "test1234" });
        const res = await agent.get("/profilim");
        expect(res.status).toBe(200);
        expect(res.text).toContain("testuser");
    });
});

describe("POST /ilanlar/ilan-ekle", () => {
    it("giriş yapmamışsa 302 ile /giris-yap yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({ _csrf: csrf, title: "Test", company: "Test", location: "Test", description: "Test" });
        expectRedirect(res, "/giris-yap");
    });

    it("giriş yapmışsa 302 ile /ilanlar yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({ _csrf: csrf2, title: "Yeni Test İlanı", company: "Test A.Ş.", location: "Bingöl", description: "Açıklama metni buraya yazılır." });
        expectRedirect(res, "/ilanlar");
    });

    it("geçersiz veri ile aynı sayfaya yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post("/ilanlar/ilan-ekle").type("form").send({ _csrf: csrf2, title: "", company: "", location: "", description: "" });
        expectRedirect(res, "/ilanlar/ilan-ekle");
    });
});

async function createForeignJob(): Promise<number> {
    const { default: Job } = await import("../../src/models/jobs.js");
    const { default: User } = await import("../../src/models/user.js");
    const admin = await User.findOne({ where: { username: "adminuser" } });
    const job = await Job.create({
        title: "Başkasının İlanı",
        description: "Başka kullanıcıya ait ilan",
        company: "Rakip A.Ş.",
        location: "Bingöl",
        userId: admin!.id,
    });
    return job.id;
}

describe("GET /ilanlar/duzenle/:id", () => {
    it("giriş yapmamışsa 302 ile /giris-yap yönlendirir", async () => {
        const agent = request.agent(app);
        const res = await agent.get("/ilanlar/duzenle/1");
        expectRedirect(res, "/giris-yap");
    });

    it("kendi ilanıysa 200 ile düzenleme formunu döner", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const res = await agent.get("/ilanlar/duzenle/1");
        expect(res.status).toBe(200);
        expect(res.text).toContain("İlanı Düzenle");
        expect(res.text).toContain('value="Web Geliştirici"');
    });

    it("başkasının ilanıysa 302 ile /profilim yönlendirir", async () => {
        const foreignId = await createForeignJob();
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const res = await agent.get(`/ilanlar/duzenle/${foreignId}`);
        expectRedirect(res, "/profilim");
    });

    it("var olmayan ilan için 404 döner", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const res = await agent.get("/ilanlar/duzenle/999");
        expect(res.status).toBe(404);
    });
});

describe("POST /ilanlar/duzenle/:id", () => {
    it("kendi ilanını günceller ve /profilim yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/ilanlar/duzenle/2");
        const res = await agent.post("/ilanlar/duzenle/2").type("form").send({
            _csrf: csrf2,
            title: "Muhasebe Uzmanı (Güncel)",
            description: "Güncellenmiş açıklama",
            company: "Test Şirket 2",
            location: "Bingöl Merkez",
        });
        expectRedirect(res, "/profilim");

        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findByPk(2);
        expect(job!.title).toBe("Muhasebe Uzmanı (Güncel)");
        expect(job!.description).toBe("Güncellenmiş açıklama");
    });

    it("başkasının ilanını güncelleyemez ve /profilim yönlendirir", async () => {
        const foreignId = await createForeignJob();
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post(`/ilanlar/duzenle/${foreignId}`).type("form").send({
            _csrf: csrf2,
            title: "Hack Denemesi",
            description: "Değiştirilmemeli",
            company: "Rakip A.Ş.",
            location: "Bingöl",
        });
        expectRedirect(res, "/profilim");

        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findByPk(foreignId);
        expect(job!.title).toBe("Başkasının İlanı");
    });

    it("geçersiz veri ile düzenleme sayfasına geri yönlendirir", async () => {
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/ilanlar/duzenle/3");
        const res = await agent.post("/ilanlar/duzenle/3").type("form").send({
            _csrf: csrf2,
            title: "",
            description: "",
            company: "",
            location: "",
        });
        expectRedirect(res, "/ilanlar/duzenle/3");
    });
});

describe("POST /ilanlar/sil/:id", () => {
    it("kendi ilanını siler ve /profilim yönlendirir", async () => {
        const { default: Job } = await import("../../src/models/jobs.js");
        const { default: User } = await import("../../src/models/user.js");
        const me = await User.findOne({ where: { username: "testuser" } });
        const newJob = await Job.create({
            title: "Silinecek İlan",
            description: "Bu ilan silinecek",
            company: "Test A.Ş.",
            location: "Bingöl",
            userId: me!.id,
        });

        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post(`/ilanlar/sil/${newJob.id}`).type("form").send({ _csrf: csrf2 });
        expectRedirect(res, "/profilim");

        const deleted = await Job.findByPk(newJob.id);
        expect(deleted).toBeNull();
    });

    it("başkasının ilanını silemez ve /profilim yönlendirir", async () => {
        const foreignId = await createForeignJob();
        const agent = request.agent(app);
        const csrf1 = await getCsrfToken(agent, "/forum/akis");
        await agent.post("/giris-yap").type("form").send({ _csrf: csrf1, username: "testuser", password: "test1234" });
        const csrf2 = await getCsrfToken(agent, "/forum/akis");
        const res = await agent.post(`/ilanlar/sil/${foreignId}`).type("form").send({ _csrf: csrf2 });
        expectRedirect(res, "/profilim");

        const { default: Job } = await import("../../src/models/jobs.js");
        const job = await Job.findByPk(foreignId);
        expect(job).not.toBeNull();
    });
});
