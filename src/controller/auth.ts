import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/user.js";
import PasswordReset from "../models/passwordReset.js";
import { destroyUserSessions, destroyStaleUserSessions } from "../config/session.js";
import { validateEmail, validateUsername, validatePassword } from "../helpers/validation.js";
import { sendResetEmail } from "../services/mail.js";
import { sequelize } from "../database/connection.js";
import { error } from "../log/logger.js";
import { normalizeError } from "../helpers/normalizeError.js";

interface LoginBody {
    username: string;
    password: string;
}

interface SignupBody {
    email: string;
    username: string;
    password: string;
}

export const login_get = (req: Request, res: Response): void => {
    res.status(200).render("auth/login");
};

export const login_post = async (req: Request, res: Response): Promise<void> => {
    const { username, password }: LoginBody = req.body;

    if (!validateUsername(username)) {
        req.session.flash = { type: "error", message: "Kullanıcı adı en az 2 karakter olmalıdır (harf, rakam, _, -).", oldInput: { username } };
        res.redirect("/giris-yap");
        return;
    }

    if (!validatePassword(password)) {
        req.session.flash = { type: "error", message: "Şifre en az 8 karakter olmalıdır.", oldInput: { username } };
        res.redirect("/giris-yap");
        return;
    }

    const user = await User.findOne({ where: { username } });
    if (!user || user.username !== username) {
        req.session.flash = { type: "error", message: "Kullanıcı adı veya şifre hatalı.", oldInput: { username } };
        res.redirect("/giris-yap");
        return;
    }

    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        req.session.flash = { type: "error", message: "Kullanıcı adı veya şifre hatalı.", oldInput: { username } };
        res.redirect("/giris-yap");
        return;
    }

    if (user.banned) {
        req.session.flash = { type: "error", message: "Bu hesap banlanmış. Daha fazla bilgi için lütfen bizimle iletişime geçin.", oldInput: { username } };
        res.redirect("/giris-yap");
        return;
    }

    try {
        await destroyStaleUserSessions(user.id);
    } catch (err) {
        console.log("Error Code:", 2006);
        error(`Eski sessionlar temizlenirken hata: ${normalizeError(err)}`);
    }

    req.session.regenerate((err) => {
        if (err) {
            console.log("Error Code:", 2004);
            error(`Session yenilenirken hata: ${normalizeError(err)}`);
            res.redirect("/");
            return;
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.isAuth = true;

        req.session.flash = { type: "success", message: "Giriş başarılı, hoş geldiniz!" };
        res.redirect("/");
    });
};

export const logout_get = (req: Request, res: Response): void => {
    req.session.destroy((err: unknown) => {
        if (err) {
            console.log("Error Code:", 2005);
            error(`Oturum sonlandırılırken hata: ${normalizeError(err)}`);
        }
        res.redirect("/");
    });
};

export const signup_get = (req: Request, res: Response): void => {
    res.status(200).render("auth/signup");
};

