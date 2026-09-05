const SENSITIVE_KEYS = [
    "password",
    "passwd",
    "pwd",
    "secret",
    "token",
    "csrf",
    "session",
    "cookie",
    "authorization",
    "auth",
    "apikey",
    "api_key",
    "privatekey",
    "private_key",
    "credential",
    "credit",
    "ssn",
];

function isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase();
    return SENSITIVE_KEYS.some((s) => lower.includes(s));
}

function safeStringify(value: unknown, indent = 2): string {
    const seen = new WeakSet<object>();
    try {
        const result = JSON.stringify(
            value,
            function (key, val) {
                if (isSensitiveKey(key)) {
                    return "[REDACTED]";
                }
                if (typeof val === "object" && val !== null) {
                    if (seen.has(val as object)) {
                        return "[Circular]";
                    }
                    seen.add(val as object);
                    if (val instanceof Error) {
                        const anyErr: any = val;
                        const obj: Record<string, unknown> = {
                            name: (val as Error).name || "Error",
                            message: (val as Error).message || "",
                        };
                        // Preserve stack if present (important for debugging, console-like output)
                        if (typeof anyErr.stack === "string" && anyErr.stack) {
                            obj.stack = anyErr.stack;
                        }
                        // Preserve common error codes / statuses
                        if (anyErr.code !== undefined) obj.code = anyErr.code;
                        if (anyErr.status !== undefined) obj.status = anyErr.status;
                        if (anyErr.statusCode !== undefined) obj.statusCode = anyErr.statusCode;
                        if (anyErr.errno !== undefined) obj.errno = anyErr.errno;
                        // Sequelize / DB specific
                        if (Array.isArray(anyErr.errors)) obj.errors = anyErr.errors;
                        if (anyErr.original) obj.original = anyErr.original;
                        if (anyErr.parent) obj.parent = anyErr.parent;
                        if (anyErr.cause) obj.cause = anyErr.cause;
                        if (anyErr.sql) obj.sql = "[REDACTED SQL]";
                        if (anyErr.parameters) obj.parameters = "[REDACTED]";
                        if (anyErr.fields) obj.fields = "[REDACTED]";
                        if (anyErr.detail) obj.detail = anyErr.detail;
                        if (anyErr.hint) obj.hint = anyErr.hint;
                        if (anyErr.where) obj.where = anyErr.where;
                        if (anyErr.constraint) obj.constraint = anyErr.constraint;
                        if (anyErr.table) obj.table = anyErr.table;
                        if (anyErr.column) obj.column = anyErr.column;
                        if (anyErr.sequelize !== undefined) obj.sequelize = anyErr.sequelize;
                        // Include any other enumerable own props not already captured
                        try {
                            const ownKeys = Object.keys(val as object);
                            for (const k of ownKeys) {
                                if (!(k in obj) && k !== "name" && k !== "message" && k !== "stack") {
                                    // already redacted via isSensitiveKey check above for key
                                    (obj as any)[k] = (anyErr as any)[k];
                                }
                            }
                        } catch {}
                        return obj;
                    }
                    // Buffer detection: direct Buffer instance or its JSON representation {type:"Buffer", data:[...]}
                    try {
                        const maybeBuf: any = val;
                        if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(maybeBuf)) {
                            return "[Buffer]";
                        }
                        if (
                            maybeBuf &&
                            typeof maybeBuf === "object" &&
                            maybeBuf.type === "Buffer" &&
                            Array.isArray(maybeBuf.data)
                        ) {
                            return "[Buffer]";
                        }
                    } catch {}
                    const ctor = (val as any)?.constructor?.name;
                    if (ctor === "Buffer" && typeof (val as any).toString === "function") {
                        return "[Buffer]";
                    }
                }
                return val;
            },
            indent
        );
        // JSON.stringify returns undefined for function, symbol, undefined in some contexts
        if (result === undefined) {
            try {
                return String(value);
            } catch {
                return "[Unstringifiable]";
            }
        }
        return result;
    } catch {
        try {
            const fallback = String(value);
            // Avoid [object Object]
            if (fallback === "[object Object]" || fallback === "[object Array]") {
                return "[Unstringifiable: " + Object.prototype.toString.call(value) + "]";
            }
            return fallback;
        } catch {
            return "[Unstringifiable]";
        }
    }
}

