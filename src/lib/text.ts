/** One item per line, ignoring blank lines. */
export function lines(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return "";
  const day = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function publicPath(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src;
  return `/${src}`;
}
