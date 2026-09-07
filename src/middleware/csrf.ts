import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function generateTokenFromSecret(secret: string): string {
    const salt = crypto.randomBytes(8).toString("hex");
    const hash = crypto
        .createHmac("sha256", secret)
        .update(salt)
        .digest("hex");
    return salt + "-" + hash;
}

export function validateToken(token: string, secret: string): boolean {
    if (typeof token !== "string") return false;
    const parts = token.split("-");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    if (!salt || !hash) return false;
    // salt 8 byte = 16 hex chars, hash 32 byte = 64 hex chars
    if (salt.length !== 16 || hash.length !== 64) return false;
    const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(salt)
        .digest("hex");
    if (hash.length !== expectedHash.length) return false;
    const a = Buffer.from(hash, "utf8");
    const b = Buffer.from(expectedHash, "utf8");
    return crypto.timingSafeEqual(a, b);
}

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.csrfSecret) {
        req.session.csrfSecret = crypto.randomBytes(32).toString("hex");
    }

    if (SAFE_METHODS.includes(req.method)) {
        res.locals.csrfToken = generateTokenFromSecret(req.session.csrfSecret!);
        next();
        return;
    }

    // File upload: multer öncesi RAM tüketimini engellemek için
    // CSRF header'ı burada kontrol edilir. Header yoksa ve istek
    // multipart değilse (urlencoded/json) body'deki _csrf de kontrol edilir.
    // Multipart + header yoksa 403 ile reddedilir, böylece 5MB'lık dosya
    // memory'e alınmadan engellenir.
    if (req.path === "/profilim/resim-yukle") {
        const headerToken = req.headers["csrf-token"] as string | undefined;
        if (headerToken && validateToken(headerToken, req.session.csrfSecret!)) {
            res.locals.csrfToken = generateTokenFromSecret(req.session.csrfSecret!);
            next();
            return;
        }
        const ct = (req.headers["content-type"] || "") as string;
        const isMultipart = ct.includes("multipart/form-data");
        if (!isMultipart) {
            const bodyToken = (req.body as any)?._csrf as string | undefined;
            if (bodyToken && validateToken(bodyToken, req.session.csrfSecret!)) {
                res.locals.csrfToken = generateTokenFromSecret(req.session.csrfSecret!);
                next();
                return;
            }
        }
        res.status(403).send("CSRF token mismatch");
        return;
    }

    const token = req.body?._csrf || req.headers["csrf-token"];

    if (!token || !validateToken(token, req.session.csrfSecret!)) {
        res.status(403).send("CSRF token mismatch");
        return;
    }

    next();
};
