import { normalizeError } from "./normalizeError.js";

// Backward compatibility: existing code imports formatLogMessage / formatErrorMessage
// Yeni merkezi helper normalizeError'dır; eski fonksiyonlar normalizeError'a delegate eder.

export function formatLogMessage(input: unknown): string {
    return normalizeError(input);
}

export function formatErrorMessage(err: unknown): string {
    return normalizeError(err);
}

export default formatLogMessage;

// Also re-export normalizeError for convenience
export { normalizeError } from "./normalizeError.js";
