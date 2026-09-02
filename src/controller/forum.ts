import { Request, Response } from "express";

import Post from "../models/post.js";
import User from "../models/user.js";
import PostCategory from "../models/postCategory.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import { sequelize } from "../database/connection.js";
import { optimizeUrl } from "../cloud/upload.js";
import { validateForumForm } from "../helpers/validation.js";
import { slugify } from "../helpers/slug.js";
import { error } from "../log/logger.js";
import { formatLogMessage } from "../helpers/formatLogMessage.js";

const isAdminUser = async (userId: number): Promise<boolean> => {
    const user = await User.findByPk(userId, { attributes: ["role"] });
    return user?.role === "admin";
};

const getSafeForumRedirect = (redirect: unknown): string => {
    if (typeof redirect !== "string") return "/forum";
    if (redirect === "/forum" || redirect === "/forum/akis") return redirect;
    if (/^\/forum\/akis\/[a-z0-9-]+$/.test(redirect)) return redirect;
    return "/forum";
};

export const listGet = async (req: Request, res: Response): Promise<void> => {
    const categories = await PostCategory.findAll({ order: [["id", "ASC"]] });
    const uniIdx = categories.findIndex(c => c.name === "Üniversite");
    if (uniIdx > -1) { const [uni] = categories.splice(uniIdx, 1); categories.splice(2, 0, uni as any); }

    const categoryCountRows = await Post.findAll({
        attributes: [
            "categoryId",
            [sequelize.fn("COUNT", sequelize.col("Post.id")), "count"]
        ],
        group: ["categoryId"]
    } as any);

    const countByCategoryId: Record<number, number> = {};
    categoryCountRows.forEach(r => {
        countByCategoryId[Number((r as any).categoryId)] = Number((r as any).getDataValue("count"));
    });

    const categoryCountMap: Record<string, number> = {};
    categories.forEach(c => { categoryCountMap[c.name] = countByCategoryId[c.id] || 0; });

    const postCount = await Post.count();

    // backward compat: keep old variables for tests that still expect posts list
    const limit = 10;
    const posts = await Post.findAll({
        include: [
            { model: User, attributes: ["id", "username", "profileImage"] },
            { model: PostCategory, attributes: ["name"] }
        ],
        order: [["createdAt", "DESC"]],
        limit
    });
    const avatarMap: Record<number, string | null> = {};
    posts.forEach(p => {
        const pu: any = p;
        if (pu.User) {
            avatarMap[pu.User.id] = optimizeUrl(pu.User.profileImage, 24, 24);
        }
    });
    const total = postCount;
    let isAdmin = false;
    if (req.session.userId) {
        isAdmin = await isAdminUser(req.session.userId);
    }

    res.status(200).render("forum/list", {
        posts,
        avatarMap,
        isAdmin,
        userId: req.session.userId || null,
        initialOffset: limit,
        hasMore: total > limit,
        categories,
        categoryCountMap,
        postCount
    });
};

export const detailGet = async (req: Request, res: Response): Promise<void> => {
    const postId = Number(req.params.id);
    if (!postId || isNaN(postId)) {
        res.redirect("/forum");
        return;
    }

    const post = await Post.findByPk(postId, {
        include: [
            { model: User, attributes: ["id", "username", "profileImage"] },
            { model: PostCategory, attributes: ["name"] }
        ]
    });

    if (!post) {
        res.status(404).render("user/error");
        return;
    }

    const correctSlug = slugify((post as any).title);
    const requestedSlug = (req.params as Record<string, string | undefined>).slug;
    if (requestedSlug && requestedSlug !== correctSlug) {
        res.redirect(301, `/forum/konu/${post.id}/${correctSlug}`);
        return;
    }

    // SEO: canonical always points to slug version
    const rawBase = process.env.SITE_URL || "https://bingolplus.com";
    const baseUrl = rawBase.replace(/\/$/, "");
    res.locals.canonical = `${baseUrl}/forum/konu/${post.id}/${correctSlug}`;

    let userLiked = false;
    if (req.session.userId) {
        const like = await PostLike.findOne({ where: { userId: req.session.userId, postId } });
        userLiked = !!like;
    }

    const replies = await PostReply.findAll({
        where: { postId },
        include: [{ model: User, attributes: ["id", "username", "profileImage"] }],
        order: [["createdAt", "ASC"]],
        limit: 10
    });

    const totalReplies = await PostReply.count({ where: { postId } });

    const avatarMap: AvatarMap = {};
    const pu = (post as any).User;
    if (pu) {
        avatarMap[pu.id] = optimizeUrl(pu.profileImage, 36, 36);
    }
    replies.forEach(r => {
        const ru = (r as any).User;
        if (ru && !(ru.id in avatarMap)) {
            avatarMap[ru.id] = optimizeUrl(ru.profileImage, 28, 28);
        }
    });

    res.status(200).render("forum/detail", { post, userLiked, userId: req.session.userId || null, replies, totalReplies, avatarMap });
};

interface AvatarMap { [userId: number]: string | null; }

