import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import config from "../config/config.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    socketTimeout: 15000,
    auth: {
        user: config.email.mail,
        pass: config.email.password
    }
});

export const sendJobNotification = async (to: string, title: string, status: "approved" | "rejected"): Promise<void> => {
    const subject = status === "approved" ? "Bingöl Plus - İlanınız Yayınlandı" : "Bingöl Plus - İlanınız Red Edildi";

    const siteUrl = (process.env.SITE_URL || "https://bingolplus.com").replace(/\/$/, "");
    const templatePath = path.join(process.cwd(), "src", "views", "mail", "job-notification.ejs");
    const html = await ejs.renderFile(templatePath, { title, siteUrl, status });

    await transporter.sendMail({ from: config.email.mail, to, subject, html });
};

export const sendResetEmail = async (to: string, token: string): Promise<void> => {
    const siteUrl = (process.env.SITE_URL || "https://bingolplus.com").replace(/\/$/, "");
    const resetUrl = `${siteUrl}/sifre-sifirla/${token}`;
    const templatePath = path.join(process.cwd(), "src", "views", "mail", "forgot-password.ejs");
    const html = await ejs.renderFile(templatePath, { resetUrl });

    await transporter.sendMail({
        from: config.email.mail,
        to,
        subject: "Bingöl Plus - Şifre Sıfırlama",
        html
    });
};

export const sendApplicationStatus = async (to: string, title: string, status: "kabul_edildi" | "reddedildi"): Promise<void> => {
    const subject = status === "kabul_edildi" ? "Bingöl Plus - Başvurunuz Kabul Edildi" : "Bingöl Plus - Başvurunuz Reddedildi";

    const siteUrl = (process.env.SITE_URL || "https://bingolplus.com").replace(/\/$/, "");
    const templatePath = path.join(process.cwd(), "src", "views", "mail", "application-status.ejs");
    const html = await ejs.renderFile(templatePath, { title, siteUrl, status });

    await transporter.sendMail({ from: config.email.mail, to, subject, html });
};

export const sendFirstReplyNotification = async (to: string, username: string, postTitle: string, postUrl: string): Promise<void> => {
    const subject = "Bingöl Plus - Konunuza ilk yanıt geldi";
    const templatePath = path.join(process.cwd(), "src", "views", "mail", "first-reply-notification.ejs");
    const html = await ejs.renderFile(templatePath, { username, postTitle, postUrl });
    const text = `Merhaba ${username},\n\nForumdaki "${postTitle}" başlıklı konunuza yeni bir yanıt verildi.\n\nYanıtı görüntülemek için: ${postUrl}\n\nBingöl Plus`;

    await transporter.sendMail({ from: config.email.mail, to, subject, html, text });
};
