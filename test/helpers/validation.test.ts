import { describe, it, expect } from "vitest";
import {
    validateEmail,
    validateUsername,
    validatePassword,
    validateRequired,
    validatePhone,
    validateSalary,
    validateReplyContent,
    validatePostTitle,
    validatePostContent,
    validateForumForm,
    validateJobForm,
} from "../../src/helpers/validation.js";

describe("validateEmail", () => {
    it("geçerli email kabul eder", () => {
        expect(validateEmail("test@test.com")).toBe(true);
        expect(validateEmail("kullanici@bingol.edu.tr")).toBe(true);
        expect(validateEmail("a@b.cd")).toBe(true);
    });

    it("geçersiz email reddeder", () => {
        expect(validateEmail("")).toBe(false);
        expect(validateEmail("test")).toBe(false);
        expect(validateEmail("@test.com")).toBe(false);
        expect(validateEmail("test@")).toBe(false);
        expect(validateEmail("test@.com")).toBe(false);
    });
});

describe("validateUsername", () => {
    it("geçerli kullanıcı adını kabul eder", () => {
        expect(validateUsername("enes")).toBe(true);
        expect(validateUsername("abc123")).toBe(true);
        expect(validateUsername("test_user")).toBe(true);
        expect(validateUsername("test-user")).toBe(true);
    });

    it("geçersiz kullanıcı adını reddeder", () => {
        expect(validateUsername("")).toBe(false);
        expect(validateUsername("a")).toBe(false);
        expect(validateUsername("a".repeat(51))).toBe(false);
        expect(validateUsername("user name")).toBe(false);
        expect(validateUsername("user@name")).toBe(false);
    });
});

describe("validatePassword", () => {
    it("geçerli şifreyi kabul eder", () => {
        expect(validatePassword("12345678")).toBe(true);
        expect(validatePassword("a".repeat(100))).toBe(true);
        expect(validatePassword("Şifre123!")).toBe(true);
    });

    it("geçersiz şifreyi reddeder", () => {
        expect(validatePassword("")).toBe(false);
        expect(validatePassword("1234567")).toBe(false);
        expect(validatePassword("a".repeat(101))).toBe(false);
    });
});

describe("validateRequired", () => {
    it("dolu string kabul eder", () => {
        expect(validateRequired("test")).toBe(true);
        expect(validateRequired("a")).toBe(true);
    });

    it("boş/geçersiz değerleri reddeder", () => {
        expect(validateRequired("")).toBe(false);
        expect(validateRequired("   ")).toBe(false);
        expect(validateRequired("   ")).toBe(false);
    });
});

describe("validatePhone", () => {
    it("boş telefonu kabul eder (opsiyonel)", () => {
        expect(validatePhone("")).toBe(true);
    });

    it("geçerli telefon numarasını kabul eder", () => {
        expect(validatePhone("05551234567")).toBe(true);
        expect(validatePhone("+90 555 123 45 67")).toBe(true);
        expect(validatePhone("(0212) 555 1234")).toBe(true);
    });

    it("geçersiz telefon numarasını reddeder", () => {
        expect(validatePhone("abc")).toBe(false);
    });
});

describe("validateSalary", () => {
    it("boş maaşı kabul eder (opsiyonel)", () => {
        expect(validateSalary("")).toBe(true);
    });

    it("geçerli maaş bilgisini kabul eder", () => {
        expect(validateSalary("25000")).toBe(true);
        expect(validateSalary("25000")).toBe(true);
        expect(validateSalary("30000 - 35000")).toBe(true);
    });
});

describe("validateReplyContent", () => {
    it("geçerli yanıtı kabul eder", () => {
        expect(validateReplyContent("a")).toBe(true);
        expect(validateReplyContent("a".repeat(10000))).toBe(true);
    });

    it("geçersiz yanıtı reddeder", () => {
        expect(validateReplyContent("")).toBe(false);
        expect(validateReplyContent("   ")).toBe(false);
        expect(validateReplyContent("")).toBe(false);
    });

    it("string olmayan değeri reddeder", () => {
        expect(validateReplyContent(123 as any)).toBe(false);
    });
});

describe("validatePostTitle", () => {
    it("geçerli başlığı kabul eder", () => {
        expect(validatePostTitle("a".repeat(5))).toBe(true);
        expect(validatePostTitle("a".repeat(120))).toBe(true);
    });

    it("geçersiz başlığı reddeder", () => {
        expect(validatePostTitle("a".repeat(4))).toBe(false);
        expect(validatePostTitle("a".repeat(121))).toBe(false);
        expect(validatePostTitle("")).toBe(false);
    });
});

describe("validatePostContent", () => {
    it("geçerli içeriği kabul eder", () => {
        expect(validatePostContent("a".repeat(20))).toBe(true);
        expect(validatePostContent("a".repeat(10000))).toBe(true);
    });

    it("geçersiz içeriği reddeder", () => {
        expect(validatePostContent("a".repeat(19))).toBe(false);
        expect(validatePostContent("a".repeat(10001))).toBe(false);
        expect(validatePostContent("")).toBe(false);
    });
});

describe("validateForumForm", () => {
    it("geçerli formda hata döndürmez", () => {
        const errors = validateForumForm({ title: "a".repeat(10), content: "a".repeat(50) });
        expect(errors).toEqual({});
    });

    it("başlık kısa gelince hata döndürür", () => {
        const errors = validateForumForm({ title: "a", content: "a".repeat(50) });
        expect(errors.title).toBeDefined();
    });

    it("içerik kısa gelince hata döndürür", () => {
        const errors = validateForumForm({ title: "a".repeat(10), content: "a" });
        expect(errors.content).toBeDefined();
    });
});

describe("validateJobForm", () => {
    it("geçerli formda hata döndürmez", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50)
        });
        expect(errors).toEqual({});
    });

    it("zorunlu alanlar boş gelince hata döndürür", () => {
        const errors = validateJobForm({ title: "", company: "", location: "", description: "" });
        expect(errors.title).toBeDefined();
        expect(errors.company).toBeDefined();
        expect(errors.location).toBeDefined();
        expect(errors.description).toBeDefined();
    });

    it("geçersiz telefon formatında hata döndürür", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50),
            phone: "abcXYZ!"
        });
        expect(errors.phone).toBeDefined();
    });

    it("geçerli telefon formatını kabul eder", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50),
            phone: "+90 555 123 45 67"
        });
        expect(errors.phone).toBeUndefined();
    });

    it("geçersiz maaş formatında hata döndürür", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50),
            salary: "<script>alert(1)</script>"
        });
        expect(errors.salary).toBeDefined();
    });

    it("geçerli maaş formatını kabul eder", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50),
            salary: "25000 - 35000 ₺"
        });
        expect(errors.salary).toBeUndefined();
    });

    it("tüm opsiyonel alanlar boş gelince hata döndürmez", () => {
        const errors = validateJobForm({
            title: "Yazılım Geliştirici",
            company: "Firma A",
            location: "Bingöl",
            description: "a".repeat(50),
            phone: "",
            salary: ""
        });
        expect(errors.phone).toBeUndefined();
        expect(errors.salary).toBeUndefined();
    });

    it("type ve diğer ekstra alanlar yoksayılır", () => {
        const errors = validateJobForm({
            title: "Yazılım",
            company: "Firma",
            location: "Bingöl",
            description: "a".repeat(50),
            type: "Tam Zamanlı"
        } as any);
        expect(errors).toEqual({});
    });
});
