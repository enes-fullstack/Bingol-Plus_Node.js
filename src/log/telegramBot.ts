import config from "../config/config.js";
import { error as logError } from "./logger.js";

interface TelegramApiResponse {
    ok: boolean;
    description?: string;
}

/**
 * Admin Telegram grubuna log mesajı gönderir.
 *
 * - Başarılıysa `true`, her türlü başarısızlıkta `false` döner; asla throw etmez.
 * - Token/chatId tanımsızsa ağ isteği yapmadan sessizce `false` döner
 *   (test ortamı veya kredensiyelsiz kurulum akışı bozmaz).
 * - Hata durumunda server loguna yazar, kullanıcıya bir şey yansıtmaz.
 */
export const sendTelegramLog = async (message: string): Promise<boolean> => {
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) return false;

    const token = config.telegram.bot_token || "";
    const chatId = config.telegram.chat_id || "";
    if (!token || !chatId) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            logError(`Telegram logu gönderilemedi (HTTP ${res.status})`);
            return false;
        }

        const data = (await res.json()) as TelegramApiResponse;
        if (!data.ok) {
            logError(`Telegram logu gönderilemedi: ${data.description || "bilinmeyen hata"}`);
            return false;
        }

        return true;
    } catch (err) {
        logError(`Telegram logu gönderilemedi: ${err instanceof Error ? err.message : String(err)}`);
        return false;
    }
};
