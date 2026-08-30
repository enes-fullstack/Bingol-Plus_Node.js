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
                        const err = val as unknown as Record<string, unknown>;
                        const obj: Record<string, unknown> = {
                            name: (val as Error).name,
                            message: (val as Error).message,
                        };
                        const anyErr = val as any;
                        if (Array.isArray(anyErr.errors)) obj.errors = anyErr.errors;
                        if (anyErr.original) obj.original = anyErr.original;
                        if (anyErr.parent) obj.parent = anyErr.parent;
                        if (anyErr.cause) obj.cause = anyErr.cause;
                        if (anyErr.sql) obj.sql = "[REDACTED SQL]";
                        if (anyErr.parameters) obj.parameters = "[REDACTED]";
                        if (anyErr.fields) obj.fields = "[REDACTED]";
                        return obj;
                    }
                    // Buffer detection
                    const ctor = (val as any)?.constructor?.name;
                    if (ctor === "Buffer" && typeof (val as any).toString === "function") {
                        return "[Buffer]";
                    }
                }
                return val;
            },
            indent
        );
        return result ?? String(value);
    } catch {
        try {
            return String(value);
        } catch {
            return "[Unstringifiable]";
        }
    }
}

export function formatErrorMessage(err: unknown): string {
    if (err === null) return "null";
    if (err === undefined) return "undefined";
    if (err instanceof Error) {
        const anyErr = err as any;
        let base = `${err.name}: ${err.message}`;
        if (Array.isArray(anyErr.errors) && anyErr.errors.length > 0) {
            try {
                base += ` | Details: ${safeStringify(anyErr.errors)}`;
            } catch {}
        } else if (anyErr.original) {
            const orig = anyErr.original;
            const origMsg =
                orig?.message && typeof orig.message === "string"
                    ? orig.message
                    : safeStringify(orig);
            base += ` | Original: ${origMsg}`;
        } else if (anyErr.parent) {
            const parent = anyErr.parent;
            const parentMsg =
                parent?.message && typeof parent.message === "string"
                    ? parent.message
                    : safeStringify(parent);
            base += ` | Parent: ${parentMsg}`;
        } else if (anyErr.cause) {
            const cause = anyErr.cause;
            const causeMsg =
                cause instanceof Error
                    ? `${cause.name}: ${cause.message}`
                    : typeof cause === "string"
                      ? cause
                      : safeStringify(cause);
            base += ` | Cause: ${causeMsg}`;
        }
        if (anyErr.sql && !base.includes("Original") && !base.includes("Parent")) {
            base += " | SQL: [REDACTED]";
        }
        return base;
    }
    if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as Record<string, unknown>).message === "string"
    ) {
        const msg = (err as Record<string, unknown>).message as string;
        const name = typeof (err as Record<string, unknown>).name === "string" ? (err as Record<string, unknown>).name as string : "Error";
        let base = `${name}: ${msg}`;
        const anyErr = err as any;
        if (Array.isArray(anyErr.errors) && anyErr.errors.length > 0) {
            try {
                base += ` | Details: ${safeStringify(anyErr.errors)}`;
            } catch {}
        }
        return base;
    }
    return formatLogMessage(err);
}

export function formatLogMessage(input: unknown): string {
    if (input === null) return "null";
    if (input === undefined) return "undefined";
    if (typeof input === "string") {
        const trimmed = input.trim();
        if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
            try {
                const parsed = JSON.parse(trimmed);
                const stringified = safeStringify(parsed);
                if (stringified !== undefined && stringified !== null) {
                    return stringified;
                }
                return String(input);
            } catch {
                // not valid JSON, return original
            }
        }
        return input;
    }
    if (typeof input === "number" || typeof input === "boolean" || typeof input === "bigint") {
        return String(input);
    }
    if (typeof input === "symbol") {
        return input.toString();
    }
    if (input instanceof Error) {
        return formatErrorMessage(input);
    }
    if (typeof input === "object") {
        try {
            const result = safeStringify(input);
            if (result === undefined) return String(input);
            return result;
        } catch {
            return String(input);
        }
    }
    return String(input);
}

export default formatLogMessage;
