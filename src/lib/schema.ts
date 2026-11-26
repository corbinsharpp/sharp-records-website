import type { Artist, EventEntry, Release } from "./content";
import { absolute } from "./site";

export function organization(options: {
  email: string;
  city: string;
  country: string;
  countryCode: string;
  genres: string[];
  description: string;
  sameAs?: string[];
}) {
  return {
    "@type": ["MusicGroup", "Organization"],
    "@id": `${absolute("/")}#label`,
    name: "Sharp Records",
    url: absolute("/"),
    logo: absolute("/assets/img/logo-vinyl.svg"),
    image: absolute("/assets/img/og-image.png"),
    description: options.description,
    foundingLocation: {
      "@type": "Place",
      name: options.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: options.city,
        addressCountry: options.countryCode,
      },
    },
    areaServed: options.country,
    genre: options.genres,
    email: options.email,
    ...(options.sameAs && options.sameAs.length ? { sameAs: options.sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absolute("/enquire.html"),
      email: options.email,
    },
  };
}

export function albumSchema(release: Release, artist: Artist | undefined, image: string) {
  return {
    "@type": "MusicAlbum",
    "@id": `${absolute(`/releases/${release.id}.html`)}#album`,
    name: release.data.title,
    catalogNumber: release.data.catalogNumber,
    image,
    url: absolute(`/releases/${release.id}.html`),
    ...(artist
      ? {
          byArtist: {
            "@type": "MusicGroup",
            name: artist.data.name,
            ...(artist.data.alternateName ? { alternateName: artist.data.alternateName } : {}),
            url: absolute(`/artists/${artist.id}.html`),
          },
        }
      : {}),
    numTracks: release.data.tracks.length,
    ...(release.data.genre ? { genre: release.data.genre } : {}),
    publisher: { "@id": `${absolute("/")}#label` },
    description: release.data.summary,
    track: release.data.tracks.map((track, index) => ({
      "@type": "MusicRecording",
      name: track.title,
      position: index + 1,
    })),
  };
}

export function eventSchema(event: EventEntry, performer: Artist | undefined) {
  return {
    "@type": "MusicEvent",
    "@id": `${absolute(`/events/${event.id}.html`)}#event`,
    name: event.data.title,
    startDate: event.data.start,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absolute(`/events/${event.id}.html`),
    location: {
      "@type": "Place",
      name: event.data.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.data.city,
        addressCountry: "GB",
      },
    },
    ...(performer
      ? { performer: { "@type": "MusicGroup", name: performer.data.name, url: absolute(`/artists/${performer.id}.html`) } }
      : {}),
    ...(event.data.ticketUrl ? { offers: { "@type": "Offer", url: event.data.ticketUrl, availability: "https://schema.org/InStock" } } : {}),
    organizer: { "@id": `${absolute("/")}#label` },
    description: event.data.schemaDescription || event.body?.trim() || event.data.home || event.data.title,
  };
}

export function artistSchema(artist: Artist, image: string) {
  return {
    "@type": "MusicGroup",
    "@id": `${absolute(`/artists/${artist.id}.html`)}#artist`,
    name: artist.data.name,
    ...(artist.data.alternateName ? { alternateName: artist.data.alternateName } : {}),
    url: absolute(`/artists/${artist.id}.html`),
    image,
    description: artist.body?.trim(),
    genre: artist.data.style,
    location: {
      "@type": "Place",
      name: artist.data.location,
      address: { "@type": "PostalAddress", addressLocality: artist.data.location, addressCountry: "GB" },
    },
    memberOf: { "@id": `${absolute("/")}#label` },
  };
}

export function articleSchema(options: {
  id: string;
  title: string;
  description: string;
  date?: string;
  image?: string;
}) {
  return {
    "@type": "Article",
    "@id": `${absolute(`/culture/${options.id}.html`)}#article`,
    headline: options.title,
    description: options.description,
    ...(options.date ? { datePublished: options.date.slice(0, 10) } : {}),
    ...(options.image ? { image: options.image } : {}),
    url: absolute(`/culture/${options.id}.html`),
    author: { "@id": `${absolute("/")}#label` },
    publisher: { "@id": `${absolute("/")}#label` },
    mainEntityOfPage: absolute(`/culture/${options.id}.html`),
  };
}
