#!/usr/bin/env python3
"""Render Sharp Records static pages from shared chrome and fragments."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAG = Path(__file__).resolve().parent / "fragments"

NAV = [
    ("releases.html", "Releases"),
    ("artists.html", "Artists"),
    ("events.html", "Events"),
    ("radio.html", "Radio"),
    ("culture.html", "Culture"),
    ("about.html", "About"),
    ("enquire.html", "Enquire"),
]

ORG = {
    "@type": ["MusicGroup", "Organization"],
    "@id": "https://www.sharprecords.co.uk/#label",
    "name": "Sharp Records",
    "url": "https://www.sharprecords.co.uk/",
    "logo": "https://www.sharprecords.co.uk/assets/img/logo-vinyl.svg",
    "image": "https://www.sharprecords.co.uk/assets/img/og-image.png",
    "description": "Independent electronic music label from Manchester. A platform for music, art and culture. No fixed genre. No creative limits. No compromise.",
    "foundingLocation": {
        "@type": "Place",
        "name": "Manchester",
        "address": {"@type": "PostalAddress", "addressLocality": "Manchester", "addressCountry": "GB"},
    },
    "genre": ["Jungle", "UK Garage", "Techno", "House", "Breaks", "Experimental"],
    "email": "corbinsharpp@gmail.com",
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "url": "https://www.sharprecords.co.uk/enquire.html",
        "email": "corbinsharpp@gmail.com",
    },
}

EVENTS = [
    {
        "@type": "MusicEvent",
        "name": "Sharp Records launch night",
        "startDate": "2027-03-20T22:00:00+00:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": "Venue TBA",
            "address": {"@type": "PostalAddress", "addressLocality": "Manchester", "addressCountry": "GB"},
        },
        "performer": {"@type": "MusicGroup", "name": "Bloom's Village"},
        "organizer": {"@id": "https://www.sharprecords.co.uk/#label"},
        "description": "Placeholder date for the label's first Manchester night. Venue to be announced.",
    },
    {
        "@type": "MusicEvent",
        "name": "Bloom's Village live",
        "startDate": "2027-05-08T21:00:00+01:00",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": "Venue TBA",
            "address": {"@type": "PostalAddress", "addressLocality": "Manchester", "addressCountry": "GB"},
        },
        "performer": {"@type": "MusicGroup", "name": "Bloom's Village"},
        "organizer": {"@id": "https://www.sharprecords.co.uk/#label"},
        "description": "Placeholder listing for a first live date supporting the debut EP.",
    },
]

ALBUM = {
    "@type": "MusicAlbum",
    "name": "Bloom\u2019s Village",
    "catalogNumber": "SR001",
    "image": "https://www.sharprecords.co.uk/assets/img/sr001-cover.jpg",
    "byArtist": {
        "@type": "MusicGroup",
        "name": "Bloom\u2019s Village",
        "alternateName": "Will Holton",
    },
    "numTracks": 3,
    "genre": "Experimental Electronic",
    "publisher": {"@id": "https://www.sharprecords.co.uk/#label"},
    "description": "Three-track experimental electronic EP from Manchester artist Will Holton, working as Bloom\u2019s Village: Flippin, Spinning Rhythms and Got My Mind. The first Sharp Records pressing.",
    "track": [
        {"@type": "MusicRecording", "name": "Flippin", "position": 1},
        {"@type": "MusicRecording", "name": "Spinning Rhythms", "position": 2},
        {"@type": "MusicRecording", "name": "Got My Mind", "position": 3},
    ],
}


def ld(extra=None) -> str:
    graph = [ORG]
    if extra:
        graph.extend(extra)
    payload = {"@context": "https://schema.org", "@graph": graph}
    return json.dumps(payload, ensure_ascii=False, indent=2)


def nav_list(current: str) -> str:
    items = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == current else ""
        items.append(f'          <li><a href="{href}"{cur}>{label}</a></li>')
    return "\n".join(items)


def header(current: str) -> str:
    return f"""  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="logo" href="index.html">
        <img src="assets/img/logo-vinyl.svg" width="44" height="44" alt="">
        <span>Sharp Records</span>
      </a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Open menu" hidden>
        <span class="nav-toggle-label">Menu</span>
      </button>
      <nav class="site-nav" id="site-nav" data-nav aria-label="Primary">
        <ul class="site-nav__list">
{nav_list(current)}
        </ul>
      </nav>
    </div>
  </header>"""


def footer(current: str) -> str:
    return f"""  <footer class="site-footer">
    <div class="wrap site-footer__grid">
      <div>
        <a class="brand" href="index.html">Sharp Records</a>
        <p>An independent electronic music label from Manchester. A platform for music, art and culture.</p>
        <p>No fixed genre. No creative limits. No compromise.</p>
      </div>
      <div>
        <p class="eyebrow">Explore</p>
        <nav aria-label="Footer">
          <ul>
{nav_list(current)}
          </ul>
        </nav>
      </div>
      <div>
        <p class="eyebrow">Contact</p>
        <p><a href="enquire.html">Enquire</a></p>
        <p><a href="mailto:corbinsharpp@gmail.com">corbinsharpp@gmail.com</a></p>
        <p>Manchester, United Kingdom</p>
      </div>
    </div>
    <p class="wrap footer-mark" aria-hidden="true">SHARP</p>
  </footer>
  <script type="module" src="assets/js/main.js"></script>"""


def head(title: str, description: str, canonical: str, jsonld: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#0D0D0D">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Sharp Records">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="https://www.sharprecords.co.uk/assets/img/og-image.png">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="https://www.sharprecords.co.uk/assets/img/og-image.png">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="site.webmanifest">
  <link rel="preload" href="assets/fonts/oswald.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/styles.css">
  <script type="application/ld+json">
{jsonld}
  </script>
</head>"""


