import { describe, it, expect } from "vitest";
import { normalizeError } from "../../src/helpers/normalizeError.js";
// Also test alias exports
import { formatLogMessage, formatErrorMessage } from "../../src/helpers/formatLogMessage.js";

describe("normalizeError", () => {
    it("Error nesnesini normalize eder (name, message, stack korur)", () => {
        const err = new Error("Failed to upload image");
        // Stack'i kararlı kılmak için manuel set
        err.stack = "Error: Failed to upload image\n    at test (file.ts:10:5)";
        const out = normalizeError(err);
        expect(out).toContain("Error: Failed to upload image");
        expect(out).toContain("at test");
        expect(out).not.toContain("[object Object]");
    });

    it("Error subclass'ını korur (TypeError, ValidationError vb.)", () => {
        class CustomError extends Error {
            code = "CUSTOM_001";
            status = 500;
            constructor(msg: string) {
                super(msg);
                this.name = "CustomError";
            }
        }
        const err = new CustomError("custom fail");
        (err as any).code = "CUSTOM_001";
        (err as any).status = 500;
        const out = normalizeError(err);
        expect(out).toContain("CustomError");
        expect(out).toContain("custom fail");
        expect(out).toContain("CUSTOM_001");
        expect(out).toContain("500");
    });

    it("string hatayı olduğu gibi döndürür", () => {
        const out = normalizeError("plain string error");
        expect(out).toBe("plain string error");
        expect(out).not.toContain("[object Object]");
    });

    it("number / boolean değerleri string'e çevirir", () => {
        expect(normalizeError(42)).toBe("42");
        expect(normalizeError(true)).toBe("true");
        expect(normalizeError(false)).toBe("false");
        expect(normalizeError(0)).toBe("0");
    });

    it("null ve undefined için 'null' / 'undefined' döndürür", () => {
        expect(normalizeError(null)).toBe("null");
        expect(normalizeError(undefined)).toBe("undefined");
    });

    it("plain object'i JSON olarak serialize eder, [object Object] döndürmez", () => {
        const obj = { foo: "bar", count: 123 };
        const out = normalizeError(obj);
        expect(out).not.toBe("[object Object]");
        expect(out).toContain('"foo"');
        expect(out).toContain('"bar"');
        expect(out).toContain('"count"');
        // Pretty JSON (indent)
        expect(out).toContain("\n");
    });

    it("nested object'leri doğru serialize eder", () => {
        const nested = {
            user: { id: 1, profile: { email: "a@b.com", meta: { active: true } } },
            tags: ["a", "b"],
        };
        const out = normalizeError(nested);
        expect(out).toContain('"user"');
        expect(out).toContain('"profile"');
        expect(out).toContain('"email"');
        expect(out).toContain('"tags"');
        expect(out).not.toContain("[object Object]");
    });

    it("array'i doğru serialize eder", () => {
        const arr = [1, "two", { three: 3 }];
        const out = normalizeError(arr);
        expect(out).toContain("1");
        expect(out).toContain("two");
        expect(out).toContain("three");
        expect(JSON.parse(out)).toEqual(arr);
    });

    it("Sequelize / database hatası benzeri error'ları detaylarıyla korur", () => {
        const sequelizeErr: any = new Error("Validation error");
        sequelizeErr.name = "SequelizeValidationError";
        sequelizeErr.errors = [
            { message: "email must be unique", type: "unique violation", path: "email", value: "test@test.com" },
        ];
        sequelizeErr.original = { message: "duplicate key", code: "23505" };
        sequelizeErr.sql = "INSERT INTO users ...";
        sequelizeErr.parameters = ["secret"];
        const out = normalizeError(sequelizeErr);
        expect(out).toContain("SequelizeValidationError");
        expect(out).toContain("Validation error");
        expect(out).toContain("email must be unique");
        // SQL ve parameters redact edilmeli
        expect(out).toContain("[REDACTED SQL]");
        expect(out).toContain("[REDACTED]");
        expect(out).not.toContain("INSERT INTO users");
    });

    it("circular reference içeren objede çökmez ve [Circular] içerir", () => {
        const circular: any = { name: "test" };
        circular.self = circular;
        const out = normalizeError(circular);
        expect(out).toContain("[Circular]");
        expect(out).not.toContain("[object Object]");
        // Should not throw
        expect(() => normalizeError(circular)).not.toThrow();
    });

    it("circular reference içeren Error'da çökmez", () => {
        const err: any = new Error("circular error");
        err.cause = err; // self circular via cause
        const out = normalizeError(err);
        expect(out).toContain("circular error");
        expect(out).toContain("[Circular]");
        expect(() => normalizeError(err)).not.toThrow();
    });

    it("stack trace'i korur", () => {
        const err = new Error("stack test");
        err.stack = "Error: stack test\n    at Object.test (file.js:10:5)\n    at next (file2.js:20:10)";
        const out = normalizeError(err);
        expect(out).toContain("Error: stack test");
        expect(out).toContain("at Object.test");
        expect(out).toContain("at next");
    });

    it("code / status / statusCode / errno gibi alanları korur", () => {
        const err: any = new Error("with codes");
        err.code = "ERR_TEST";
        err.status = 422;
        err.statusCode = 422;
        err.errno = -4048;
        const out = normalizeError(err);
        expect(out).toContain("ERR_TEST");
        expect(out).toContain("422");
        // errno may appear as [errno: -4048] in header or Details
        expect(out).toMatch(/-4048/);
    });

    it("hassas bilgileri redact eder (password, secret, token, cookie vb.)", () => {
        const obj = {
            username: "testuser",
            password: "supersecret123",
            secret: "mysecret",
            token: "abc123token",
            csrf: "csrfvalue",
            session: { id: "sess123" },
            cookie: "cookievalue",
            authorization: "Bearer xyz",
            normal: "visible",
        };
        const out = normalizeError(obj);
        expect(out).toContain("[REDACTED]");
        expect(out).not.toContain("supersecret123");
        expect(out).not.toContain("mysecret");
        expect(out).not.toContain("abc123token");
        expect(out).not.toContain("cookievalue");
        expect(out).toContain("testuser");
        expect(out).toContain("visible");
        // Also nested sensitive
        const nested = { data: { password: "hidden", inner: { api_key: "key123" } } };
        const out2 = normalizeError(nested);
        expect(out2).toContain("[REDACTED]");
        expect(out2).not.toContain("hidden");
        expect(out2).not.toContain("key123");
    });

    it("Error içinde hassas veri olan extra field'ları da redact eder", () => {
        const err: any = new Error("fail");
        err.details = { password: "shouldHide", token: "hideMe" };
        const out = normalizeError(err);
        expect(out).toContain("[REDACTED]");
        expect(out).not.toContain("shouldHide");
        expect(out).not.toContain("hideMe");
    });

    it("plain object olarak gelen error-like objeyi (name/message) doğru formatlar", () => {
        const obj = { name: "CustomError", message: "something went wrong", code: "500", stack: "CustomError: something\n at line" };
        const out = normalizeError(obj);
        expect(out).toContain("CustomError: something went wrong");
        expect(out).toContain("code");
        expect(out).toContain("500");
    });

    it("Buffer'ı [Buffer] olarak işaretler", () => {
        const buf = Buffer.from("hello");
        const out = normalizeError({ data: buf });
        expect(out).toContain("[Buffer]");
    });

    it("JSON string olarak gelen hatayı pretty print eder", () => {
        const jsonStr = JSON.stringify({ error: "fail", code: 123 });
        const out = normalizeError(jsonStr);
        expect(out).toContain('"error"');
        expect(out).toContain('"fail"');
        expect(out).toContain("\n");
    });

    it("asla [object Object] döndürmez (tüm tipler için)", () => {
        const cases: unknown[] = [
            {},
            { a: 1 },
            { nested: { deep: { value: "x" } } },
            [],
            [{}],
            new Error("test"),
            { message: "hi" },
            Object.create(null),
        ];
        for (const c of cases) {
            const out = normalizeError(c);
            expect(out).not.toBe("[object Object]");
            expect(out).not.toContain("[object Object]");
        }
    });

    it("formatLogMessage ve formatErrorMessage alias'ları normalizeError ile aynı davranır", () => {
        const err = new Error("alias test");
        expect(formatLogMessage(err)).toBe(normalizeError(err));
        expect(formatErrorMessage(err)).toBe(normalizeError(err));
        const obj = { foo: "bar" };
        expect(formatLogMessage(obj)).toBe(normalizeError(obj));
    });

    it("function tipini [Function: name] olarak döndürür", () => {
        function myFunc() {}
        const out = normalizeError(myFunc);
        expect(out).toContain("myFunc");
        expect(out).toContain("Function");
    });

    it("symbol tipini string'e çevirir", () => {
        const sym = Symbol("testSym");
        const out = normalizeError(sym);
        expect(out).toContain("testSym");
    });

    it("çok derin nested + array + object karışımında çökmez", () => {
        const deep: any = { level1: { level2: { level3: { arr: [1, 2, { x: 1 }] } } } };
        expect(() => normalizeError(deep)).not.toThrow();
        const out = normalizeError(deep);
        expect(out).toContain("level1");
        expect(out).toContain("level3");
    });
});
