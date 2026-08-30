import helmet from "helmet";

const helmetConfig = helmet({
    // HSTS prod nginx (nginx.prod.conf) üzerinden yönetilir; helmet dev http'te HSTS cache oluşturmasın
    hsts: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'sha256-6pNZ95ONb/PhdKHLjnUiz7Ufwe8qoTXaGinPK/2QQdY='"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"]
        }
    }
});

export default helmetConfig;
