import { Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Op } from "sequelize";

import User from "../models/user.js";
import Job from "../models/jobs.js";
import JobRequest from "../models/jobRequest.js";
import SavedJob from "../models/savedJobs.js";
import Post from "../models/post.js";
import PostCategory from "../models/postCategory.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import { sequelize } from "../database/connection.js";
import { validateJobForm } from "../helpers/validation.js";
import { validateToken } from "../middleware/csrf.js";
import { optimizeUrl, uploadImageFromBuffer, deleteImage, extractPublicId } from "../cloud/upload.js";
import { slugify } from "../helpers/slug.js";
import { error } from "../log/logger.js";
import { formatLogMessage } from "../helpers/formatLogMessage.js";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
            cb(new Error("Yalnızca JPEG, PNG ve WebP formatları kabul edilir."));
            return;
        }
        cb(null, true);
    }
});

export const home_get = async (req: Request, res: Response): Promise<void> => {
    let username: string | null = null;
    let isAdmin = false;
    const userId: number | null = req.session.userId || null;

    if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
            username = user.username;
            isAdmin = user.role === "admin";
        }
    }

    const limit = 5;

    const [recentPosts, jobs, postCount, jobCount, categories, categoryCountRows] = await Promise.all([
        Post.findAll({
            include: [
                { model: User, attributes: ["id", "username", "profileImage"] },
                { model: PostCategory, attributes: ["name"] }
            ],
            order: [["createdAt", "DESC"]],
            limit
        }),
        Job.findAll({ order: [["createdAt", "DESC"]], limit: 3 }),
        Post.count(),
        Job.count(),
        PostCategory.findAll({ order: [["id", "ASC"]] }).then(cats => { const i = cats.findIndex((c:any)=>c.name==="Üniversite"); if(i>-1){const[u]=cats.splice(i,1); cats.splice(2,0,u as any);} return cats; }),
        Post.findAll({
            attributes: [
                "categoryId",
                [sequelize.fn("COUNT", sequelize.col("Post.id")), "count"]
            ],
            group: ["categoryId"]
        })
    ]);

    const countByCategoryId: Record<number, number> = {};
    categoryCountRows.forEach(r => {
        countByCategoryId[Number((r as any).categoryId)] = Number((r as any).getDataValue("count"));
    });
    const categoryCountMap: Record<string, number> = {};
    categories.forEach(c => { categoryCountMap[c.name] = countByCategoryId[c.id] || 0; });

    // --- feed ile birebir aynı veri hazırlığı (avatar, like, reply) ---
    const avatarMap: Record<number, string | null> = {};
    recentPosts.forEach(p => {
        const pu: any = p;
        if (pu.User) {
            avatarMap[pu.User.id] = optimizeUrl(pu.User.profileImage, 36, 36);
        }
    });

    let userLikedMap: Record<number, boolean> = {};
    if (userId) {
        const likes = await PostLike.findAll({ where: { userId } });
        likes.forEach(l => { userLikedMap[l.postId] = true; });
    }

    const postIds = recentPosts.map(p => p.id);
    const repliesByPost: Record<number, PostReply[]> = {};
    const replyCounts: Record<number, number> = {};

    if (postIds.length > 0) {
        const allReplies = await PostReply.findAll({
            where: { postId: postIds },
            include: [{ model: User, attributes: ["id", "username", "profileImage"] }],
            order: [["createdAt", "ASC"]]
        });

        for (const reply of allReplies) {
            const ru = (reply as any).User;
            if (ru && !(ru.id in avatarMap)) {
                avatarMap[ru.id] = optimizeUrl(ru.profileImage, 28, 28);
            }
            const pid = (reply as any).postId;
            if (!repliesByPost[pid]) {
                repliesByPost[pid] = [];
                replyCounts[pid] = 0;
            }
            replyCounts[pid]++;
            if (repliesByPost[pid].length < 3) {
                repliesByPost[pid].push(reply);
            }
        }
    }

    const hasMore = postCount > limit;

    res.status(200).render("user/index", {
        username, userId, recentPosts, jobs, categories, isAdmin, jobCount, postCount, categoryCountMap,
        posts: recentPosts, avatarMap, userLikedMap, repliesByPost, replyCounts,
        hasMore, initialOffset: limit, slug: '', kategori: ''
    });
};

