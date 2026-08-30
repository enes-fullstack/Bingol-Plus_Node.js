import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session.userId;
    if (!userId) {
        res.status(404).render("user/error");
        return;
    }

    const user = await User.findByPk(userId, { attributes: ["role", "banned"] });
    if (!user || user.banned || user.role !== "admin") {
        // Banlı veya yetkisi alınmış kullanıcının session'ı temizlenir
        if (user?.banned) {
            req.session.destroy(() => {});
        } else if (user) {
            req.session.role = user.role;
        }
        res.status(404).render("user/error");
        return;
    }

    // Session rolünü DB ile senkron tut (stale admin önler)
    if (req.session.role !== user.role) req.session.role = user.role;
    next();
};