export const signup_post = async (req: Request, res: Response): Promise<void> => {
    const { email, username, password }: SignupBody = req.body;

    const errors: Record<string, string> = {};

    if (!validateEmail(email)) errors.email = "Geçerli bir e-posta adresi giriniz.";
    if (!validateUsername(username)) errors.username = "Kullanıcı adı 2-50 karakter olmalıdır (harf, rakam, _, -).";
    if (!validatePassword(password)) errors.password = "Şifre en az 8 karakter olmalıdır.";

    if (Object.keys(errors).length > 0) {
        req.session.flash = { type: "error", message: "Lütfen aşağıdaki hataları düzeltin.", errors, oldInput: { email, username } };
        res.redirect("/kayit-ol");
        return;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
        req.session.flash = { type: "error", message: "Bu e-posta adresi zaten kullanılıyor.", errors: { email: "Bu e-posta adresi zaten kayıtlı." }, oldInput: { email, username } };
        res.redirect("/kayit-ol");
        return;
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
        req.session.flash = { type: "error", message: "Bu kullanıcı adı zaten kullanılıyor.", errors: { username: "Bu kullanıcı adı zaten alınmış." }, oldInput: { email, username } };
        res.redirect("/kayit-ol");
        return;
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    try {
        await User.create({
            email,
            username,
            password: hashedPassword,
            ip: req.ip || req.socket?.remoteAddress || "0",
            userAgent: req.headers["user-agent"] || "Unknown"
        });

        req.session.regenerate((err) => {
            if (err) {
                console.log("Error Code:", 2004);
                error(`Session yenilenirken hata (kayıt): ${normalizeError(err)}`);
                req.session.flash = { type: "error", message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.", oldInput: { email, username } };
                res.redirect("/kayit-ol");
                return;
            }

            req.session.flash = { type: "success", message: "Kayıt başarılı! Şimdi giriş yapabilirsiniz." };
            res.redirect("/giris-yap");
        });
    } catch (err: unknown) {
        console.log("Error Code:", 3006);
        error(`Kayıt olurken hata (${email}): ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.", oldInput: { email, username } };
        res.redirect("/kayit-ol");
    }
};

export const forgot_password_get = (req: Request, res: Response): void => {
    res.status(200).render("auth/forgot-password");
};

export const forgot_password_post = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        req.session.flash = { type: "error", message: "Geçerli bir e-posta adresi giriniz.", oldInput: { email } };
        res.redirect("/sifremi-unuttum");
        return;
    }

    const user = await User.findOne({ where: { email } });

    if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        try {
            await sequelize.transaction(async (t) => {
                await PasswordReset.update(
                    { usedAt: new Date() },
                    { where: { userId: user.id, usedAt: null }, transaction: t }
                );
                await PasswordReset.create(
                    {
                        userId: user.id,
                        token: tokenHash,
                        expiresAt
                    },
                    { transaction: t }
                );
            });
        } catch (err) {
            console.log("Error Code:", 2007);
            error(`Şifre sıfırlama token oluşturulurken hata (${email}): ${normalizeError(err)}`);
        }

        try {
            await sendResetEmail(email, token);
        } catch (err) {
            console.log("Error Code:", 2007);
            error(`Şifre sıfırlama e-postası gönderilirken hata (${email}): ${normalizeError(err)}`);
        }
    }

    req.session.flash = { type: "success", message: "E-posta adresinize bir şifre sıfırlama bağlantısı gönderdik. Eğer bağlantıyı göremiyorsanız spam klasörünü kontrol etmeyi unutmayın." };
    res.redirect("/giris-yap");
};

export const reset_password_get = async (req: Request, res: Response): Promise<void> => {
    const rawToken = (req.params as any).token;
    const token: string = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        res.status(404).render("user/error");
        return;
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await PasswordReset.findOne({ where: { token: tokenHash, usedAt: null } });

    if (!record || record.expiresAt < new Date()) {
        res.status(404).render("user/error");
        return;
    }

    res.status(200).render("auth/reset-password", { token });
};

export const reset_password_post = async (req: Request, res: Response): Promise<void> => {
    const rawToken = (req.params as any).token;
    const token: string = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    const { password } = req.body;

    if (!token || !/^[a-f0-9]{64}$/.test(token) || !password) {
        res.redirect("/giris-yap");
        return;
    }

    if (!validatePassword(password)) {
        req.session.flash = { type: "error", message: "Şifre en az 8 karakter olmalıdır." };
        res.redirect(`/sifre-sifirla/${encodeURIComponent(token)}`);
        return;
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    let resetUserId: number | null = null;

    try {
        await sequelize.transaction(async (t) => {
            const record = await PasswordReset.findOne({
                where: { token: tokenHash, usedAt: null },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!record || record.expiresAt < new Date()) {
                throw new Error("invalid_token");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.update(
                { password: hashedPassword },
                { where: { id: record.userId }, transaction: t }
            );

            const [affected] = await PasswordReset.update(
                { usedAt: new Date() },
                { where: { id: record.id, usedAt: null }, transaction: t }
            );

            if (affected === 0) {
                throw new Error("already_used");
            }

            resetUserId = record.userId;
        });
    } catch (err) {
        if (err instanceof Error && (err.message === "invalid_token" || err.message === "already_used")) {
            req.session.flash = { type: "error", message: "Bu bağlantı geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama talep edin." };
            res.redirect("/giris-yap");
            return;
        }
        console.log("Error Code:", 2007);
        error(`Şifre sıfırlama sırasında hata: ${normalizeError(err)}`);
        req.session.flash = { type: "error", message: "Bir hata oluştu. Lütfen tekrar deneyin." };
        res.redirect("/giris-yap");
        return;
    }

    if (resetUserId !== null) {
        try {
            await destroyUserSessions(resetUserId);
        } catch {}
    }

    req.session.flash = { type: "success", message: "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz." };
    res.redirect("/giris-yap");
};