export const jobs_get = async (req: Request, res: Response): Promise<void> => {
    const jobs = await Job.findAll({ order: [["createdAt", "DESC"]] });

    let savedJobIds: number[] = [];
    if (req.session.userId) {
        const savedJobs = await SavedJob.findAll({
            where: { userId: req.session.userId },
            attributes: ["jobId"]
        });
        savedJobIds = savedJobs.map(s => s.jobId);
    }

    res.status(200).render("user/jobs", { jobs, savedJobIds, userId: req.session.userId || null });
};

export const job_detail_get = async (req: Request, res: Response): Promise<void> => {
    const jobId = Number(req.params.id);
    if (!jobId || isNaN(jobId)) {
        res.redirect("/ilanlar");
        return;
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
        res.status(404).render("user/error");
        return;
    }

    const correctSlug = slugify(job.title);
    const requestedSlug = (req.params as Record<string, string | undefined>).slug;
    if (requestedSlug && requestedSlug !== correctSlug) {
        res.redirect(301, `/ilanlar/${job.id}/${correctSlug}`);
        return;
    }

    // SEO: canonical always points to slug version
    const rawBase = process.env.SITE_URL || "https://bingolplus.com";
    const baseUrl = rawBase.replace(/\/$/, "");
    res.locals.canonical = `${baseUrl}/ilanlar/${job.id}/${correctSlug}`;

    let isSaved = false;
    if (req.session.userId) {
        const saved = await SavedJob.findOne({
            where: { userId: req.session.userId, jobId }
        });
        isSaved = !!saved;
    }

    res.status(200).render("user/job-detail", { job, userId: req.session.userId || null, isSaved });
};

export const ilan_ekle_get = async (req: Request, res: Response): Promise<void> => {
    const pendingRequest = req.session.userId
        ? await JobRequest.findOne({ where: { userId: req.session.userId, status: "pending" } })
        : null;

    res.status(200).render("user/add-job", { pendingRequest });
};

