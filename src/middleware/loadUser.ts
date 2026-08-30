import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";

const loadUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.session.isAuth && req.session.userId) {
        // Her istekte güncel role/banned kontrolü (stale admin/ban önler), tek sorgu
        const user = await User.findByPk(req.session.userId, { attributes: ["username", "role", "banned"] });
        if (!user || user.banned) {
            // Banlı veya silinmiş kullanıcı -> session geçersiz
            req.session.destroy(() => {});
            res.locals.userId = null;
            res.locals.username = null;
            res.locals.isAdmin = false;
        } else {
            // Session'ı DB ile senkron tut
            if (req.session.username !== user.username) req.session.username = user.username;
            if (req.session.role !== user.role) req.session.role = user.role;
            res.locals.userId = req.session.userId;
            res.locals.username = user.username;
            res.locals.isAdmin = user.role === "admin";
        }
    } else {
        res.locals.userId = null;
        res.locals.username = null;
        res.locals.isAdmin = false;
    }

    if (req.session.flash) {
        res.locals.flash = req.session.flash;
        delete req.session.flash;
    } else {
        res.locals.flash = null;
    }

    next();
};

export default loadUser;
