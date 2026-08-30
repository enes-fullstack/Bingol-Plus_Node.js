import { Request, Response } from "express";
import { Op } from "sequelize";

import User from "../models/user.js";
import Post from "../models/post.js";
import PostCategory from "../models/postCategory.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import Job from "../models/jobs.js";
import SavedJob from "../models/savedJobs.js";
import PasswordReset from "../models/passwordReset.js";
import JobRequest from "../models/jobRequest.js";
import Log from "../models/log.js";
import { sequelize } from "../database/connection.js";
import { destroyUserSessions } from "../config/session.js";
import { sendJobNotification } from "../services/mail.js";
import { success, error } from "../log/logger.js";
import { validateJobForm } from "../helpers/validation.js";
import { slugify } from "../helpers/slug.js";
import { formatLogMessage } from "../helpers/formatLogMessage.js";

export const dashboardGet = async (req: Request, res: Response): Promise<void> => {
    const jobCount = await Job.count();
    const postCount = await Post.count();
    const requestCount = await JobRequest.count({ where: { status: "pending" } });
    const userCount = await User.count();

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/index", { jobCount, postCount, requestCount, userCount, username, userId: req.session.userId || null });
};

export const createJobGet = async (req: Request, res: Response): Promise<void> => {
    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    const jobs = await Job.findAll({ order: [["createdAt", "DESC"]] });

    res.status(200).render("admin/add-job", { jobs, username, userId: req.session.userId || null });
};