function formatErrorInstance(err: Error): string {
    const anyErr: any = err;
    const name = err.name || "Error";
    const message = err.message || "";
    const codePart = anyErr.code !== undefined ? ` [code: ${String(anyErr.code)}]` : "";
    const statusVal = anyErr.status ?? anyErr.statusCode;
    const statusPart = statusVal !== undefined ? ` [status: ${String(statusVal)}]` : "";
    const errnoPart = anyErr.errno !== undefined ? ` [errno: ${String(anyErr.errno)}]` : "";
    const header = message ? `${name}: ${message}${codePart}${statusPart}${errnoPart}` : `${name}${codePart}${statusPart}${errnoPart}`;

    // Use stack if available - it's the most console-like representation
    let base = header;
    if (typeof anyErr.stack === "string" && anyErr.stack.trim()) {
        // stack already contains name: message at first line, but we have added code/status to header
        // If stack exists, prefer stack and append code/status if not already in stack
        base = anyErr.stack;
        // If we added extra code/status/errno info and stack doesn't contain it, prepend header details
        // We handle this by adding Details section below
    }

    // Collect extra details beyond name/message/stack
    const extra: Record<string, unknown> = {};

    // Known extra keys
    const knownExtraKeys = [
        "code",
        "status",
        "statusCode",
        "errno",
        "sql",
        "parameters",
        "fields",
        "errors",
        "original",
        "parent",
        "cause",
        "detail",
        "hint",
        "where",
        "constraint",
        "table",
        "column",
        "sequelize",
        "validationErrors",
        "fields",
        "index",
        "keyPattern",
        "keyValue",
    ];

    for (const k of knownExtraKeys) {
        if (anyErr[k] !== undefined) {
            if (k === "sql") extra[k] = "[REDACTED SQL]";
            else if (k === "parameters" || k === "fields") extra[k] = "[REDACTED]";
            else extra[k] = anyErr[k];
        }
    }

    // Include any other enumerable own properties that are not standard
    try {
        const ownKeys = Object.keys(err as object);
        for (const k of ownKeys) {
            if (!["name", "message", "stack", ...knownExtraKeys].includes(k)) {
                extra[k] = anyErr[k];
            }
        }
        // Also check for non-enumerable but important props that might be missed (code etc already handled)
        // Try getOwnPropertyNames for completeness (includes non-enumerable)
        const allKeys = Object.getOwnPropertyNames(err as object);
        for (const k of allKeys) {
            if (!["name", "message", "stack", ...knownExtraKeys].includes(k) && !(k in extra) && k !== "stack") {
                // Avoid huge or internal props, but include if not yet present
                try {
                    const val = anyErr[k];
                    // Only add if not function and not undefined
                    if (val !== undefined && typeof val !== "function") {
                        extra[k] = val;
                    }
                } catch {}
            }
        }
    } catch {}

    // Remove empty extra
    const extraKeys = Object.keys(extra);
    if (extraKeys.length === 0) {
        return base;
    }

    // Stringify extra with redaction and circular safety
    let extraStr: string;
    try {
        extraStr = safeStringify(extra, 2);
    } catch {
        extraStr = "[Unstringifiable details]";
    }

    // Avoid [object Object] in details
    if (extraStr === "[object Object]" || extraStr === "{}" || !extraStr) {
        return base;
    }

    return `${base}\nDetails: ${extraStr}`;
}

/**
 * Merkezi hata normalizasyon helper'ı.
 * Her türlü hata tipini (Error, string, plain object, array, null, circular, Sequelize hatası vb.)
 * güvenli, okunabilir ve XSS-safe string formatına dönüştürür.
 * Asla [object Object] döndürmez, circular reference'da çökmez, hassas verileri redact eder.
 */
