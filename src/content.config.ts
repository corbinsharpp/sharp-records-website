import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const optionalText = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.string().optional(),
);

const track = z.object({
  title: z.string(),
  previewMp3: optionalText,
  previewM4a: optionalText,
  previewOgg: optionalText,
  peaks: optionalText,
});

const releases = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/releases" }),
  schema: z.object({
    title: z.string(),
    catalogNumber: z.string(),
    format: z.string(),
    genre: optionalText,
    order: z.number().default(1),
    artist: z.string(),
    summary: z.string(),
    homeSummary: optionalText,
    cover: z.string().min(1),
    coverAlt: z.string().min(1),
    bandcamp: optionalText,
    soundcloud: optionalText,
    spotify: optionalText,
    mixcloud: optionalText,
    youtube: optionalText,
    tracks: z.array(track).default([]),
  }),
});

const artists = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artists" }),
  schema: z.object({
    name: z.string(),
    location: z.string(),
    style: z.string(),
    alternateName: optionalText,
    photo: z.string().min(1),
    photoAlt: z.string().min(1),
    order: z.number().default(1),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    shortTitle: optionalText,
    start: z.string(),
    city: z.string(),
    venue: z.string(),
    placeholder: z.boolean().default(false),
    home: optionalText,
    schemaDescription: optionalText,
    ticketUrl: optionalText,
    performer: optionalText,
  }),
});

const withAlt = <T extends z.ZodRawShape>(shape: T, imageKey: string, altKey: string) =>
  z.object(shape).superRefine((data, ctx) => {
    const record = data as Record<string, unknown>;
    if (record[imageKey] && !String(record[altKey] || "").trim()) {
      ctx.addIssue({
        code: "custom",
        path: [altKey],
        message: "Describe this picture. Alt text is required.",
      });
    }
  });

const radio = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/radio" }),
  schema: withAlt(
    {
      title: z.string(),
      date: optionalText,
      cover: optionalText,
      coverAlt: optionalText,
      audio: optionalText,
      bandcamp: optionalText,
      soundcloud: optionalText,
      spotify: optionalText,
      mixcloud: optionalText,
      youtube: optionalText,
    },
    "cover",
    "coverAlt",
  ),
});

const culture = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/culture" }),
  schema: withAlt(
    {
      title: z.string(),
      date: optionalText,
      meta: optionalText,
      flag: optionalText,
      excerpt: z.string(),
      image: optionalText,
      imageAlt: optionalText,
      featureOnHome: z.boolean().default(false),
      order: z.number().default(1),
      release: optionalText,
    },
    "image",
    "imageAlt",
  ),
});

const homepage = defineCollection({
  loader: glob({ pattern: "homepage.md", base: "./src/content/pages" }),
  schema: z.object({
    seoTitle: z.string(),
    seoDescription: z.string(),
    kicker: z.string(),
    statement: z.string(),
    mast: z.string(),
    listenLabel: z.string(),
    manifestoButton: z.string(),
    manifestoLink: z.string(),
    artistButton: z.string(),
    manifestoIndex: z.string(),
    catalogueIndex: z.string(),
    catalogueHeading: z.string(),
    catalogueLink: z.string(),
    rosterIndex: z.string(),
    rosterHeading: z.string(),
    rosterLink: z.string(),
    liveIndex: z.string(),
    liveHeading: z.string(),
    liveLink: z.string(),
    radioIndex: z.string(),
    radioHeading: z.string(),
    radioButton: z.string(),
    cultureIndex: z.string(),
    cultureHeading: z.string(),
    cultureLink: z.string(),
    readLabel: z.string(),
    contactIndex: z.string(),
    contactHeading: z.string(),
    featuredRelease: z.string(),
    featuredArtist: z.string(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: "about.md", base: "./src/content/pages" }),
  schema: z.object({
    eyebrow: z.string(),
    title: z.string(),
    lede: z.string(),
    description: z.string(),
    heading: z.string(),
    closing: z.string(),
    image: z.string(),
    imageAlt: z.string().min(1),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: "settings.md", base: "./src/content/pages" }),
  schema: z.object({
    email: z.string().email(),
    city: z.string(),
    country: z.string(),
    countryCode: z.string(),
    locationLine: z.string(),
    genres: z.string(),
    social: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    newsletterHeading: z.string(),
    newsletterText: z.string(),
    newsletterConsent: z.string(),
  }),
});

const privacy = defineCollection({
  loader: glob({ pattern: "privacy.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    reviewed: z.boolean().default(false),
  }),
});

const sections = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/sections" }),
  schema: withAlt(
    {
      eyebrow: z.string(),
      title: z.string(),
      lede: z.string(),
      homeLede: optionalText,
      description: z.string(),
      image: optionalText,
      imageAlt: optionalText,
      noteFlag: optionalText,
      noteHeading: optionalText,
    },
    "image",
    "imageAlt",
  ),
});

export const collections = {
  releases,
  artists,
  events,
  radio,
  culture,
  homepage,
  about,
  settings,
  privacy,
  sections,
};
