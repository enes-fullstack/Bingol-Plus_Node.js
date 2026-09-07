// IMPORT LIBRARY
import express from "express";
const app = express();
app.set("trust proxy", 1);
import dotenv from "dotenv";
dotenv.config();
import path from "path";

// IMPORT FILE
import user from "./routers/user.js";
import auth from "./routers/auth.js";
import api from "./routers/api.js";
import forum from "./routers/forum.js";
import admin from "./routers/admin.js";
import { csrfMiddleware } from "./middleware/csrf.js";
import loadUser from "./middleware/loadUser.js";
import { error } from "./log/logger.js";
import { normalizeError } from "./helpers/normalizeError.js";
import helmetConfig from "./security/helmet.js";
import sitemapRouter from "./routers/sitemap.js";
import { slugify } from "./helpers/slug.js";
import { sessionMiddleware } from "./config/session.js";

// SET
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));

app.use(express.static(path.join(process.cwd(), "src", "public")));

app.use(helmetConfig);

app.use(sessionMiddleware);

// CSRF
app.use(csrfMiddleware);

// ENSURE SESSION PERSISTS BEFORE REDIRECT (flash race condition fix)
app.use((req, res, next) => {
    const origRedirect = (res.redirect as any).bind(res);
    (res as any).redirect = function (...args: any[]): void {
        const hasFlash = !!(req.session && (req.session as any).flash);
        if (hasFlash) {
            (req.session as any).save((err: unknown) => {
                if (err) {
                    error(`Session kaydedilirken hata: ${normalizeError(err)}`);
                }
                origRedirect(...args);
            });
        } else {
            origRedirect(...args);
        }
    };
    next();
});

// LOAD SESSION USER TO LOCALS
app.use(loadUser);

// MAKE SLUGIFY AVAILABLE IN ALL VIEWS
app.use((req, res, next) => {
    res.locals.slugify = slugify;
    next();
});

// SEO: CANONICAL URL MIDDLEWARE
app.use((req, res, next) => {
    const rawBase = process.env.SITE_URL || "https://bingolplus.com";
    const baseUrl = rawBase.replace(/\/$/, "");
    // Pagination (?page=N) self-canonical: page=1 → base path, page>1 → ?page=N
    let canonical = baseUrl + req.path;
    const rawPage = (req.query as any)?.page;
    if (rawPage !== undefined) {
        const pageStr = Array.isArray(rawPage) ? rawPage[0] : String(rawPage);
        const p = Number(pageStr);
        if (!isNaN(p) && p > 1 && p <= 100) {
            canonical += `?page=${p}`;
        }
    }
    res.locals.canonical = canonical;
    // Default robots: private/auth/admin sayfaları için sonradan override edilecek
    // Public sayfalar indexlenebilir, 404 ve private noindex olacak
    const path = req.path;
    const isPrivate =
        path.startsWith("/admin") ||
        path.startsWith("/profilim") ||
        path === "/kayit-ol" ||
        path === "/giris-yap" ||
        path === "/sifremi-unuttum" ||
        path.startsWith("/sifre-sifirla") ||
        path === "/ilanlar/ilan-ekle" ||
        path === "/forum/konu-ac";
    if (isPrivate) {
        res.locals.robots = "noindex, nofollow";
    } else if (req.query.q !== undefined) {
        // Arama sonuçları ince içerik → noindex
        res.locals.robots = "noindex, follow";
    }
    next();
});

// ROUTERS
app.use(user);
app.use(auth);
app.use(api);
app.use(forum);
app.use(admin);
app.use(sitemapRouter);

// 404 — noindex
app.use((req, res) => {
    res.locals.robots = "noindex, nofollow";
    res.status(404).render("user/error");
});

export default app;
