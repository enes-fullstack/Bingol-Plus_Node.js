import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.isAuth || !req.session.userId) {
        res.redirect("/giris-yap");
        return;
    }
    // Banlı kullanıcı veya silinmiş kullanıcı session ile devam edemez
    const user = await User.findByPk(req.session.userId, { attributes: ["banned"] });
    if (!user || user.banned) {
        req.session.destroy(() => {});
        res.redirect("/giris-yap");
        return;
    }
    next();
};

export const redirectIfAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (req.session.isAuth) {
        res.redirect("/");
        return;
    }
    next();
};
