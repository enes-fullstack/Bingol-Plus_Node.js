import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "development"
    ? ".env.development"
    : ".env";

dotenv.config({ path: envFile });

interface Config {
    database: {
        name: string;
        username: string;
        password: string;
        host: string;
        dialect: string;
    },
    session: {
        key: string
    },
    email: {
        mail: string,
        password: string
    },
    cloudinary: {
        name: string;
        apiKey: string;
        apiSecret: string;
        folder: string;
    },
    telegram: {
        bot_token: string,
        chat_id: string
    }
};

const config: Config = {
    database: {
        name: process.env.DB_NAME!,
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        host: process.env.DB_HOST!,
        dialect: process.env.DB_DIALECT!
    },
    session: {
        key: process.env.SESSION_SECRET!
    },
    email: {
        mail: process.env.GMAIL!,
        password: process.env.GMAIL_APP_PASSWORD!
    },
    cloudinary: {
        name: process.env.CLOUDINARY_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        folder: process.env.CLOUDINARY_FOLDER!
    },
    telegram: {
        bot_token: process.env.TG_BOT_TOKEN!,
        chat_id: process.env.TG_CHAT_ID!
    }
};

export default config;