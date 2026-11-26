import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";
import { absolute } from "./site";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/uploads/**/*.{jpg,jpeg,png,webp,avif,gif}",
  { eager: true },
);

export function findImage(src: string | undefined | null): ImageMetadata | undefined {
  if (!src) return undefined;
  const normalised = src.startsWith("/") ? src : `/${src}`;
  const direct = images[normalised];
  if (direct?.default) return direct.default;
  const file = normalised.split("/").pop();
  if (!file) return undefined;
  const hit = Object.entries(images).find(([key]) => key.endsWith(`/${file}`));
  return hit?.[1].default;
}

export function requireImage(src: string, label: string): ImageMetadata {
  const image = findImage(src);
  if (!image) {
    throw new Error(`Could not find the image for ${label}: ${src}. Upload it again from the dashboard.`);
  }
  return image;
}

/** A JPEG URL suitable for Open Graph and structured data. */
export async function shareImage(src: string | undefined | null, fallback = "/assets/img/og-image.png"): Promise<string> {
  const image = findImage(src);
  if (!image) return absolute(fallback);
  const width = Math.min(1200, image.width);
  const height = Math.max(1, Math.round((image.height * width) / image.width));
  const rendered = await getImage({ src: image, width, height, format: "jpg" });
  return absolute(rendered.src);
}
