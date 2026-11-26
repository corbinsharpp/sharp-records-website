# Sharp Records website

The public site is a static build. Words, pictures, releases, artists, events, radio and culture are files in `src/content`, edited in the dashboard at `/admin` (Decap CMS). Astro turns those files into HTML.

British spelling. The contact page is Enquire.

## Preview

```bash
npm install
npm run build
npm run serve
```

Open http://127.0.0.1:4173/

For a live reload while developing:

```bash
npm run dev
```

Open http://127.0.0.1:4321/

## Dashboard on your own computer

Chrome or Edge:

```bash
npm run cms
npm run dev
```

Then open http://127.0.0.1:4321/admin

`npm run cms` is the local bridge. It is only for your computer. The live site does not run it.

## Tests

```bash
npm test
```

## Where things live

- `src/content` — everything Corby can edit
- `src/pages` — page templates
- `public/assets` — fonts, logo, audio, CSS, the small script
- `src/assets/uploads` — pictures uploaded in the dashboard
- `public/admin` — the dashboard
- `functions/api` — enquiry form, newsletter, and GitHub sign-in (Cloudflare Pages)

## Hosting

Cloudflare Pages. Build command `npm run build`, output directory `dist`. The `functions` folder is deployed with the site. Custom domain steps, analytics, Turnstile, Formspree and Buttondown are in `CMS-GUIDE.md`.

Environment variables are listed in `.env.example`. None of them are required for the pages to build.
