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
import { formatLogMessage } from "./helpers/formatLogMessage.js";
import helmetConfig from "./security/helmet.js";
import sitemapRouter from "./routers/sitemap.js";
import { slugify } from "./helpers/slug.js";
import { sessionMiddleware } from "./config/session.js";

// SET
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "src", "public")));

app.use(helmetConfig);

app.use(sessionMiddleware);

// CSRF
app.use(csrfMiddleware);

// ENSURE SESSION PERSISTS BEFORE REDIRECT (flash race condition fix)
app.use((req, res, next) => {
    const origRedirect = res.redirect.bind(res) as (url: string) => void;
    res.redirect = function (url: any): void {
        if (req.session && req.session.flash) {
            req.session.save((err: unknown) => {
                if (err) {
                    error(`Session kaydedilirken hata: ${formatLogMessage(err)}`);
                }
                origRedirect(url);
            });
        } else {
            origRedirect(url);
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
    // req.path is without querystring, normalized by Express
    res.locals.canonical = baseUrl + req.path;
    next();
});

// ROUTERS
app.use(user);
app.use(auth);
app.use(api);
app.use(forum);
app.use(admin);
app.use(sitemapRouter);

// 404
app.use((req, res) => {
    res.status(404).render("user/error");
});

export default app;