export const ilan_ekle_post = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const { title, description, company, location, salary, phone, type } = req.body;

    const errors = validateJobForm(req.body);
    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as Record<string, string> };
        res.redirect("/ilanlar/ilan-ekle");
        return;
    }

    const existingPending = await JobRequest.findOne({ where: { userId: req.session.userId, status: "pending" } });
    if (existingPending) {
        req.session.flash = { type: "error", message: "Zaten bekleyen bir ilan talebiniz var. Lütfen mevcut talebiniz sonuçlanana kadar bekleyin." };
        res.redirect("/ilanlar/ilan-ekle");
        return;
    }

    try {
        await JobRequest.create({
            title: title.trim(),
            description: description.trim(),
            company: company.trim(),
            location: location.trim(),
            salary: salary?.trim() || null,
            phone: phone?.trim() || null,
            type: type?.trim() || null,
            userId: req.session.userId
        });

        req.session.flash = { type: "success", message: "İlan talebiniz alındı. Admin onayından sonra yayınlanacaktır." };
        res.redirect("/ilanlar");
    } catch (err) {
        console.log("Error Code:", 3007);
        error(`İlan talebi gönderilirken hata (kullanıcı ID: ${req.session.userId}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan talebi gönderilirken bir hata oluştu." };
        res.redirect("/ilanlar/ilan-ekle");
    }
};

export const profileImageUpload_post = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        req.session.flash = { type: "error", message: "Giriş yapmalısınız." };
        res.redirect("/giris-yap");
        return;
    }

    const upload = profileUpload.single("profileImage");
    upload(req, res, async (err: unknown) => {
        if (err) {
            const message = err instanceof Error ? err.message : "Dosya yüklenirken bir hata oluştu.";
            req.session.flash = { type: "error", message };
            res.redirect("/profilim");
            return;
        }

        // CSRF: header veya body token kabul edilir (dosya memory'de, diske yazılmadan kontrol)
        const bodyToken = (req.body as any)?._csrf || "";
        const headerToken = (req.headers["csrf-token"] as string | undefined) || "";
        const isBodyValid = bodyToken ? validateToken(bodyToken, req.session.csrfSecret!) : false;
        const isHeaderValid = headerToken ? validateToken(headerToken, req.session.csrfSecret!) : false;
        if (!isBodyValid && !isHeaderValid) {
            req.session.flash = { type: "error", message: "Güvenlik doğrulaması başarısız." };
            res.redirect("/profilim");
            return;
        }

        if (!req.file) {
            req.session.flash = { type: "error", message: "Lütfen bir dosya seçin." };
            res.redirect("/profilim");
            return;
        }

        // Magic-byte doğrulaması (file-type)
        try {
            const { fileTypeFromBuffer } = await import("file-type");
            const ft = await fileTypeFromBuffer(req.file.buffer);
            if (!ft || !ALLOWED_MIMES.includes(ft.mime)) {
                req.session.flash = { type: "error", message: "Yalnızca JPEG, PNG ve WebP formatları kabul edilir." };
                res.redirect("/profilim");
                return;
            }
            const allowedExtsByMime: Record<string, string[]> = {
                "image/jpeg": ["jpg", "jpeg"],
                "image/png": ["png"],
                "image/webp": ["webp"]
            };
            if (!allowedExtsByMime[ft.mime]?.includes(ft.ext)) {
                req.session.flash = { type: "error", message: "Yalnızca JPEG, PNG ve WebP formatları kabul edilir." };
                res.redirect("/profilim");
                return;
            }
        } catch (e) {
            console.log("Error Code:", 3005);
            error(`Dosya tipi doğrulanamadı (kullanıcı ID: ${req.session.userId}): ${formatLogMessage(e)}`);
            req.session.flash = { type: "error", message: "Dosya doğrulanamadı." };
            res.redirect("/profilim");
            return;
        }

        // Mevcut kullanıcı ve eski resim
        let oldUrl: string | null = null;
        try {
            const cur = await User.findByPk(req.session.userId, { attributes: ["profileImage"] });
            oldUrl = (cur as any)?.profileImage || null;
        } catch {}

        // Cloudinary'e buffer'dan yükle (diske yazmadan)
        let result: { url: string; publicId: string };
        try {
            result = await uploadImageFromBuffer(req.file.buffer);
        } catch (uploadErr) {
            console.log("Error Code:", 3005);
            error(`Profil resmi yüklenemedi (kullanıcı ID: ${req.session.userId}): ${formatLogMessage(uploadErr)}`);
            req.session.flash = { type: "error", message: "Dosya yüklenirken bir hata oluştu." };
            res.redirect("/profilim");
            return;
        }

        // Atomic günlük limit (2/gün) + güncelleme
        const today = new Date().toISOString().slice(0, 10);
        try {
            const [affected] = await User.update(
                {
                    profileImage: result.url,
                    profileImageDate: today,
                    profileImageCount: sequelize.literal(`CASE WHEN profileImageDate = '${today}' THEN COALESCE(profileImageCount,0) + 1 ELSE 1 END`)
                } as any,
                {
                    where: {
                        id: req.session.userId,
                        [Op.or]: [
                            { profileImageDate: { [Op.is]: null as any } },
                            { profileImageDate: { [Op.ne]: today } },
                            { [Op.and]: [{ profileImageDate: today }, { profileImageCount: { [Op.lt]: 2 } }] } as any
                        ]
                    } as any
                }
            );

            if (affected === 0) {
                // Limit aşıldı — yeni yüklenen Cloudinary görselini sil (orphan önle)
                await deleteImage(result.publicId).catch(() => {});
                req.session.flash = { type: "error", message: "Profil fotoğrafını günde en fazla 2 kez değiştirebilirsiniz." };
                res.redirect("/profilim");
                return;
            }
        } catch (dbErr) {
            await deleteImage(result.publicId).catch(() => {});
            console.log("Error Code:", 3005);
            error(`Profil resmi DB güncellenemedi (kullanıcı ID: ${req.session.userId}): ${formatLogMessage(dbErr)}`);
            req.session.flash = { type: "error", message: "Dosya yüklenirken bir hata oluştu." };
            res.redirect("/profilim");
            return;
        }

        // Eski resmi Cloudinary'den sil (başarılı ise)
        if (oldUrl) {
            const oldPublicId = extractPublicId(oldUrl);
            if (oldPublicId) {
                deleteImage(oldPublicId).catch(() => {});
            }
        }

        req.session.flash = { type: "success", message: "Profil resmi güncellendi." };
        res.redirect("/profilim");
    });
};

export const editJob_get = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/profilim"); return; }

    const job = await Job.findByPk(id);
    if (!job) { res.status(404).render("user/error"); return; }

    if (job.userId !== req.session.userId) {
        req.session.flash = { type: "error", message: "Bu ilanı düzenleme yetkiniz yok." };
        res.redirect("/profilim");
        return;
    }

    res.status(200).render("user/edit-job", { job, userId: req.session.userId });
};

export const editJob_post = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/profilim"); return; }

    const errors = validateJobForm(req.body);
    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as Record<string, string> };
        res.redirect(`/ilanlar/duzenle/${id}`);
        return;
    }

    try {
        const job = await Job.findByPk(id);
        if (!job) {
            req.session.flash = { type: "error", message: "İlan bulunamadı." };
            res.redirect("/profilim");
            return;
        }

        if (job.userId !== req.session.userId) {
            req.session.flash = { type: "error", message: "Bu ilanı düzenleme yetkiniz yok." };
            res.redirect("/profilim");
            return;
        }

        const { title, description, company, location, salary, phone, type } = req.body;
        await job.update({
            title: title.trim(),
            description: description.trim(),
            company: company.trim(),
            location: location.trim(),
            salary: salary?.trim() || null,
            phone: phone?.trim() || null,
            type: type?.trim() || null
        });

        req.session.flash = { type: "success", message: "İlanınız başarıyla güncellendi." };
        res.redirect("/profilim");
    } catch (err) {
        console.log("Error Code:", 5005);
        error(`İlan güncellenirken hata (kullanıcı ID: ${req.session.userId}, ilan ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan güncellenirken bir hata oluştu." };
        res.redirect(`/ilanlar/duzenle/${id}`);
    }
};

export const jobDelete_post = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/profilim"); return; }

    try {
        const job = await Job.findByPk(id, { attributes: ["id", "title", "userId"] });
        if (!job) {
            req.session.flash = { type: "error", message: "İlan bulunamadı." };
            res.redirect("/profilim");
            return;
        }

        if (job.userId !== req.session.userId) {
            req.session.flash = { type: "error", message: "Bu ilanı silme yetkiniz yok." };
            res.redirect("/profilim");
            return;
        }

        await SavedJob.destroy({ where: { jobId: id } });
        await job.destroy();

        req.session.flash = { type: "success", message: `"${job.title}" ilanınız silindi.` };
        res.redirect("/profilim");
    } catch (err) {
        console.log("Error Code:", 5006);
        error(`İlan silinirken hata (kullanıcı ID: ${req.session.userId}, ilan ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan silinirken bir hata oluştu." };
        res.redirect("/profilim");
    }
};

export const contact_get = (req: Request, res: Response): void => {
    res.status(200).render("user/contact");
};

export const about_get = (req: Request, res: Response): void => {
    res.status(200).render("user/about");
};

export const privacy_get = (req: Request, res: Response): void => {
    res.status(200).render("user/privacy-policy");
};

export const terms_get = (req: Request, res: Response): void => {
    res.status(200).render("user/terms");
};

export const cookies_get = (req: Request, res: Response): void => {
    res.status(200).render("user/cookie-policy");
};

export const profile_get = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const user = await User.findByPk(req.session.userId, {
        attributes: ["email", "username", "createdAt", "profileImage"]
    });

    if (!user) {
        res.redirect("/giris-yap");
        return;
    }

    const savedJobs = await SavedJob.findAll({
        where: { userId: req.session.userId },
        include: [{ model: Job, attributes: ["id", "title", "description", "company", "location", "salary", "phone", "createdAt"] }],
        order: [["createdAt", "DESC"]]
    });

    const myJobs = await Job.findAll({
        where: { userId: req.session.userId },
        order: [["createdAt", "DESC"]]
    });

    const postCount = await Post.count({ where: { userId: req.session.userId } });

    res.status(200).render("user/profile", { user, savedJobs, myJobs, postCount, userId: req.session.userId, username: user.username });
};;
