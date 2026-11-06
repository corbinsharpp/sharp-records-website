# Sharp Records website — setup

Static HTML, CSS and a small progressive-enhancement script. No build step.

## Local preview

From this folder:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open http://127.0.0.1:4173/

## Contact form (Formspree)

Edit **one** place: `enquire.html`.

1. Sign up to [Formspree](https://formspree.io/) with corbinsharpp@gmail.com and copy the form ID.
2. In the HTML comment labelled `CONTACT CONFIG`, replace `FORM_ID` in the form `action`:

   `action="https://formspree.io/f/FORM_ID"`

The mailto fallback is already set to `corbinsharpp@gmail.com` in the form’s `data-mailto` attribute and in the visible `mailto:` link. JavaScript keeps that link in sync from `data-mailto`.

The script posts with `Accept: application/json`, sets `_replyto` from the visitor’s email, and sets `_subject` to `New Sharp Records enquiry: {enquiry type}`. A hidden `_gotcha` field is the honeypot.

Until a real Formspree ID is in place, submissions from the live file will fail and the on-page error (plus the mailto fallback) will show.

## Tests

```bash
npm install
npx playwright install chromium
npm test
```

Playwright serves the folder itself, intercepts Formspree, and never hits the real endpoint.