export const getAkisData = async (req: Request, where: Record<string, unknown> = {}) => {
    const limit = 10;

    const posts = await Post.findAll({
        where: Object.keys(where).length ? where : undefined,
        include: [
            { model: User, attributes: ["id", "username", "profileImage"] },
            { model: PostCategory, attributes: ["name"] }
        ],
        order: [["createdAt", "DESC"]],
        limit
    });

    const avatarMap: AvatarMap = {};
    posts.forEach(p => {
        const pu = (p as any).User;
        if (pu) {
            avatarMap[pu.id] = optimizeUrl(pu.profileImage, 36, 36);
        }
    });

    let userLikedMap: Record<number, boolean> = {};
    if (req.session.userId) {
        const likes = await PostLike.findAll({ where: { userId: req.session.userId } });
        likes.forEach(l => { userLikedMap[l.postId] = true; });
    }

    const postIds = posts.map(p => p.id);
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
            const pid = reply.postId;
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

    const total = await Post.count({ where: Object.keys(where).length ? where : undefined });

    return { posts, avatarMap, userLikedMap, repliesByPost, replyCounts, hasMore: total > limit, initialOffset: limit };
};

export const feedGet = async (req: Request, res: Response): Promise<void> => {
    const [data, categoriesRaw, categoryCountRows, postCount] = await Promise.all([
        getAkisData(req),
        PostCategory.findAll({ order: [["id", "ASC"]] }),
        Post.findAll({
            attributes: [
                "categoryId",
                [sequelize.fn("COUNT", sequelize.col("Post.id")), "count"]
            ],
            group: ["categoryId"]
        } as any),
        Post.count()
    ]);
    const categories: any = categoriesRaw;
    const uniIdx = categories.findIndex((c: any) => c.name === "Üniversite");
    if (uniIdx > -1) { const [uni] = categories.splice(uniIdx, 1); categories.splice(2, 0, uni); }

    const countByCategoryId: Record<number, number> = {};
    (categoryCountRows as any[]).forEach(r => {
        countByCategoryId[Number((r as any).categoryId)] = Number((r as any).getDataValue("count"));
    });
    const categoryCountMap: Record<string, number> = {};
    categories.forEach((c: any) => { categoryCountMap[c.name] = countByCategoryId[c.id] || 0; });

    res.status(200).render("forum/feed", { ...data, kategori: null, slug: null, userId: req.session.userId || null, categories, categoryCountMap, postCount });
};

export const feedCategoryGet = async (req: Request, res: Response): Promise<void> => {
    const slug = req.params.kategori as string;
    const category = await PostCategory.findOne({ where: { slug } });
    if (!category) { res.status(404).render("user/error"); return; }

    const [data, categoriesRaw, categoryCountRows, postCount] = await Promise.all([
        getAkisData(req, { categoryId: category.id }),
        PostCategory.findAll({ order: [["id", "ASC"]] }),
        Post.findAll({
            attributes: [
                "categoryId",
                [sequelize.fn("COUNT", sequelize.col("Post.id")), "count"]
            ],
            group: ["categoryId"]
        } as any),
        Post.count()
    ]);
    const categories: any = categoriesRaw;
    const uniIdx2 = categories.findIndex((c: any) => c.name === "Üniversite");
    if (uniIdx2 > -1) { const [uni] = categories.splice(uniIdx2, 1); categories.splice(2, 0, uni); }

    const countByCategoryId: Record<number, number> = {};
    (categoryCountRows as any[]).forEach(r => {
        countByCategoryId[Number((r as any).categoryId)] = Number((r as any).getDataValue("count"));
    });
    const categoryCountMap: Record<string, number> = {};
    categories.forEach((c: any) => { categoryCountMap[c.name] = countByCategoryId[c.id] || 0; });

    res.status(200).render("forum/feed", { ...data, kategori: category.name, slug, userId: req.session.userId || null, categories, categoryCountMap, postCount });
};

export const createGet = async (req: Request, res: Response): Promise<void> => {
    const categories = await PostCategory.findAll({ order: [["id", "ASC"]] });
    const uniIdx3 = categories.findIndex(c => c.name === "Üniversite");
    if (uniIdx3 > -1) { const [uni] = categories.splice(uniIdx3, 1); categories.splice(2, 0, uni as any); }
    res.status(200).render("forum/create", { userId: req.session.userId || null, categories });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }

    const { title, content, categoryId } = req.body;
    const numericCategoryId = Number(categoryId);
    const oldInput = { title: (title || "").trim(), content: (content || "").trim(), categoryId: isNaN(numericCategoryId) ? "" : numericCategoryId };

    const errors = validateForumForm(req.body);

    const category = !isNaN(numericCategoryId) ? await PostCategory.findByPk(numericCategoryId) : null;
    if (!category) {
        errors.category = "Geçerli bir kategori seçiniz.";
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as unknown as Record<string, string>, oldInput: oldInput as Record<string, string> };
        res.redirect("/forum/konu-ac");
        return;
    }

    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors: errors as unknown as Record<string, string>, oldInput: oldInput as Record<string, string> };
        res.redirect("/forum/konu-ac");
        return;
    }

    try {
        await Post.create({
            userId: req.session.userId,
            title: title.trim(),
            content: content.trim(),
            categoryId: category.id
        });

        req.session.flash = { type: "success", message: "Konunuz başarıyla oluşturuldu." };
        const redirect = getSafeForumRedirect(req.query.redirect);
        res.redirect(redirect);
    } catch (err) {
        console.log("Error Code:", 4001);
        error(`Post oluşturulurken hata (kullanıcı ID: ${req.session.userId}): ${formatLogMessage(err)}`);
        req.session.flash = { type: "error", message: "Konu oluşturulurken bir hata oluştu." };
        res.redirect("/forum/konu-ac");
    }
};
