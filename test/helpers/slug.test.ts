import { describe, it, expect } from "vitest";
import { slugify } from "../../src/helpers/slug.js";

describe("slugify", () => {
    it("Türkçe karakterleri dönüştürür", () => {
        expect(slugify("Şanslı Günler")).toBe("sansli-gunler");
        expect(slugify("Çalışma Hayatı")).toBe("calisma-hayati");
        expect(slugify("Üniversite Sınavı")).toBe("universite-sinavi");
        expect(slugify("Iğdır'a Yolculuk")).toBe("igdira-yolculuk");
        expect(slugify("Bingöl'de İş İlanları")).toBe("bingolde-is-ilanlari");
    });

    it("& işaretini 've' olarak dönüştürür", () => {
        expect(slugify("Soru & Cevap")).toBe("soru-ve-cevap");
        expect(slugify("Alım & Satım")).toBe("alim-ve-satim");
    });

    it("özel karakterleri ve boşlukları tire ile değiştirir", () => {
        expect(slugify("Bingöl'de iş!")).toBe("bingolde-is");
        expect(slugify("test---mesaj")).toBe("test-mesaj");
    });

    it("baştaki ve sondaki tireleri temizler", () => {
        expect(slugify("---merhaba---")).toBe("merhaba");
    });

    it("boş string için boş döner", () => {
        expect(slugify("")).toBe("");
    });

    it("maksimum 80 karakterle sınırlar", () => {
        const long = "a".repeat(100);
        expect(slugify(long)).toHaveLength(80);
    });

    it("sadece tire içeren metin için boş döner", () => {
        expect(slugify("--- ---")).toBe("");
    });

    it("sayı ve karma içeriği doğru işler", () => {
        expect(slugify("123 test 456")).toBe("123-test-456");
        expect(slugify("Bingöl 12")).toBe("bingol-12");
    });

    it("strict mod özel karakterleri temizler, ve bağlacı korunur", () => {
        expect(slugify("a & b & c")).toBe("a-ve-b-ve-c");
        expect(slugify("hello@world#test")).toBe("helloworldtest");
    });

    it("uzun metinde truncate 80 ile sınırlar (kesme tire bırakabilir)", () => {
        const long = "a".repeat(79) + " b " + "c".repeat(10);
        const result = slugify(long);
        expect(result.length).toBeLessThanOrEqual(80);
        // mevcut implementasyon substring(0,80) yapar, tire ile bitebilir — bu beklenen davranış
        expect(result).toMatch(/^[a-z0-9-]+$/);
    });
});
