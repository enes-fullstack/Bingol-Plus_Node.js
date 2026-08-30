import { Router } from "express";
import Post from "../models/post.js";
import Job from "../models/jobs.js";
import { slugify } from "../helpers/slug.js";

const router = Router();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const posts = await Post.findAll({ attributes: ["id", "title", "updatedAt"] });
    const jobs = await Job.findAll({ attributes: ["id", "title", "updatedAt"] });

    const rawBase = process.env.SITE_URL || "https://bingolplus.com";
    const baseUrl = rawBase.replace(/\/$/, "");
    const today = new Date().toISOString().split("T")[0];

    const staticUrls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/forum", priority: "0.8", changefreq: "daily" },
      { loc: "/forum/akis", priority: "0.8", changefreq: "daily" },
      { loc: "/ilanlar", priority: "0.8", changefreq: "daily" },
      { loc: "/hakkimizda", priority: "0.5", changefreq: "monthly" },
      { loc: "/iletisim", priority: "0.5", changefreq: "monthly" },
      { loc: "/gizlilik-politikasi", priority: "0.4", changefreq: "yearly" },
      { loc: "/kullanim-sartlari", priority: "0.4", changefreq: "yearly" },
      { loc: "/cerez-politikasi", priority: "0.4", changefreq: "yearly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Statik sayfalar
    for (const u of staticUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(baseUrl + u.loc)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      xml += `    <priority>${u.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Forum konuları
    for (const post of posts) {
      const slug = slugify(post.title);
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/forum/konu/${post.id}/${slug}`)}</loc>\n`;
      xml += `    <lastmod>${new Date(post.updatedAt).toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    // İlanlar
    for (const job of jobs) {
      const slug = slugify(job.title);
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/ilanlar/${job.id}/${slug}`)}</loc>\n`;
      xml += `    <lastmod>${new Date(job.updatedAt).toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.log("Error Code:", 6001);
    res.status(500).send("Sitemap oluşturulamadı");
  }
});

export default router;