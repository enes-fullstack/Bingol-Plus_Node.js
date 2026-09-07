import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const isVitest = !!process.env.VITEST;
const noop = (_req: any, _res: any, next: any) => next();

// Production altyapı notu:
// - Tek instance (docker-compose: app:1) için MemoryStore yeterli ve en hızlısıdır.
// - Nginx (nginx.conf:15, nginx.prod.conf:68) X-Forwarded-For'u $proxy_add_x_forwarded_for ile set eder,
//   Express `trust proxy:1` (src/app.ts:4) ile doğru istemci IP'si `req.ip`'de tutulur.
//   `ipKeyGenerator` IPv6'yı normalize eder, X-Forwarded-For spoof'u `trust proxy 1` ile engellenir.
// - Çok instance / horizontal scale (k8s, pm2 cluster) gerekirse `rate-limit-redis` + RedisStore
//   eklenmeli; şu an redis servisi yok ve tek instance için yarım kurulum yapılmadı (TODO.md 27. madde).
// - `validate: {trustProxy:false}` ile express-rate-limit'in trustProxy uyarısı susturulur (bilinçli 1 proxy).

// userId + IP bazlı key: giriş yapmışsa userId:IP, değilse IP
const userIpKeyGenerator = (req: any): string => {
    const ip = ipKeyGenerator(req.ip as string);
    const userId = req.session?.userId;
    return userId ? `${userId}:${ip}` : ip;
};

export const authLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Çok fazla deneme yaptınız, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const forumLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const apiLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const adminLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const forgotPasswordLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 2,
    message: "Çok fazla şifre sıfırlama talebinde bulundunuz, lütfen 5 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const generalLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Çok hızlı işlem yapıyorsunuz, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const profileUploadLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Çok fazla profil resmi yükleme denemesi. Lütfen 15 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const sitemapLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Çok fazla sitemap isteği, lütfen 1 dakika bekleyin.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req.ip as string),
    validate: { trustProxy: false } as any
});

export const ilanEkleLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Çok hızlı ilan talebi oluşturuyorsunuz, lütfen 1 dakika bekleyin.",
    keyGenerator: userIpKeyGenerator as any,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false } as any
});

export const basvuruLimiter = isVitest ? (noop as any) : rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Çok hızlı başvuru yapıyorsunuz, lütfen 1 dakika bekleyin.",
    keyGenerator: userIpKeyGenerator as any,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false } as any
});
