import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { validateToken, csrfMiddleware } from "../../src/middleware/csrf.js";

function createToken(secret: string): string {
    const salt = crypto.randomBytes(8).toString("hex");
    const hash = crypto.createHmac("sha256", secret).update(salt).digest("hex");
    return salt + "-" + hash;
}

describe("validateToken", () => {
    const secret = "my-secret-key";

    it("geçerli token için true döner", () => {
        const token = createToken(secret);
        expect(validateToken(token, secret)).toBe(true);
    });

    it("yanlış secret ile false döner", () => {
        const token = createToken(secret);
        expect(validateToken(token, "wrong-secret")).toBe(false);
    });

    it("geçersiz format için false döner", () => {
        expect(validateToken("", secret)).toBe(false);
        expect(validateToken("invalid", secret)).toBe(false);
        expect(validateToken("too-many-dashes-here", secret)).toBe(false);
    });

    it("token string değilse false döner", () => {
        expect(validateToken(undefined as any, secret)).toBe(false);
        expect(validateToken(null as any, secret)).toBe(false);
    });
});

describe("csrfMiddleware", () => {
    function mockReq(overrides: Record<string, any> = {}) {
        return {
            session: { csrfSecret: undefined },
            method: "GET",
            path: "/",
            body: {},
            headers: {},
            ...overrides
        } as any;
    }

    function mockRes() {
        const state: { status?: number; body?: string; locals: Record<string, any> } = { locals: {} };
        return {
            status: (code: number) => {
                state.status = code;
                return { send: (msg: string) => { state.body = msg; } };
            },
            send: (msg: string) => { state.body = msg; },
            ...state
        } as any;
    }

    it("GET isteğinde csrfToken oluşturup next() çağırır", () => {
        const req = mockReq();
        const res = mockRes();
        let called = false;
        const next = () => { called = true; };

        csrfMiddleware(req, res, next);

        expect(req.session.csrfSecret).toBeDefined();
        expect(res.locals.csrfToken).toBeDefined();
        expect(called).toBe(true);
    });

    it("POST isteğinde token yoksa 403 döner", () => {
        const req = mockReq({ method: "POST", session: { csrfSecret: crypto.randomBytes(32).toString("hex") } });
        let statusCode = 0;
        let body = "";
        const res = {
            locals: {},
            status: (code: number) => {
                statusCode = code;
                return { send: (msg: string) => { body = msg; } };
            }
        } as any;

        csrfMiddleware(req, res, () => {});

        expect(statusCode).toBe(403);
        expect(body).toBe("CSRF token mismatch");
    });

    it("POST isteğinde geçerli token ile next() çağırır", () => {
        const secret = crypto.randomBytes(32).toString("hex");
        const validToken = createToken(secret);
        const req = mockReq({
            method: "POST",
            session: { csrfSecret: secret },
            body: { _csrf: validToken }
        });
        const res = mockRes();
        let called = false;

        csrfMiddleware(req, res, () => { called = true; });

        expect(called).toBe(true);
    });

    it("CSRF token header'dan da okunur", () => {
        const secret = crypto.randomBytes(32).toString("hex");
        const validToken = createToken(secret);
        const req = mockReq({
            method: "POST",
            session: { csrfSecret: secret },
            body: {},
            headers: { "csrf-token": validToken }
        });
        const res = mockRes();
        let called = false;

        csrfMiddleware(req, res, () => { called = true; });

        expect(called).toBe(true);
    });

    it("/profilim/resim-yukle path'i CSRF'den muaf tutulur", () => {
        const req = mockReq({
            method: "POST",
            path: "/profilim/resim-yukle",
            session: { csrfSecret: undefined }
        });
        const res = mockRes();
        let called = false;

        csrfMiddleware(req, res, () => { called = true; });

        expect(called).toBe(true);
        expect(res.locals.csrfToken).toBeDefined();
    });

    it("query param _csrf kabul edilmez (sadece body ve header)", () => {
        const secret = crypto.randomBytes(32).toString("hex");
        const validToken = createToken(secret);
        const req = mockReq({
            method: "POST",
            session: { csrfSecret: secret },
            body: {},
            headers: {},
            query: { _csrf: validToken },
        } as any);
        let statusCode = 0;
        const res = {
            locals: {},
            status: (code: number) => {
                statusCode = code;
                return { send: () => {} };
            }
        } as any;
        csrfMiddleware(req, res, () => {});
        expect(statusCode).toBe(403);
    });

    it("SAFE_METHODS (HEAD, OPTIONS) de csrfToken üretir", () => {
        for (const method of ["HEAD", "OPTIONS"]) {
            const req = mockReq({ method, session: { csrfSecret: undefined } });
            const res = mockRes();
            let called = false;
            csrfMiddleware(req, res, () => { called = true; });
            expect(called).toBe(true);
            expect(res.locals.csrfToken).toBeDefined();
        }
    });

    it("farklı secret üretilen token birbiriyle çapraz doğrulanmaz", () => {
        const s1 = crypto.randomBytes(32).toString("hex");
        const s2 = crypto.randomBytes(32).toString("hex");
        const t1 = createToken(s1);
        expect(validateToken(t1, s2)).toBe(false);
        expect(validateToken(t1, s1)).toBe(true);
    });
});
