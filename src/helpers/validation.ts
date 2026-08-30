const EMAIL_REGEX: RegExp = /^[^\s@]{1,94}@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX: RegExp = /^[a-zA-Z0-9_-]{2,50}$/;
const PASSWORD_REGEX: RegExp = /^.{8,100}$/;
const PHONE_REGEX: RegExp = /^[\d\s()+\-\s]{7,20}$/;
const SALARY_REGEX: RegExp = /^[\d\s.,\-₺$€₼]{0,50}$/;

export const validateEmail = (email: string): boolean => EMAIL_REGEX.test(email);

export const validateUsername = (username: string): boolean => USERNAME_REGEX.test(username);

export const validatePassword = (password: string): boolean => PASSWORD_REGEX.test(password);

export const validateRequired = (val: string): boolean => typeof val === "string" && val.trim().length > 0;

export const validatePhone = (val: string): boolean => !val || PHONE_REGEX.test(val.trim());

export const validateSalary = (val: string): boolean => !val || SALARY_REGEX.test(val.trim());

export interface JobValidationErrors {
    title?: string;
    company?: string;
    location?: string;
    phone?: string;
    salary?: string;
    description?: string;
}

export interface ForumValidationErrors {
    title?: string;
    content?: string;
    category?: string;
}

export interface ReplyValidationErrors {
    content?: string;
}

export const validateReplyContent = (val: string): boolean =>
    typeof val === "string" && val.trim().length >= 1 && val.trim().length <= 10000;

export const validatePostTitle = (val: string): boolean =>
    typeof val === "string" && val.trim().length >= 5 && val.trim().length <= 120;

export const validatePostContent = (val: string): boolean =>
    typeof val === "string" && val.trim().length >= 20 && val.trim().length <= 10000;

export const validateForumForm = (body: Record<string, unknown>): ForumValidationErrors => {
    const errors: ForumValidationErrors = {};
    const title = (body.title as string) || "";
    const content = (body.content as string) || "";

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
    const title = (body.title as string) || "";
    const company = (body.company as string) || "";
    const location = (body.location as string) || "";
    const phone = (body.phone as string) || "";
    const salary = (body.salary as string) || "";
    const description = (body.description as string) || "";

    if (!validateRequired(title)) errors.title = "\u0130lan ba\u015Fl\u0131\u011F\u0131 zorunludur.";
    if (!validateRequired(company)) errors.company = "\u015Eirket ad\u0131 zorunludur.";
    if (!validateRequired(location)) errors.location = "Konum zorunludur.";
    if (!validateRequired(description)) errors.description = "\u0130\u015F a\u00E7\u0131klamas\u0131 zorunludur.";

    if (phone && !validatePhone(phone)) errors.phone = "Telefon numaras\u0131 ge\u00E7ersiz. Sadece rakam, bo\u015Fluk ve + kullanabilirsiniz.";
    if (salary && !validateSalary(salary)) errors.salary = "Maa\u015F bilgisi ge\u00E7ersiz.";

    return errors;
};
