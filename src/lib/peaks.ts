import fs from "node:fs";
import path from "node:path";

export function readPeaks(src: string | undefined | null): number[] | null {
  if (!src) return null;
  const rel = src.replace(/^\//, "");
  const abs = path.join(process.cwd(), "public", rel);
  if (!fs.existsSync(abs)) return null;
  const data = JSON.parse(fs.readFileSync(abs, "utf8")) as { peaks?: unknown } | unknown[];
  const peaks = Array.isArray(data) ? data : data.peaks;
  if (!Array.isArray(peaks) || !peaks.length) return null;
  return peaks.map((n) => (typeof n === "number" ? n : Number(n) || 0));
}