export const createJobPost = async (req: Request, res: Response): Promise<void> => {
    const errors = validateJobForm(req.body);
    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as Record<string, string> };
        res.redirect("/admin/ilan-ekle");
        return;
    }

    if (!req.session.userId) return;

    try {
        const { title, description, company, location, salary, phone, type } = req.body;
        await Job.create({
            title: title.trim(),
            description: description.trim(),
            company: company.trim(),
            location: location.trim(),
            salary: salary?.trim() || null,
            phone: phone?.trim() || null,
            type: type?.trim() || null,
            userId: req.session.userId
        });

        req.session.flash = { type: "success", message: "İlan başarıyla eklendi." };
        res.redirect("/admin");
    } catch (err) {
        console.log("Error Code:", 5004);
        error(`İlan eklenirken hata: ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan eklenirken bir hata oluştu." };
        res.redirect("/admin/ilan-ekle");
    }
};

export const editJobGet = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/ilan-ekle"); return; }

    const job = await Job.findByPk(id);
    if (!job) { res.status(404).render("user/error"); return; }

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/edit-job", { job, username, userId: req.session.userId || null });
};

export const editJobPost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/ilan-ekle"); return; }

    const errors = validateJobForm(req.body);
    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as Record<string, string> };
        res.redirect(`/admin/ilan-duzenle/${id}`);
        return;
    }

    try {
        const job = await Job.findByPk(id);
        if (!job) {
            req.session.flash = { type: "error", message: "İlan bulunamadı." };
            res.redirect("/admin/ilan-ekle");
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

        success(`İlan güncellendi (ID: ${id})`);
        req.session.flash = { type: "success", message: "İlan başarıyla güncellendi." };
        res.redirect("/admin/ilan-ekle");
    } catch (err) {
        console.log("Error Code:", 5005);
        error(`İlan güncellenirken hata (ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan güncellenirken bir hata oluştu." };
        res.redirect(`/admin/ilan-duzenle/${id}`);
    }
};

export const jobDeletePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/ilan-ekle"); return; }

    try {
        const job = await Job.findByPk(id, { attributes: ["id", "title"] });
        if (!job) {
            req.session.flash = { type: "error", message: "İlan bulunamadı." };
            res.redirect("/admin/ilan-ekle");
            return;
        }

        await SavedJob.destroy({ where: { jobId: id } });
        await job.destroy();

        success(`İlan silindi: ${job.title} (ID: ${id})`);
        req.session.flash = { type: "success", message: `"${job.title}" ilanı silindi.` };
        res.redirect("/admin/ilan-ekle");
    } catch (err) {
        console.log("Error Code:", 5006);
        error(`İlan silinirken hata (ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İlan silinirken bir hata oluştu." };
        res.redirect("/admin/ilan-ekle");
    }
};

export const requestsGet = async (req: Request, res: Response): Promise<void> => {
    const requests = await JobRequest.findAll({
        where: { status: "pending" },
        include: [{ model: User, attributes: ["username"] }],
        order: [["createdAt", "DESC"]]
    });

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/requests", { requests, username, userId: req.session.userId || null });
};

export const requestDetailGet = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/talepler"); return; }

    const request = await JobRequest.findByPk(id, {
        include: [{ model: User, attributes: ["username"] }]
    });

    if (!request) { res.status(404).render("user/error"); return; }

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/request-detail", { request, username, userId: req.session.userId || null });
};

export const requestApprovePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/talepler"); return; }

    try {
        const jobRequest = await JobRequest.findByPk(id);
        if (!jobRequest || jobRequest.status !== "pending") {
            req.session.flash = { type: "error", message: "Talep bulunamadı veya çoktan işlenmiş." };
            res.redirect("/admin/talepler");
            return;
        }

        const user = await User.findByPk(jobRequest.userId, { attributes: ["email"] });

        await Job.create({
            title: jobRequest.title,
            description: jobRequest.description,
            company: jobRequest.company,
            location: jobRequest.location,
            salary: jobRequest.salary,
            phone: jobRequest.phone,
            type: jobRequest.type,
            userId: jobRequest.userId
        });

        await jobRequest.update({ status: "approved" });

        if (user && user.email) {
            sendJobNotification(user.email, jobRequest.title, "approved").catch(() => {});
        }

        req.session.flash = { type: "success", message: "İlan onaylandı ve yayına alındı." };
        res.redirect("/admin/talepler");
    } catch (err) {
        console.log("Error Code:", 5008);
        error(`İlan onaylanırken hata (talep ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Onaylama sırasında bir hata oluştu." };
        res.redirect("/admin/talepler");
    }
};

export const requestRejectPost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/talepler"); return; }

    try {
        const jobRequest = await JobRequest.findByPk(id);
        if (!jobRequest || jobRequest.status !== "pending") {
            req.session.flash = { type: "error", message: "Talep bulunamadı veya çoktan işlenmiş." };
            res.redirect("/admin/talepler");
            return;
        }

        const user = await User.findByPk(jobRequest.userId, { attributes: ["email"] });

        await jobRequest.update({ status: "rejected" });

        if (user && user.email) {
            sendJobNotification(user.email, jobRequest.title, "rejected").catch(() => {});
        }

        req.session.flash = { type: "success", message: "İlan talebi reddedildi." };
        res.redirect("/admin/talepler");
    } catch (err) {
        console.log("Error Code:", 5009);
        error(`İlan reddedilirken hata (talep ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Reddetme sırasında bir hata oluştu." };
        res.redirect("/admin/talepler");
    }
};

export const logsGet = async (req: Request, res: Response): Promise<void> => {
    const page = Math.min(100, Math.max(1, Number(req.query.page) || 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const filterType = typeof req.query.type === "string" ? req.query.type : null;
    const where: Record<string, unknown> = {};
    if (filterType && ["success", "info", "warning", "error", "critical"].includes(filterType)) {
        where.type = filterType;
    }

    const { count, rows: logs } = await Log.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset
    });

    const totalPages = Math.ceil(count / limit);

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/logs", {
        logs,
        page,
        totalPages,
        filterType,
        username,
        userId: req.session.userId || null
    });
};

export const usersGet = async (req: Request, res: Response): Promise<void> => {
    const page = Math.min(100, Math.max(1, Number(req.query.page) || 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const where: Record<string, unknown> = {};
    if (search) {
        const escaped = search.replace(/[\\%_]/g, "\\$&");
        where[Op.or as unknown as string] = [
            { username: { [Op.like]: `%${escaped}%` } },
            { email: { [Op.like]: `%${escaped}%` } }
        ];
    }

    const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: {
            include: [
                [sequelize.literal(`COALESCE((SELECT COUNT(*) FROM posts WHERE posts.userId = User.id), 0)`), "postCount"]
            ]
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
        paranoid: false
    });

    const totalPages = Math.ceil(count / limit);

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/users", {
        users,
        page,
        totalPages,
        search,
        username,
        userId: req.session.userId || null
    });
};

export const userBanPost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/kullanicilar"); return; }

    if (id === req.session.userId) {
        req.session.flash = { type: "error", message: "Kendinizi banlayamazsınız." };
        res.redirect("/admin/kullanicilar");
        return;
    }

    try {
        const user = await User.findByPk(id, { attributes: ["id", "banned", "username", "role"] });
        if (!user) {
            req.session.flash = { type: "error", message: "Kullanıcı bulunamadı." };
            res.redirect("/admin/kullanicilar");
            return;
        }

        if ((user as any).role === "admin") {
            req.session.flash = { type: "error", message: "Admin kullanıcıları banlanamaz." };
            res.redirect("/admin/kullanicilar");
            return;
        }

        const wasBanned = user.banned;
        await user.update({ banned: !wasBanned });

        if (!wasBanned) {
            await destroyUserSessions(user.id);
        }

        const action = wasBanned ? "banı kaldırıldı" : "banlandı";
        success(`Kullanıcı ${action} (ID: ${id})`);
        req.session.flash = { type: "success", message: `"${user.username}" kullanıcısı ${action}.` };
        res.redirect("/admin/kullanicilar");
    } catch (err) {
        console.log("Error Code:", 3003);
        error(`Kullanıcı banlanırken hata (ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "İşlem sırasında bir hata oluştu." };
        res.redirect("/admin/kullanicilar");
    }
};

export const userDeletePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/kullanicilar"); return; }

    if (id === req.session.userId) {
        req.session.flash = { type: "error", message: "Kendinizi silemezsiniz." };
        res.redirect("/admin/kullanicilar");
        return;
    }

    try {
        const target = await User.findByPk(id, { attributes: ["role"], paranoid: false });
        if (target && (target as any).role === "admin") {
            req.session.flash = { type: "error", message: "Admin kullanıcıları silinemez." };
            res.redirect("/admin/kullanicilar");
            return;
        }

        await SavedJob.destroy({ where: { userId: id } });
        await PostLike.destroy({ where: { userId: id } });
        await PostReply.destroy({ where: { userId: id } });
        await Post.destroy({ where: { userId: id } });
        await Job.destroy({ where: { userId: id } });
        await PasswordReset.destroy({ where: { userId: id } });
        await JobRequest.destroy({ where: { userId: id } });
        await User.destroy({ where: { id } });
        await destroyUserSessions(id);

        success(`Kullanıcı silindi (ID: ${id})`);
        req.session.flash = { type: "success", message: "Kullanıcı ve tüm ilişkili verileri silindi." };
        res.redirect("/admin/kullanicilar");
    } catch (err) {
        console.log("Error Code:", 3004);
        error(`Kullanıcı silinirken hata (ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Kullanıcı silinirken bir hata oluştu." };
        res.redirect("/admin/kullanicilar");
    }
};

export const topicDeletePost = async (req: Request, res: Response): Promise<void> => {
    const postId = Number(req.params.postId);

    if (!postId || isNaN(postId)) {
        res.redirect("/forum");
        return;
    }

    try {
        await PostLike.destroy({ where: { postId } });
        await PostReply.destroy({ where: { postId } });
        await Post.destroy({ where: { id: postId } });

        req.session.flash = { type: "success", message: "Konu başarıyla silindi." };
        res.redirect("/forum");
    } catch (err) {
        console.log("Error Code:", 4011);
        error(`Konu silinirken hata (post ID: ${postId}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Konu silinirken bir hata oluştu." };
        res.redirect("/forum");
    }
};

export const categoriesGet = async (req: Request, res: Response): Promise<void> => {
    const categories = await PostCategory.findAll({
        attributes: {
            include: [
                [sequelize.literal(`(SELECT COUNT(*) FROM posts WHERE posts.categoryId = PostCategory.id)`), "postCount"]
            ]
        },
        order: [["id", "ASC"]]
    });
    const uniIdx = categories.findIndex((c:any) => c.name === "Üniversite");
    if (uniIdx > -1) { const [uni] = categories.splice(uniIdx as number, 1); categories.splice(2, 0, uni as any); }

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/categories", { categories, username, userId: req.session.userId || null });
};

export const categoryCreatePost = async (req: Request, res: Response): Promise<void> => {
    const name = (req.body.name || "").trim();
    if (!name) {
        req.session.flash = { type: "error", message: "Kategori adı boş olamaz." };
        res.redirect("/admin/kategoriler");
        return;
    }

    if (name.length > 50) {
        req.session.flash = { type: "error", message: "Kategori adı en fazla 50 karakter olabilir." };
        res.redirect("/admin/kategoriler");
        return;
    }

    const existing = await PostCategory.findOne({ where: { name } });
    if (existing) {
        req.session.flash = { type: "error", message: `"${name}" kategorisi zaten mevcut.` };
        res.redirect("/admin/kategoriler");
        return;
    }

    const slug = slugify(name);
    if (!slug) {
        req.session.flash = { type: "error", message: "Geçerli bir kategori adı giriniz." };
        res.redirect("/admin/kategoriler");
        return;
    }

    try {
        await PostCategory.create({ name, slug });
        success(`Kategori eklendi: ${name} (slug: ${slug})`);
        req.session.flash = { type: "success", message: `"${name}" kategorisi eklendi.` };
        res.redirect("/admin/kategoriler");
    } catch (err) {
        console.log("Error Code:", 4009);
        error(`Kategori eklenirken hata: ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Kategori eklenirken bir hata oluştu." };
        res.redirect("/admin/kategoriler");
    }
};

export const categoryDeletePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/kategoriler"); return; }

    try {
        const category = await PostCategory.findByPk(id);
        if (!category) {
            req.session.flash = { type: "error", message: "Kategori bulunamadı." };
            res.redirect("/admin/kategoriler");
            return;
        }

        const postCount = await Post.count({ where: { categoryId: id } });
        if (postCount > 0) {
            req.session.flash = { type: "error", message: `"${category.name}" kategorisine ait ${postCount} konu bulunuyor. Önce konuları taşıyın veya silin.` };
            res.redirect("/admin/kategoriler");
            return;
        }

        await category.destroy();
        success(`Kategori silindi: ${category.name} (ID: ${id})`);
        req.session.flash = { type: "success", message: `"${category.name}" kategorisi silindi.` };
        res.redirect("/admin/kategoriler");
    } catch (err) {
        console.log("Error Code:", 4010);
        error(`Kategori silinirken hata (ID: ${id}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Kategori silinirken bir hata oluştu." };
        res.redirect("/admin/kategoriler");
    }
};
