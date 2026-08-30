import "express-session";

interface FlashMessage {
    type: "success" | "error" | "warning";
    message: string;
    errors?: Record<string, string>;
    oldInput?: Record<string, string>;
}

declare module "express-session" {
    interface SessionData {
        isAuth: boolean;
        userId: number;
        username: string;
        role: "user" | "admin";
        flash?: FlashMessage;
        csrfSecret?: string;
    }
}
