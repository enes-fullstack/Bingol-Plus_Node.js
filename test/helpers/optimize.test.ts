import { describe, it, expect } from "vitest";
import { optimizeUrl } from "../../src/cloud/upload.js";

describe("optimizeUrl", () => {
    it("null veya undefined için null döner", () => {
        expect(optimizeUrl(null, 100, 100)).toBeNull();
        expect(optimizeUrl(undefined, 100, 100)).toBeNull();
        expect(optimizeUrl("", 100, 100)).toBeNull();
    });

    it("/upload/ içermeyen URL'yi olduğu gibi döndürür", () => {
        const url = "https://example.com/image.jpg";
        expect(optimizeUrl(url, 36, 36)).toBe(url);
    });

    it("/upload/ içeren Cloudinary URL'sini dönüştürür", () => {
        const url = "https://res.cloudinary.com/demo/image/upload/v123/sample.jpg";
        const optimized = optimizeUrl(url, 36, 36);
        expect(optimized).toBe("https://res.cloudinary.com/demo/image/upload/w_36,h_36,c_fill,f_auto,q_auto/v123/sample.jpg");
    });

    it("farklı boyutlarla doğru transform ekler", () => {
        const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        expect(optimizeUrl(url, 150, 150)).toContain("w_150,h_150,c_fill,f_auto,q_auto");
        expect(optimizeUrl(url, 24, 24)).toContain("w_24,h_24,c_fill,f_auto,q_auto");
        expect(optimizeUrl(url, 28, 28)).toContain("w_28,h_28,c_fill,f_auto,q_auto");
    });
});

describe("validateReplyContent edge", () => {
    // bu dosya genel helper ek testleri için de kullanılabilir
    it("optimizeUrl sadece ilk /upload/ yerine transform uygular", () => {
        const url = "https://res.cloudinary.com/diro3o1um/image/upload/v1/bingolplus/abc.jpg";
        const result = optimizeUrl(url, 36, 36);
        expect(result?.split("w_36").length).toBe(2); // bir kez eklenmiş
    });
});
