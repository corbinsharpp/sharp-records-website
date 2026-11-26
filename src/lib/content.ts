import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { readdirSync } from "node:fs";
import path from "node:path";
import { lines } from "./text";

export type Release = CollectionEntry<"releases">;
export type Artist = CollectionEntry<"artists">;
export type EventEntry = CollectionEntry<"events">;
export type RadioEntry = CollectionEntry<"radio">;
export type CultureEntry = CollectionEntry<"culture">;
export type Section = CollectionEntry<"sections">;

function byOrder<T extends { data: { order?: number } }>(items: T[]) {
  return [...items].sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
}

export async function getSite() {
  const radioFiles = readdirSync(path.join(process.cwd(), "src/content/radio")).filter((name) => name.endsWith(".md"));
  const [homepage, about, settings, privacy, sectionList, releaseList, artistList, eventList, radioList, cultureList] =
    await Promise.all([
      getEntry("homepage", "homepage"),
      getEntry("about", "about"),
      getEntry("settings", "settings"),
      getEntry("privacy", "privacy"),
      getCollection("sections"),
      getCollection("releases"),
      getCollection("artists"),
      getCollection("events"),
      radioFiles.length ? getCollection("radio") : Promise.resolve([] as CollectionEntry<"radio">[]),
      getCollection("culture"),
    ]);

  if (!homepage || !about || !settings || !privacy) {
    throw new Error("Homepage, About, Settings or Privacy content is missing.");
  }

  const sections = Object.fromEntries(sectionList.map((section) => [section.id, section])) as Record<string, Section>;
  for (const id of ["releases", "artists", "events", "radio", "culture", "enquire"]) {
    if (!sections[id]) throw new Error(`Missing section page: ${id}`);
  }

  const releases = byOrder(releaseList);
  const artists = byOrder(artistList);
  const events = [...eventList].sort((a, b) => a.data.start.localeCompare(b.data.start));
  const radio = [...radioList].sort((a, b) => (b.data.date || "").localeCompare(a.data.date || ""));
  const culture = byOrder(cultureList);
  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));

  const featuredRelease = releases.find((release) => release.id === homepage.data.featuredRelease) || releases[0];
  const featuredArtist = artists.find((artist) => artist.id === homepage.data.featuredArtist) || artists[0];

  return {
    homepage,
    about,
    settings,
    privacy,
    sections,
    releases,
    artists,
    events,
    radio,
    culture,
    artistsById,
    featuredRelease,
    featuredArtist,
    genres: lines(settings.data.genres),
    mast: lines(homepage.data.mast),
    statement: lines(homepage.data.statement),
  };
}

export function releasesFor(artistId: string, releases: Release[]) {
  return releases.filter((release) => release.data.artist === artistId);
}
