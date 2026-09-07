const EMAIL_REGEX: RegExp = /^[^\s@]{1,94}@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX: RegExp = /^[a-zA-Z0-9_-]{2,50}$/;
const PASSWORD_REGEX: RegExp = /^.{8,100}$/;
const SALARY_REGEX: RegExp = /^[\d\s.,\-₺$€₼]{0,50}$/;

export const RESERVED_USERNAMES: readonly string[] = ["admin","kurucu","owner"];

export const isReservedUsername = (username: string): boolean => {
    if (typeof username !== "string") return false;
    return RESERVED_USERNAMES.includes(username.trim().toLowerCase());
};

export const validateEmail = (email: unknown): boolean => typeof email === "string" && EMAIL_REGEX.test(email);

export const validateUsername = (username: unknown): boolean => typeof username === "string" && USERNAME_REGEX.test(username);

export const validatePassword = (password: unknown): boolean => typeof password === "string" && PASSWORD_REGEX.test(password);

export const validateRequired = (val: unknown): boolean => typeof val === "string" && val.trim().length > 0;

export const validateSalary = (val: unknown): boolean => {
    if (!val) return true;
    if (typeof val !== "string") return false;
    return SALARY_REGEX.test(val.trim());
};

export interface JobValidationErrors {
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    description?: string;
}

export interface JobApplicationErrors {
    ad?: string;
    soyad?: string;
    telefon?: string;
    email?: string;
    ilIlce?: string;
    yas?: string;
    medeniDurumu?: string;
    ogrenimDurumu?: string;
    surucuBelgesi?: string;
    yabanciDil?: string;
    ekNotlar?: string;
}

export interface ForumValidationErrors {
    title?: string;
    content?: string;
    category?: string;
}

export interface ReplyValidationErrors {
    content?: string;
}

export const validateReplyContent = (val: unknown): boolean =>
    typeof val === "string" && val.trim().length >= 1 && val.trim().length <= 10000;

export const validatePostTitle = (val: unknown): boolean =>
    typeof val === "string" && val.trim().length >= 5 && val.trim().length <= 120;

export const validatePostContent = (val: unknown): boolean =>
    typeof val === "string" && val.trim().length >= 20 && val.trim().length <= 10000;

export const validateForumForm = (body: Record<string, unknown>): ForumValidationErrors => {
    const errors: ForumValidationErrors = {};
    const title = body.title;
    const content = body.content;

    if (!validatePostTitle(title)) {
        errors.title = "Ba\u015Fl\u0131k 5-120 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }
    if (!validatePostContent(content)) {
        errors.content = "\u0130\u00E7erik 20-10.000 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }

    return errors;
};

export const validateJobForm = (body: Record<string, unknown>): JobValidationErrors => {
    const errors: JobValidationErrors = {};
    const title = body.title;
    const company = body.company;
    const location = body.location;
    const salary = body.salary;
    const description = body.description;

    if (!validateRequired(title)) errors.title = "\u0130lan ba\u015Fl\u0131\u011F\u0131 zorunludur.";
    if (!validateRequired(company)) errors.company = "\u015Eirket ad\u0131 zorunludur.";
    if (!validateRequired(location)) errors.location = "Konum zorunludur.";
    if (!validateRequired(description)) {
        errors.description = "\u0130\u015F a\u00E7\u0131klamas\u0131 zorunludur.";
    } else if (typeof description === "string" && (description.trim().length < 20 || description.trim().length > 10000)) {
        errors.description = "\u0130\u015F a\u00E7\u0131klamas\u0131 20-10.000 karakter aras\u0131nda olmal\u0131d\u0131r.";
    } else if (typeof description !== "string") {
        errors.description = "\u0130\u015F a\u00E7\u0131klamas\u0131 20-10.000 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }

    if (salary !== undefined && salary !== null && salary !== "" && !validateSalary(salary)) errors.salary = "Maa\u015F bilgisi ge\u00E7ersiz.";

    return errors;
};

const PHONE_REGEX_APPLICATION: RegExp = /^[\d\s()+\-]{7,20}$/;

export const validateJobApplicationForm = (body: Record<string, unknown>): JobApplicationErrors => {
    const errors: JobApplicationErrors = {};

    const ad = (body.ad as string) || "";
    const soyad = (body.soyad as string) || "";
    const telefon = (body.telefon as string) || "";
    const email = (body.email as string) || "";
    const ilIlce = (body.ilIlce as string) || "";
    const yasRaw = body.yas as unknown;
    const medeniDurumu = (body.medeniDurumu as string) || "";
    const ogrenimDurumu = (body.ogrenimDurumu as string) || "";
    const surucuBelgesi = (body.surucuBelgesi as string) || "";
    const yabanciDil = (body.yabanciDil as string) || "";
    const ekNotlar = (body.ekNotlar as string) || "";

    if (!validateRequired(ad) || ad.trim().length < 2 || ad.trim().length > 50) {
        errors.ad = "Ad 2-50 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }
    if (!validateRequired(soyad) || soyad.trim().length < 2 || soyad.trim().length > 50) {
        errors.soyad = "Soyad 2-50 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }
    if (!validateRequired(telefon) || !PHONE_REGEX_APPLICATION.test(telefon.trim())) {
        errors.telefon = "Ge\u00E7erli bir cep telefonu giriniz (7-20 karakter).";
    }
    if (!validateRequired(email) || !validateEmail(email.trim())) {
        errors.email = "Ge\u00E7erli bir e-posta giriniz.";
    }
    if (!validateRequired(ilIlce) || ilIlce.trim().length < 2 || ilIlce.trim().length > 100) {
        errors.ilIlce = "\u0130l / \u0130l\u00E7e 2-100 karakter aras\u0131nda olmal\u0131d\u0131r.";
    }
    const yas = Number(yasRaw);
    if (yasRaw === undefined || yasRaw === null || String(yasRaw).trim() === "" || isNaN(yas) || !Number.isInteger(yas) || yas < 14 || yas > 80) {
        errors.yas = "Ya\u015F 14-80 aras\u0131nda olmal\u0131d\u0131r.";
    }
    const allowedMedeni = ["Bekar", "Evli", "Medeni"];
    if (!allowedMedeni.includes(medeniDurumu)) {
        errors.medeniDurumu = "Medeni durum se\u00E7iniz.";
    }
    const allowedOgrenim = ["İlköğretim", "Ortaöğretim", "Lise", "Ön Lisans", "Lisans", "Eğitim Yok"];
    if (!allowedOgrenim.includes(ogrenimDurumu)) {
        errors.ogrenimDurumu = "\u00D6\u011Frenim durumu se\u00E7iniz.";
    }
    const allowedSurucu = ["Var", "Yok"];
    if (!allowedSurucu.includes(surucuBelgesi)) {
        errors.surucuBelgesi = "S\u00FCr\u00FCc\u00FC belgesi se\u00E7iniz.";
    }
    const allowedDil = ["Yok", "İngilizce", "Almanca", "Arapça", "Diğer"];
    if (!allowedDil.includes(yabanciDil)) {
        errors.yabanciDil = "Yabanc\u0131 dil se\u00E7iniz.";
    }
    if (ekNotlar !== undefined && ekNotlar !== null && ekNotlar !== "") {
        if (typeof ekNotlar !== "string" || ekNotlar.trim().length > 2000) {
            errors.ekNotlar = "Ek notlar en fazla 2000 karakter olabilir.";
        }
    }

    return errors;
};
