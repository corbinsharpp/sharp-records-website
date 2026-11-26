export const SITE = (import.meta.env.PUBLIC_SITE_URL || "https://sharprecords.uk").replace(/\/$/, "");

export function absolute(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path, `${SITE}/`).href;
}

const GA = /^G-[A-Z0-9]+$/;

export function analyticsId(): string {
  const id = (import.meta.env.PUBLIC_GA_MEASUREMENT_ID || "").trim();
  return GA.test(id) ? id : "";
}

export function turnstileSiteKey(): string {
  const key = (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  if (!key || key.startsWith("your-") || key === "paste-here") return "";
  return key;
}
