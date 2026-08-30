import { Request, Response } from "express";
import { Op } from "sequelize";

import User from "../models/user.js";
import PostCategory from "../models/postCategory.js";
import SavedJob from "../models/savedJobs.js";
import Job from "../models/jobs.js";
import Post from "../models/post.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import { optimizeUrl } from "../cloud/upload.js";
import { slugify } from "../helpers/slug.js";
import { validateReplyContent } from "../helpers/validation.js";
import { error } from "../log/logger.js";
import { formatLogMessage } from "../helpers/formatLogMessage.js";

const fetchPostsWithMeta = async (
    req: Request,
    where: Record<string, unknown> | undefined,
    offset: number
) => {
    const postsRaw = await Post.findAll({
        where,
        include: [
            { model: User, attributes: ["id", "username", "profileImage"] },
            { model: PostCategory, attributes: ["name"] }
        ],
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset
    });

    const postIds = postsRaw.map(p => p.id);

    const repliesByPost: Record<number, unknown[]> = {};
    const replyCounts: Record<number, number> = {};

    if (postIds.length > 0) {
        const allReplies = await PostReply.findAll({
            where: { postId: postIds },
            include: [{ model: User, attributes: ["id", "username", "profileImage"] }],
            order: [["createdAt", "ASC"]]
        });

        for (const reply of allReplies) {
            const plain: any = reply.get({ plain: true });
            if (plain.User) {
                plain.User.avatarUrl = optimizeUrl(plain.User.profileImage, 28, 28);
            }
            const pid = plain.postId;
            if (!repliesByPost[pid]) {
                repliesByPost[pid] = [];
                replyCounts[pid] = 0;
            }
            replyCounts[pid]++;
            if (repliesByPost[pid].length < 3) {
                repliesByPost[pid].push(plain);
            }
        }
    }

    let userLikedMap: Record<number, boolean> = {};
    if (req.session.userId) {
        const likes = await PostLike.findAll({ where: { userId: req.session.userId } });
        likes.forEach(l => { userLikedMap[l.postId] = true; });
    }

    const posts = postsRaw.map(p => {
        const plain: any = p.get({ plain: true });
        if (plain.User) {
            plain.User.avatarUrl = optimizeUrl(plain.User.profileImage, 24, 24);
        }
        plain.category = plain.PostCategory?.name || "";
        plain.slug = slugify(plain.title);
        plain.replies = repliesByPost[plain.id] || [];
        plain.replyCount = replyCounts[plain.id] || 0;
        plain.userLiked = !!userLikedMap[plain.id];
        return plain;
    });

    const total = await Post.count({ where });

    return { posts, total };
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    const rawOffset = Number(req.query.offset) || 0;
    const offset: number = Math.min(10000, Math.max(0, rawOffset));
    const kategoriSlug = typeof req.query.category === "string" ? req.query.category.trim() : null;

    const where: Record<string, unknown> = {};

    if (kategoriSlug) {
        const category = await PostCategory.findOne({ where: { slug: kategoriSlug } });
        if (!category) {
            res.status(200).json({ posts: [], hasMore: false, isAdmin: false });
            return;
        }
        where.categoryId = category.id;
    }

    try {
        const { posts, total } = await fetchPostsWithMeta(req, Object.keys(where).length ? where : undefined, offset);

        let isAdmin = false;
        if (req.session.userId) {
            const user = await User.findByPk(req.session.userId, { attributes: ["role"] });
            isAdmin = user?.role === "admin";
        }

        res.status(200).json({ posts, hasMore: offset + 10 < total, isAdmin });
    } catch (err) {
        console.log("Error Code:", 4006);
        error(`Post listesi alınırken hata: ${formatLogMessage(err)}`);
        res.status(500).json({ error: "Bir hata oluştu" });
    }
};

export const searchPosts = async (req: Request, res: Response): Promise<void> => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!q || q.length > 100) {
        res.status(400).json({ error: "Geçersiz arama terimi." });
        return;
    }

    try {
        const escaped = q.replace(/[\\%_]/g, "\\$&");
        const where = {
            [Op.or]: [
                { title: { [Op.like]: `%${escaped}%` } },
                { content: { [Op.like]: `%${escaped}%` } }
            ]
        };

        const { posts, total } = await fetchPostsWithMeta(req, where, 0);

        res.status(200).json({ posts, total, query: q });
    } catch (err) {
        console.log("Error Code:", 4007);
        error(`Forum arama hatası: ${formatLogMessage(err)}`);
        res.status(500).json({ error: "Bir hata oluştu" });
    }
};