export function normalizeError(input: unknown): string {
    // null / undefined
    if (input === null) return "null";
    if (input === undefined) return "undefined";

    // string
    if (typeof input === "string") {
        const trimmed = input.trim();
        // JSON-like string ise parse edip pretty print (redaction ile)
        if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
            try {
                const parsed = JSON.parse(trimmed);
                const stringified = safeStringify(parsed, 2);
                if (stringified && stringified !== "undefined") {
                    return stringified;
                }
            } catch {
                // not valid JSON, fall through to return original string
            }
        }
        return input;
    }

    // number / boolean / bigint
    if (typeof input === "number" || typeof input === "boolean" || typeof input === "bigint") {
        return String(input);
    }

    // symbol
    if (typeof input === "symbol") {
        return input.toString();
    }

    // function
    if (typeof input === "function") {
        return `[Function: ${input.name || "anonymous"}]`;
    }

    // Error subclass'ları (instanceof Error)
    if (input instanceof Error) {
        try {
            return formatErrorInstance(input);
        } catch {
            try {
                return safeStringify(input, 2);
            } catch {
                return `${(input as Error).name || "Error"}: ${(input as Error).message || String(input)}`;
            }
        }
    }

    // Plain object ama message property'si olan error-like obje (Sequelize error'u Error değilse vb.)
    if (
        typeof input === "object" &&
        input !== null &&
        "message" in (input as Record<string, unknown>) &&
        typeof (input as Record<string, unknown>).message === "string"
    ) {
        try {
            const obj = input as Record<string, unknown>;
            const name = typeof obj.name === "string" ? obj.name : "Error";
            const message = obj.message as string;
            const stack = typeof obj.stack === "string" ? obj.stack : undefined;
            const anyObj: any = obj;
            const codePart = anyObj.code !== undefined ? ` [code: ${String(anyObj.code)}]` : "";
            const statusVal = anyObj.status ?? anyObj.statusCode;
            const statusPart = statusVal !== undefined ? ` [status: ${String(statusVal)}]` : "";
            const header = `${name}: ${message}${codePart}${statusPart}`;
            let base = header;
            if (stack && stack.trim() && stack !== header) {
                if (stack.startsWith(header)) {
                    base = stack;
                } else {
                    const lines = stack.split("\n");
                    if (lines.length > 1 && lines[0].includes(":")) {
                        // Replace first line with correct header, keep rest (stack trace)
                        base = header + "\n" + lines.slice(1).join("\n");
                    } else {
                        base = header + "\n" + stack;
                    }
                }
            }
            const rest: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj)) {
                if (!["name", "message", "stack"].includes(k)) {
                    rest[k] = v;
                }
            }
            // Also include code/status if they were in obj but not needed separately (already in header, but keep in details for completeness if extra)
            if (Object.keys(rest).length > 0) {
                const extraStr = safeStringify(rest, 2);
                if (extraStr && extraStr !== "{}" && extraStr !== "[object Object]") {
                    return `${base}\nDetails: ${extraStr}`;
                }
            }
            return base;
        } catch {
            // fallback to generic
        }
    }

    // Array veya generic object
    if (typeof input === "object") {
        try {
            const result = safeStringify(input, 2);
            if (result === undefined) {
                const fallback = String(input);
                if (fallback === "[object Object]" || fallback === "[object Array]") {
                    return safeStringify({ value: input }, 2);
                }
                return fallback;
            }
            if (result === "[object Object]" || result === "[object Array]") {
                return "[Unstringifiable Object]";
            }
            return result;
        } catch {
            try {
                const fallback = String(input);
                if (fallback === "[object Object]") {
                    return "[Unstringifiable Object]";
                }
                return fallback;
            } catch {
                return "[Unstringifiable]";
            }
        }
    }

    // Fallback (should not reach)
    try {
        return String(input);
    } catch {
        return "[Unstringifiable]";
    }
}

export default normalizeError;
