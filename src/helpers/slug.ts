import slugifyLib from "slugify";

slugifyLib.extend({ "&": " ve " });

export function slugify(text: string): string {
    return slugifyLib(text, { lower: true, strict: true }).substring(0, 80);
}