def page(filename: str, title: str, description: str, canonical: str, current: str, fragment: str, extra_ld=None) -> None:
    main = (FRAG / fragment).read_text(encoding="utf-8").rstrip()
    html = "\n".join([
        head(title, description, canonical, ld(extra_ld)),
        "  <body>",
        header(current),
        '  <main id="main">',
        main,
        "  </main>",
        footer(current),
        "</body>",
        "</html>",
        "",
    ])
    (ROOT / filename).write_text(html, encoding="utf-8")
    print("wrote", filename, len(html))


def news_redirect() -> None:
    html = """<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>News has moved to Culture | Sharp Records</title>
  <meta name="description" content="News from Sharp Records now lives on the Culture page.">
  <meta http-equiv="refresh" content="0; url=culture.html">
  <link rel="canonical" href="https://www.sharprecords.co.uk/culture.html">
  <script>location.replace("culture.html" + location.hash);</script>
</head>
<body>
  <main>
    <h1>This page has moved</h1>
    <p>News is now part of <a href="culture.html">Culture</a>.</p>
  </main>
</body>
</html>
"""
    (ROOT / "news.html").write_text(html, encoding="utf-8")
    print("wrote news.html redirect")


def main() -> None:
    # Fix unicode escapes written as literal backslash-u sequences in ALBUM
    album = json.loads(json.dumps(ALBUM).encode("utf-8").decode("unicode_escape") if False else json.dumps(ALBUM))
    # ALBUM already has \u2019 in the source file which becomes ’ in the .py then the curly apostrophe.
    page(
        "index.html",
        "Sharp Records — No fixed genre. No creative limits. No compromise.",
        "Sharp Records is an independent electronic music label from Manchester. A platform for music, art and culture. No fixed genre. No creative limits. No compromise.",
        "https://www.sharprecords.co.uk/",
        "index.html",
        "index.main.html",
        extra_ld=[ALBUM, *EVENTS],
    )
    page(
        "releases.html",
        "Releases | Sharp Records",
        "Catalogue from Sharp Records, the Manchester electronic label. First pressing: Bloom’s Village, SR001.",
        "https://www.sharprecords.co.uk/releases.html",
        "releases.html",
        "releases.main.html",
        extra_ld=[ALBUM],
    )
    page(
        "artists.html",
        "Artists | Sharp Records",
        "Artists on Sharp Records. First signing: Bloom’s Village (Will Holton), Manchester.",
        "https://www.sharprecords.co.uk/artists.html",
        "artists.html",
        "artists.main.html",
    )
    page(
        "events.html",
        "Events | Sharp Records",
        "Upcoming Sharp Records events and live dates in Manchester.",
        "https://www.sharprecords.co.uk/events.html",
        "events.html",
        "events.main.html",
        extra_ld=EVENTS,
    )
    page(
        "radio.html",
        "Radio | Sharp Records",
        "Sharp Radio is a forthcoming platform for mixes, sessions and conversations around the Manchester label.",
        "https://www.sharprecords.co.uk/radio.html",
        "radio.html",
        "radio.main.html",
    )
    page(
        "culture.html",
        "Culture | Sharp Records",
        "Notes on music, art, fashion and the culture around Sharp Records.",
        "https://www.sharprecords.co.uk/culture.html",
        "culture.html",
        "culture.main.html",
    )
    page(
        "about.html",
        "About | Sharp Records",
        "The Sharp Records manifesto. We believe in music without boundaries.",
        "https://www.sharprecords.co.uk/about.html",
        "about.html",
        "about.main.html",
    )
    page(
        "enquire.html",
        "Enquire | Sharp Records",
        "Enquire with Sharp Records about bookings, demo submissions, press or licensing.",
        "https://www.sharprecords.co.uk/enquire.html",
        "enquire.html",
        "enquire.main.html",
    )
    news_redirect()


if __name__ == "__main__":
    main()
