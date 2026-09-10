import { Request, Response } from "express";
import { Op } from "sequelize";

import User from "../models/user.js";
import Post from "../models/post.js";
import PostCategory from "../models/postCategory.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import Job from "../models/jobs.js";
import SavedJob from "../models/savedJobs.js";
import SavedPost from "../models/savedPost.js";
import PasswordReset from "../models/passwordReset.js";
import JobRequest from "../models/jobRequest.js";
import JobApplication from "../models/jobApplication.js";
import Log from "../models/log.js";
import { sequelize } from "../database/connection.js";
import { destroyUserSessions } from "../config/session.js";
import { sendJobNotification } from "../services/mail.js";
import { success, error } from "../log/logger.js";
import { validateJobForm, validateEmail, validateUsername, isReservedUsername } from "../helpers/validation.js";
import { slugify } from "../helpers/slug.js";
import { normalizeError } from "../helpers/normalizeError.js";

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
    const errors = validateJobForm(req.body as Record<string, unknown>);
    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as Record<string, string> };
        res.redirect("/admin/ilan-ekle");
        return;
    }

    if (!req.session.userId) return;

    try {
        const titleRaw = (req.body as any).title;
        const descriptionRaw = (req.body as any).description;
        const companyRaw = (req.body as any).company;
        const locationRaw = (req.body as any).location;
        const salaryRaw = (req.body as any).salary;
        const phoneRaw = (req.body as any).phone;
        const typeRaw = (req.body as any).type;
        await Job.create({
            title: typeof titleRaw === "string" ? titleRaw.trim() : "",
            description: typeof descriptionRaw === "string" ? descriptionRaw.trim() : "",
            company: typeof companyRaw === "string" ? companyRaw.trim() : "",
            location: typeof locationRaw === "string" ? locationRaw.trim() : "",
            salary: typeof salaryRaw === "string" ? salaryRaw.trim() || null : null,
            phone: typeof phoneRaw === "string" ? phoneRaw.trim() || null : null,
            type: typeof typeRaw === "string" ? typeRaw.trim() || null : null,
            userId: req.session.userId
        });

        req.session.flash = { type: "success", message: "İlan başarıyla eklendi." };
        res.redirect("/admin");
    } catch (err) {
        console.log("Error Code:", 5004);
        error(`İlan eklenirken hata: ${normalizeError(err)}`);
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

    const errors = validateJobForm(req.body as Record<string, unknown>);
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

        const titleRaw = (req.body as any).title;
        const descriptionRaw = (req.body as any).description;
        const companyRaw = (req.body as any).company;
        const locationRaw = (req.body as any).location;
        const salaryRaw = (req.body as any).salary;
        const phoneRaw = (req.body as any).phone;
        const typeRaw = (req.body as any).type;
        await job.update({
            title: typeof titleRaw === "string" ? titleRaw.trim() : "",
            description: typeof descriptionRaw === "string" ? descriptionRaw.trim() : "",
            company: typeof companyRaw === "string" ? companyRaw.trim() : "",
            location: typeof locationRaw === "string" ? locationRaw.trim() : "",
            salary: typeof salaryRaw === "string" ? salaryRaw.trim() || null : null,
            phone: typeof phoneRaw === "string" ? phoneRaw.trim() || null : null,
            type: typeof typeRaw === "string" ? typeRaw.trim() || null : null
        });

        success(`İlan güncellendi (ID: ${id})`);
        req.session.flash = { type: "success", message: "İlan başarıyla güncellendi." };
        res.redirect("/admin/ilan-ekle");
    } catch (err) {
        console.log("Error Code:", 5005);
        error(`İlan güncellenirken hata (ID: ${id}): ${normalizeError(err)}`);
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
        await JobApplication.destroy({ where: { jobId: id } });
        await job.destroy();

        success(`İlan silindi: ${job.title} (ID: ${id})`);
        req.session.flash = { type: "success", message: `"${job.title}" ilanı silindi.` };
        res.redirect("/admin/ilan-ekle");
    } catch (err) {
        console.log("Error Code:", 5006);
        error(`İlan silinirken hata (ID: ${id}): ${normalizeError(err)}`);
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
            phone: (jobRequest as any).phone || null,
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
        error(`İlan onaylanırken hata (talep ID: ${id}): ${normalizeError(err)}`);
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
        error(`İlan reddedilirken hata (talep ID: ${id}): ${normalizeError(err)}`);
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

export const logDeletePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/loglar"); return; }

    try {
        const log = await Log.findByPk(id);
        if (!log) {
            req.session.flash = { type: "error", message: "Log bulunamadı." };
            res.redirect("/admin/loglar");
            return;
        }
        await log.destroy();
        success(`Log silindi (ID: ${id})`);
        req.session.flash = { type: "success", message: "Log silindi." };
        res.redirect("/admin/loglar");
    } catch (err) {
        console.log("Error Code:", 6010);
        error(`Log silinirken hata (ID: ${id}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Log silinirken bir hata oluştu." };
        res.redirect("/admin/loglar");
    }
};

export const logsDeleteAllPost = async (req: Request, res: Response): Promise<void> => {
    try {
        await Log.destroy({ where: {} });
        success("Tüm loglar silindi");
        req.session.flash = { type: "success", message: "Tüm loglar silindi." };
        res.redirect("/admin/loglar");
    } catch (err) {
        console.log("Error Code:", 6011);
        error(`Tüm loglar silinirken hata: ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Loglar silinirken bir hata oluştu." };
        res.redirect("/admin/loglar");
    }
};

export const usersGet = async (req: Request, res: Response): Promise<void> => {
    const page = Math.min(100, Math.max(1, Number(req.query.page) || 1));
    const limit = 20;
    const offset = (page - 1) * limit;

    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const rawStatus = typeof req.query.status === "string" ? req.query.status.trim() : "all";
    const status = rawStatus === "active" || rawStatus === "banned" || rawStatus === "deleted" ? rawStatus : "all";

    const statusWhere: Record<string, unknown> = {};
    if (status === "active") {
        statusWhere["banned"] = false;
        statusWhere["deletedAt"] = null;
    } else if (status === "banned") {
        statusWhere["banned"] = true;
        statusWhere["deletedAt"] = null;
    } else if (status === "deleted") {
        (statusWhere as Record<string, unknown>)["deletedAt"] = { [Op.not]: null };
    }

    const searchWhere: Record<string, unknown> = {};
    if (search) {
        const escaped = search.replace(/[\\%_]/g, "\\$&");
        searchWhere[Op.or as unknown as string] = [
            { username: { [Op.like]: `%${escaped}%` } },
            { email: { [Op.like]: `%${escaped}%` } }
        ];
    }

    const where: Record<string, unknown> = {};
    const hasStatus = Object.keys(statusWhere).length > 0;
    const hasSearch = Object.keys(searchWhere).length > 0;
    if (hasStatus && hasSearch) {
        where[Op.and as unknown as string] = [statusWhere, searchWhere];
    } else if (hasStatus) {
        Object.assign(where, statusWhere);
    } else if (hasSearch) {
        Object.assign(where, searchWhere);
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

    const [statsTotal, statsActive, statsBanned, statsDeleted] = await Promise.all([
        User.count({ paranoid: false }),
        User.count({ where: { banned: false } }),
        User.count({ where: { banned: true } }),
        User.count({ where: { deletedAt: { [Op.not]: null } } as unknown as Record<string, unknown>, paranoid: false })
    ]);

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/users", {
        users,
        page,
        totalPages,
        totalUsers: count,
        statsTotal,
        statsActive,
        statsBanned,
        statsDeleted,
        search,
        status,
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
        error(`Kullanıcı banlanırken hata (ID: ${id}): ${normalizeError(err)}`);
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
        await SavedPost.destroy({ where: { userId: id } });
        await PostLike.destroy({ where: { userId: id } });
        await PostReply.destroy({ where: { userId: id } });
        await Post.destroy({ where: { userId: id } });
        await JobApplication.destroy({ where: { userId: id } });
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
        error(`Kullanıcı silinirken hata (ID: ${id}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Kullanıcı silinirken bir hata oluştu." };
        res.redirect("/admin/kullanicilar");
    }
};

export const userDetailGet = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/kullanicilar"); return; }

    const targetUser = await User.findByPk(id, { paranoid: false });
    if (!targetUser) { res.status(404).render("user/error"); return; }

    const [posts, replies] = await Promise.all([
        Post.findAll({
            where: { userId: id },
            include: [{ model: PostCategory, attributes: ["id", "name", "slug"] }],
            order: [["createdAt", "DESC"]],
            limit: 50
        }),
        PostReply.findAll({ where: { userId: id }, attributes: ["postId"] })
    ]);

    const replyCountByPost: Record<number, number> = {};
    for (const reply of replies) {
        replyCountByPost[reply.postId] = (replyCountByPost[reply.postId] || 0) + 1;
    }
    const repliedIds = Object.keys(replyCountByPost).map(Number);

    let repliedPosts: Post[] = [];
    if (repliedIds.length > 0) {
        repliedPosts = await Post.findAll({
            where: { id: repliedIds },
            include: [
                { model: PostCategory, attributes: ["id", "name", "slug"] },
                { model: User, attributes: ["id", "username"] }
            ],
            order: [["createdAt", "DESC"]]
        });
    }

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/user-detail", {
        targetUser,
        posts,
        repliedPosts,
        replyCountByPost,
        username,
        userId: req.session.userId || null
    });
};

export const userDetailPost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) { res.redirect("/admin/kullanicilar"); return; }

    try {
        const target = await User.findByPk(id, { paranoid: false });
        if (!target) {
            req.session.flash = { type: "error", message: "Kullanıcı bulunamadı." };
            res.redirect("/admin/kullanicilar");
            return;
        }
        if (target.deletedAt) {
            req.session.flash = { type: "error", message: "Silinmiş kullanıcı düzenlenemez." };
            res.redirect(`/admin/kullanicilar/${id}`);
            return;
        }

        const body = req.body as Record<string, unknown>;
        const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
        const usernameRaw = typeof body.username === "string" ? body.username.trim() : "";
        const roleRaw = typeof body.role === "string" ? body.role : "";
        const bannedRaw = body.banned === "on" || body.banned === "true" || body.banned === true;
        const ipRaw = typeof body.ip === "string" ? body.ip.trim() : "";
        const userAgentRaw = typeof body.userAgent === "string" ? body.userAgent.trim() : "";
        const oldInput = { email: emailRaw, username: usernameRaw, role: roleRaw, banned: bannedRaw, ip: ipRaw, userAgent: userAgentRaw };

        const errors: Record<string, string> = {};
        if (!validateEmail(emailRaw) || emailRaw.length < 10 || emailRaw.length > 50) {
            errors.email = "Geçerli bir e-posta giriniz (10-50 karakter).";
        }
        if (!validateUsername(usernameRaw)) {
            errors.username = "Kullanıcı adı 2-50 karakter olmalı (harf, rakam, _ ve -).";
        } else if (isReservedUsername(usernameRaw)) {
            errors.username = "Bu kullanıcı adı kullanılamaz.";
        }
        if (roleRaw !== "user" && roleRaw !== "admin") {
            errors.role = "Rol seçiniz.";
        }
        if (!ipRaw || ipRaw.length > 45) {
            errors.ip = "Geçerli bir IP giriniz (en fazla 45 karakter).";
        }
        if (!userAgentRaw || userAgentRaw.length > 255) {
            errors.userAgent = "User-Agent en fazla 255 karakter olabilir.";
        }

        const isSelf = id === req.session.userId;
        if (!errors.role && roleRaw !== target.role) {
            if (isSelf) {
                errors.role = "Kendi rolünüzü buradan değiştiremezsiniz.";
            } else if (target.role === "admin") {
                errors.role = "Admin kullanıcıların rolü değiştirilemez.";
            }
        }
        if (bannedRaw !== target.banned) {
            if (isSelf) {
                errors.banned = "Kendi ban durumunuzu buradan değiştiremezsiniz.";
            } else if (target.role === "admin") {
                errors.banned = "Admin kullanıcıları banlanamaz.";
            }
        }

        if (Object.keys(errors).length > 0) {
            req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors, oldInput };
            res.redirect(`/admin/kullanicilar/${id}`);
            return;
        }

        if (emailRaw !== target.email) {
            const emailTaken = await User.findOne({ where: { email: emailRaw }, attributes: ["id"], paranoid: false });
            if (emailTaken && emailTaken.id !== target.id) {
                req.session.flash = { type: "error", message: "Bu e-posta başka bir kullanıcı tarafından kullanılıyor.", errors: { email: "Bu e-posta başka bir kullanıcı tarafından kullanılıyor." }, oldInput };
                res.redirect(`/admin/kullanicilar/${id}`);
                return;
            }
        }
        if (usernameRaw !== target.username) {
            const usernameTaken = await User.findOne({ where: { username: usernameRaw }, attributes: ["id"], paranoid: false });
            if (usernameTaken && usernameTaken.id !== target.id) {
                req.session.flash = { type: "error", message: "Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor.", errors: { username: "Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor." }, oldInput };
                res.redirect(`/admin/kullanicilar/${id}`);
                return;
            }
        }

        const wasBanned = target.banned;
        await target.update({
            email: emailRaw,
            username: usernameRaw,
            role: roleRaw as "user" | "admin",
            banned: bannedRaw,
            ip: ipRaw,
            userAgent: userAgentRaw
        });

        if (!wasBanned && bannedRaw) {
            await destroyUserSessions(target.id);
        }

        success(`Kullanıcı güncellendi (ID: ${id})`);
        req.session.flash = { type: "success", message: `"${usernameRaw}" kullanıcısının bilgileri güncellendi.` };
        res.redirect(`/admin/kullanicilar/${id}`);
    } catch (err) {
        console.log("Error Code:", 3005);
        error(`Kullanıcı güncellenirken hata (ID: ${id}): ${normalizeError(err)}`);
        const message = err instanceof Error && err.name === "SequelizeUniqueConstraintError"
            ? "E-posta veya kullanıcı adı zaten kullanımda."
            : "Kullanıcı güncellenirken bir hata oluştu.";
        req.session.flash = { type: "error", message };
        res.redirect(`/admin/kullanicilar/${id}`);
    }
};

export const topicDeletePost = async (req: Request, res: Response): Promise<void> => {
    const postId = Number(req.params.postId);

    const redirectBack = (): void => {
        const referer = (req.headers.referer || "") as string;
        const userDetailMatch = referer.match(/\/admin\/kullanicilar\/(\d+)/);
        if (userDetailMatch) {
            res.redirect(`/admin/kullanicilar/${userDetailMatch[1]}`);
        } else if (referer.includes("/admin/forum")) {
            res.redirect("/admin/forum");
        } else {
            res.redirect("/forum");
        }
    };

    if (!postId || isNaN(postId)) {
        redirectBack();
        return;
    }

    try {
        await PostLike.destroy({ where: { postId } });
        await PostReply.destroy({ where: { postId } });
        await SavedPost.destroy({ where: { postId } });
        await Post.destroy({ where: { id: postId } });

        req.session.flash = { type: "success", message: "Konu başarıyla silindi." };
        redirectBack();
    } catch (err) {
        console.log("Error Code:", 4011);
        error(`Konu silinirken hata (post ID: ${postId}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Konu silinirken bir hata oluştu." };
        redirectBack();
    }
};

export const userRepliesDeletePost = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const postId = Number(req.params.postId);
    if (!id || isNaN(id) || !postId || isNaN(postId)) { res.redirect("/admin/kullanicilar"); return; }

    try {
        const count = await PostReply.destroy({ where: { postId, userId: id } });
        if (count === 0) {
            req.session.flash = { type: "error", message: "Silinecek yanıt bulunamadı." };
        } else {
            success(`Kullanıcının yanıtları silindi (kullanıcı ID: ${id}, post ID: ${postId}, adet: ${count})`);
            req.session.flash = { type: "success", message: `${count} yanıt başarıyla silindi.` };
        }
        res.redirect(`/admin/kullanicilar/${id}`);
    } catch (err) {
        console.log("Error Code:", 4012);
        error(`Kullanıcı yanıtları silinirken hata (kullanıcı ID: ${id}, post ID: ${postId}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Yanıtlar silinirken bir hata oluştu." };
        res.redirect(`/admin/kullanicilar/${id}`);
    }
};

export const forumManageGet = async (req: Request, res: Response): Promise<void> => {
    const postPage = Math.min(100, Math.max(1, Number(req.query.postPage) || 1));
    const replyPage = Math.min(100, Math.max(1, Number(req.query.replyPage) || 1));
    const limit = 20;
    const postOffset = (postPage - 1) * limit;
    const replyOffset = (replyPage - 1) * limit;

    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const escaped = search.replace(/[\\%_]/g, "\\$&");

    const postWhere: Record<string, unknown> = {};
    const replyWhere: Record<string, unknown> = {};
    if (search) {
        (postWhere as any)[Op.or] = [
            { title: { [Op.like]: `%${escaped}%` } },
            { content: { [Op.like]: `%${escaped}%` } }
        ];
        replyWhere.content = { [Op.like]: `%${escaped}%` };
    }

    const [postCount, replyCount] = await Promise.all([Post.count({ where: postWhere }), PostReply.count({ where: replyWhere })]);

    const posts = await Post.findAll({
        where: postWhere,
        include: [
            { model: User, attributes: ["id", "username"] },
            { model: PostCategory, attributes: ["name"] }
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset: postOffset
    });

    const replies = await PostReply.findAll({
        where: replyWhere,
        include: [
            { model: User, attributes: ["id", "username"] },
            { model: Post, attributes: ["id", "title"] }
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset: replyOffset
    });

    let username: string | null = null;
    if (req.session.userId) {
        const user = await User.findByPk(req.session.userId, { attributes: ["username"] });
        if (user) username = user.username;
    }

    res.status(200).render("admin/forum", {
        posts,
        replies,
        postPage,
        replyPage,
        postTotalPages: Math.ceil(postCount / limit),
        replyTotalPages: Math.ceil(replyCount / limit),
        postCount,
        replyCount,
        search,
        username,
        userId: req.session.userId || null
    });
};

export const replyDeletePost = async (req: Request, res: Response): Promise<void> => {
    const replyId = Number((req.params as Record<string, string>).id || (req.params as Record<string, string>).replyId);
    if (!replyId || isNaN(replyId)) {
        res.redirect("/admin/forum");
        return;
    }

    try {
        const reply = await PostReply.findByPk(replyId);
        if (!reply) {
            req.session.flash = { type: "error", message: "Yanıt bulunamadı." };
            res.redirect("/admin/forum");
            return;
        }
        await reply.destroy();
        req.session.flash = { type: "success", message: "Yanıt başarıyla silindi." };
        res.redirect("/admin/forum");
    } catch (err) {
        console.log("Error Code:", 4012);
        error(`Yanıt silinirken hata (reply ID: ${replyId}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Yanıt silinirken bir hata oluştu." };
        res.redirect("/admin/forum");
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
    const rawName = (req.body as any).name;
    const name = typeof rawName === "string" ? rawName.trim() : "";
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
        error(`Kategori eklenirken hata: ${normalizeError(err)}`);
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
        error(`Kategori silinirken hata (ID: ${id}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Kategori silinirken bir hata oluştu." };
        res.redirect("/admin/kategoriler");
    }
};