export const toggleSave = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.status(401).json({ saved: false, error: "Giriş yapmalısınız" });
        return;
    }

    const jobId: number = Number(req.params.jobId);
    const userId: number = req.session.userId;

    if (!jobId || isNaN(jobId)) {
        res.status(400).json({ saved: false, error: "Geçersiz ilan ID" });
        return;
    }

    const jobExists = await Job.findByPk(jobId, { attributes: ["id"] });
    if (!jobExists) {
        res.status(404).json({ saved: false, error: "İlan bulunamadı" });
        return;
    }

    try {
        const existing = await SavedJob.findOne({ where: { userId, jobId } });

        if (existing) {
            await existing.destroy();
            res.status(200).json({ saved: false });
        } else {
            await SavedJob.create({ userId, jobId });
            res.status(201).json({ saved: true });
        }
    } catch (err) {
        console.log("Error Code:", 5007);
        error(`İlan kaydetme/kaldırma hatası (kullanıcı ID: ${req.session.userId}, ilan ID: ${req.params.jobId}): ${formatLogMessage(err)}`);
        res.status(500).json({ saved: false, error: "Bir hata oluştu" });
    }
};

export const toggleLike = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.status(401).json({ liked: false, error: "Giriş yapmalısınız" });
        return;
    }

    const postId: number = Number(req.params.postId);
    const userId: number = req.session.userId;

    if (!postId || isNaN(postId)) {
        res.status(400).json({ liked: false, error: "Geçersiz post ID" });
        return;
    }

    const postExists = await Post.findByPk(postId, { attributes: ["id"] });
    if (!postExists) {
        res.status(404).json({ liked: false, error: "Gönderi bulunamadı" });
        return;
    }

    try {
        const existing = await PostLike.findOne({ where: { userId, postId } });

        if (existing) {
            await existing.destroy();
            await Post.decrement("likes", { where: { id: postId } });
            const post = await Post.findByPk(postId, { attributes: ["likes"] });
            res.status(200).json({ liked: false, likes: post ? post.likes : 0 });
        } else {
            await PostLike.create({ userId, postId });
            await Post.increment("likes", { where: { id: postId } });
            const post = await Post.findByPk(postId, { attributes: ["likes"] });
            res.status(201).json({ liked: true, likes: post ? post.likes : 0 });
        }
    } catch (err) {
        console.log("Error Code:", 4005);
        error(`Beğeni değiştirme hatası (kullanıcı ID: ${req.session.userId}, post ID: ${req.params.postId}): ${formatLogMessage(err)}`);
        res.status(500).json({ liked: false, error: "Bir hata oluştu" });
    }
};

export const addReply = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.userId) {
        res.status(401).json({ error: "Giriş yapmalısınız" });
        return;
    }

    const postId: number = Number(req.params.postId);
    const { content } = req.body;

    if (!postId || isNaN(postId)) {
        res.status(400).json({ error: "Geçersiz post ID" });
        return;
    }

    if (!content || !validateReplyContent(content)) {
        res.status(400).json({ error: "Yanıt 1-10.000 karakter arasında olmalıdır." });
        return;
    }

    const postExistsForReply = await Post.findByPk(postId, { attributes: ["id"] });
    if (!postExistsForReply) {
        res.status(404).json({ error: "Gönderi bulunamadı" });
        return;
    }

    try {
        const reply = await PostReply.create({
            postId,
            userId: req.session.userId,
            content: content.trim()
        });

        const replyWithUser = await PostReply.findByPk(reply.id, {
            include: [{ model: User, attributes: ["id", "username", "profileImage"] }]
        });

        const ru: any = replyWithUser;
        if (ru && ru.User) {
            ru.User.avatarUrl = optimizeUrl(ru.User.profileImage, 28, 28);
        }

        res.status(201).json({ reply: ru });
    } catch (err) {
        console.log("Error Code:", 4003);
        error(`Yanıt ekleme hatası (kullanıcı ID: ${req.session.userId}, post ID: ${req.params.postId}): ${formatLogMessage(err)}`);
        res.status(500).json({ error: "Bir hata oluştu" });
    }
};

export const getReplies = async (req: Request, res: Response): Promise<void> => {
    const postId: number = Number(req.params.postId);
    const rawOffset = Number(req.query.offset) || 0;
    const offset: number = Math.min(10000, Math.max(0, rawOffset));

    if (!postId || isNaN(postId)) {
        res.status(400).json({ error: "Geçersiz post ID" });
        return;
    }

    try {
        const replies = await PostReply.findAll({
            where: { postId },
            include: [{ model: User, attributes: ["id", "username", "profileImage"] }],
            order: [["createdAt", "ASC"]],
            limit: 10,
            offset
        });

        const plainReplies = replies.map(r => {
            const plain: any = r.get({ plain: true });
            if (plain.User) {
                plain.User.avatarUrl = optimizeUrl(plain.User.profileImage, 28, 28);
            }
            return plain;
        });

        const total = await PostReply.count({ where: { postId } });

        res.status(200).json({ replies: plainReplies, total, hasMore: offset + 10 < total });
    } catch (err) {
        console.log("Error Code:", 4008);
        error(`Yanıt listesi alınırken hata (post ID: ${req.params.postId}): ${formatLogMessage(err)}`);
        res.status(500).json({ error: "Bir hata oluştu" });
    }
};
