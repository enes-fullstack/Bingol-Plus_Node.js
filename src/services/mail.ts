import nodemailer from "nodemailer";
import config from "../config/config.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email.mail,
        pass: config.email.password
    }
});

const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const sendJobNotification = async (to: string, title: string, status: "approved" | "rejected"): Promise<void> => {
    const subject = status === "approved"
        ? "Bingöl Plus - İlanınız Yayınlandı"
        : "Bingöl Plus - İlanınız Red Edildi";

    const safeTitle = escapeHtml(title);
    const siteUrl = (process.env.SITE_URL || "https://bingolplus.com").replace(/\/$/, "");

    const html = status === "approved" ? `
        <h2>Bingöl Plus</h2>
        <p style="font-size:16px;"><strong>${safeTitle}</strong> başlıklı ilan talebiniz <span style="color:#3c763d;font-weight:600;">onaylandı</span> ve yayına alındı.</p>
        <p>İlanınızı <a href="${siteUrl}/ilanlar">buradan</a> görüntüleyebilirsiniz.</p>
    ` : `
        <h2>Bingöl Plus</h2>
        <p style="font-size:16px;"><strong>${safeTitle}</strong> başlıklı ilan talebiniz maalesef <span style="color:#a94442;font-weight:600;">reddedildi</span>.</p>
        <p>Daha detaylı bilgi için bizimle iletişime geçebilirsiniz.</p>
    `;

    await transporter.sendMail({ from: config.email.mail, to, subject, html });
};

export const sendResetEmail = async (to: string, token: string): Promise<void> => {
    const siteUrl = (process.env.SITE_URL || "https://bingolplus.com").replace(/\/$/, "");
    const resetUrl = `${siteUrl}/sifre-sifirla/${token}`;

    await transporter.sendMail({
        from: config.email.mail,
        to,
        subject: "Bingöl Plus - Şifre Sıfırlama",
        html: `
            <h2>Bingöl Plus</h2>
            <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4A7C7D;color:#fff;text-decoration:none;border-radius:6px;">Şifremi Sıfırla</a>
            <p>Bu bağlantı 1 saat süreyle geçerlidir.</p>
            <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı dikkate almayın.</p>
        `
    });
};
