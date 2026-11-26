export interface Embed {
  href: string;
  label: string;
  src?: string;
  title: string;
}

const LABELS: Record<string, string> = {
  bandcamp: "Bandcamp",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  mixcloud: "Mixcloud",
  youtube: "YouTube",
};

function parseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iframe = trimmed.match(/src=["']([^"']+)["']/i);
  const candidate = iframe?.[1] || trimmed;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
  if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
  if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
  return url.searchParams.get("v");
}

function spotifyEmbed(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const kinds = ["track", "album", "playlist", "episode", "show", "artist"];
  const index = parts.findIndex((part) => kinds.includes(part));
  if (index === -1 || !parts[index + 1]) return null;
  return `https://open.spotify.com/embed/${parts[index]}/${parts[index + 1]}`;
}

export function embedFor(kind: keyof typeof LABELS, raw: string | undefined | null): Embed | null {
  if (!raw) return null;
  const url = parseUrl(raw);
  if (!url) return null;
  const label = LABELS[kind];
  const host = url.hostname.replace(/^www\./, "");
  let src: string | undefined;
  let href = url.href;

  if (kind === "youtube" || host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const id = youtubeId(url);
    if (id) src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
    href = src ? `https://www.youtube.com/watch?v=${encodeURIComponent(id!)}` : href;
  } else if (kind === "spotify" || host === "open.spotify.com") {
    src = spotifyEmbed(url) || (url.pathname.includes("/embed/") ? url.href : undefined);
  } else if (kind === "soundcloud" || host.endsWith("soundcloud.com")) {
    src = host === "w.soundcloud.com" ? url.href : `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&color=%23ff3b30&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  } else if (kind === "mixcloud" || host.endsWith("mixcloud.com")) {
    src = host === "player-widget.mixcloud.com" || url.pathname.startsWith("/widget/")
      ? url.href
      : `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(url.href)}`;
  } else if (kind === "bandcamp" || host.endsWith("bandcamp.com")) {
    if (url.pathname.includes("EmbeddedPlayer") || host === "bandcamp.com") {
      src = url.pathname.includes("EmbeddedPlayer") ? url.href : undefined;
    }
  }

  return { href, label, src, title: `${label} player` };
}

export function embedsFrom(fields: Partial<Record<keyof typeof LABELS, string | undefined>>): Embed[] {
  return (Object.keys(LABELS) as Array<keyof typeof LABELS>)
    .map((kind) => embedFor(kind, fields[kind]))
    .filter((item): item is Embed => Boolean(item));
}
