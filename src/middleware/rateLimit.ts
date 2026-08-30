import rateLimit from "express-rate-limit";

const isVitest = !!process.env.VITEST;
const noop = (_req: any, _res: any, next: any) => next();

export const authLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Çok fazla deneme yaptınız, lütfen 1 dakika bekleyin."
});

export const forumLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin."
});

export const apiLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin."
});

export const adminLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin."
});

export const forgotPasswordLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 2,
    message: "Çok fazla şifre sıfırlama talebinde bulundunuz, lütfen 5 dakika bekleyin."
});

export const generalLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin."
});

export const profileUploadLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Çok fazla profil resmi yükleme denemesi. Lütfen 15 dakika bekleyin."
});
