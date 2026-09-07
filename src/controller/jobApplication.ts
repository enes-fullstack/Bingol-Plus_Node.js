import { Request, Response } from "express";
import Job from "../models/jobs.js";
import JobApplication from "../models/jobApplication.js";
import User from "../models/user.js";
import { validateJobApplicationForm } from "../helpers/validation.js";
import { error } from "../log/logger.js";
import { normalizeError } from "../helpers/normalizeError.js";
import { slugify } from "../helpers/slug.js";

// POST /ilanlar/:id/basvur
export const applyPost = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        req.session.flash = { type: "error", message: "Başvuru yapmak için giriş yapmalısınız." };
        res.redirect("/giris-yap");
        return;
    }

    const jobId = Number(req.params.id);
    if (!jobId || isNaN(jobId)) {
        req.session.flash = { type: "error", message: "Geçersiz ilan." };
        res.redirect("/ilanlar");
        return;
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
        res.status(404).render("user/error");
        return;
    }

    // İlan sahibi kendi ilanına başvuramaz
    if (job.userId === req.session.userId) {
        req.session.flash = { type: "error", message: "Kendi ilanınıza başvuru yapamazsınız." };
        res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
        return;
    }

    const errors = validateJobApplicationForm(req.body);
    if (Object.keys(errors).length > 0) {
        req.session.flash = {
            type: "error",
            message: "Lütfen başvuru formundaki hataları düzeltin.",
            errors: errors as Record<string, string>,
            oldInput: req.body as Record<string, string>,
        };
        res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
        return;
    }

    // Aynı ilana birden fazla başvuru engeli
    const existing = await JobApplication.findOne({ where: { jobId, userId: req.session.userId } });
    if (existing) {
        req.session.flash = { type: "error", message: "Bu ilana zaten başvuru yaptınız." };
        res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
        return;
    }

    const { ad, soyad, telefon, email, ilIlce, yas, medeniDurumu, ogrenimDurumu, surucuBelgesi, yabanciDil, ekNotlar } = req.body;

    // "Medeni" değerini "Evli" olarak normalize et (spec toleransı)
    let normalizedMedeni: string = String(medeniDurumu).trim();
    if (normalizedMedeni === "Medeni") normalizedMedeni = "Evli";

    try {
        await JobApplication.create({
            jobId,
            userId: req.session.userId,
            ad: String(ad).trim(),
            soyad: String(soyad).trim(),
            telefon: String(telefon).trim(),
            email: String(email).trim(),
            ilIlce: String(ilIlce).trim(),
            yas: Number(yas),
            medeniDurumu: normalizedMedeni as "Bekar" | "Evli",
            ogrenimDurumu: String(ogrenimDurumu).trim() as any,
            surucuBelgesi: String(surucuBelgesi).trim() as any,
            yabanciDil: String(yabanciDil).trim() as any,
            ekNotlar: ekNotlar ? String(ekNotlar).trim() : null,
            status: "inceleniyor",
        });

        req.session.flash = { type: "success", message: "Başvurunuz alındı. İşveren inceledikten sonra durumunuz güncellenecektir." };
        res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
    } catch (err: any) {
        // Unique constraint duplicate race
        if (err?.name === "SequelizeUniqueConstraintError") {
            req.session.flash = { type: "error", message: "Bu ilana zaten başvuru yaptınız." };
            res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
            return;
        }
        console.log("Error Code:", 5007);
        error(`Başvuru oluşturulurken hata (jobId: ${jobId}, userId: ${req.session.userId}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Başvuru gönderilirken bir hata oluştu." };
        res.redirect(`/ilanlar/${job.id}/${slugify(job.title)}`);
    }
};

// GET /profilim/basvurularim
export const myApplications_get = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const user = await User.findByPk(req.session.userId, {
        attributes: ["email", "username", "createdAt", "profileImage", "role"],
    });
    if (!user) {
        res.redirect("/giris-yap");
        return;
    }

    const applications = await JobApplication.findAll({
        where: { userId: req.session.userId },
        include: [{ model: Job, attributes: ["id", "title", "company", "location"] }],
        order: [["createdAt", "DESC"]],
    });

    res.status(200).render("user/profile-applications", {
        user,
        applications,
        userId: req.session.userId,
        username: user.username,
    });
};

// GET /profilim/ilanlarim/:jobId/basvurular
export const jobApplications_get = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const jobId = Number(req.params.jobId || req.params.id);
    if (!jobId || isNaN(jobId)) {
        res.redirect("/profilim/ilanlarim");
        return;
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
        res.status(404).render("user/error");
        return;
    }

    if (job.userId !== req.session.userId) {
        req.session.flash = { type: "error", message: "Bu ilana ait başvuruları görüntüleme yetkiniz yok." };
        res.redirect("/profilim/ilanlarim");
        return;
    }

    const user = await User.findByPk(req.session.userId, {
        attributes: ["email", "username", "createdAt", "profileImage", "role"],
    });

    const applications = await JobApplication.findAll({
        where: { jobId },
        include: [{ model: User, attributes: ["id", "username", "email"] }],
        order: [["createdAt", "DESC"]],
    });

    res.status(200).render("user/job-applications", {
        user,
        job,
        applications,
        userId: req.session.userId,
        username: user?.username || "",
    });
};

// POST /basvuru/:id/durum
export const updateStatusPost = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const appId = Number(req.params.id);
    if (!appId || isNaN(appId)) {
        req.session.flash = { type: "error", message: "Geçersiz başvuru." };
        res.redirect("/profilim/ilanlarim");
        return;
    }

    const application = await JobApplication.findByPk(appId, {
        include: [{ model: Job, attributes: ["id", "userId", "title"] }],
    });

    if (!application) {
        req.session.flash = { type: "error", message: "Başvuru bulunamadı." };
        res.redirect("/profilim/ilanlarim");
        return;
    }

    const job = (application as any).Job as Job | undefined;
    if (!job || job.userId !== req.session.userId) {
        req.session.flash = { type: "error", message: "Bu başvuruyu yönetme yetkiniz yok." };
        res.redirect("/profilim/ilanlarim");
        return;
    }

    const rawStatus = String(req.body.status || "").trim();
    const allowed = ["inceleniyor", "kabul_edildi", "reddedildi"];
    if (!allowed.includes(rawStatus)) {
        req.session.flash = { type: "error", message: "Geçersiz durum." };
        res.redirect(`/profilim/ilanlarim/${job.id}/basvurular`);
        return;
    }

    // İş veren kabul/red sonrası değiştiremesin
    if (application.status !== "inceleniyor") {
        req.session.flash = { type: "error", message: "Bu başvuru zaten sonuçlandırılmış." };
        res.redirect(`/profilim/ilanlarim/${job.id}/basvurular`);
        return;
    }

    try {
        await application.update({ status: rawStatus as any });
        let label = "İnceleniyor";
        if (rawStatus === "kabul_edildi") label = "Kabul Edildi";
        else if (rawStatus === "reddedildi") label = "Reddedildi";
        req.session.flash = { type: "success", message: `Başvuru durumu "${label}" olarak güncellendi.` };
        res.redirect(`/profilim/ilanlarim/${job.id}/basvurular`);
    } catch (err) {
        console.log("Error Code:", 5008);
        error(`Başvuru durumu güncellenirken hata (appId: ${appId}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Durum güncellenirken bir hata oluştu." };
        res.redirect(`/profilim/ilanlarim/${job.id}/basvurular`);
    }
};
