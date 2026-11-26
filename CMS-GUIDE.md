# Will I have to pay to run it?

No. The website, the dashboard, the enquiry form, the spam check, analytics and the newsletter all stay on free plans. You do not need a credit card to set them up. Do not enter a card when a site offers a trial: pick the free plan. Nothing here bills you unless you later click an upgrade yourself.

The only expected cost is the domain name **sharprecords.co.uk**. That is the yearly fee charged by the company you registered it with. Attaching the domain to the site is free.

| Service | What it does | Cost now | Free allowance | What would start a charge |
| --- | --- | --- | --- | --- |
| Domain name | The address sharprecords.co.uk | The only expected cost | Connecting it to Cloudflare is free | The registrar’s renewal. Cloudflare does not charge for the connection. |
| Cloudflare Pages | Hosts the site | Free | Unlimited visits and bandwidth. 500 rebuilds a month. Up to 100 domains on the project. | More than 500 rebuilds in a month, which needs a paid Cloudflare plan. Publishing a few times a week stays inside the free allowance. |
| Cloudflare Workers (the small form and sign-in programs) | Sends enquiries, newsletter sign-ups and dashboard login | Free | 100,000 of these requests a day. Ordinary page views do not count. | More than 100,000 of those requests in one day. The paid Workers plan is $5 a month. A label site does not get near this. |
| Decap CMS | The dashboard at /admin | Free | No fee and no per-person charge. It is open source. | Nothing. There is no paid Decap plan to fall into. |
| GitHub | Stores the pages the dashboard saves | Free | A personal account, including a private repository. | GitHub Team or Enterprise. This site does not need either. |
| Cloudflare Turnstile | The “I am a person” check on forms | Free | Unlimited checks. Up to 20 widgets. | An Enterprise contract, sold to large companies. Not needed. |
| Formspree | Emails you each enquiry | Free | 50 enquiries a month. The dashboard keeps 30 days of them. | Enquiry 51 in a calendar month. Formspree stops emailing the extras until next month. A paid plan starts at $10 a month (billed yearly) or $15 a month. You are only charged if you upgrade. |
| Buttondown | The newsletter list | Free | The first 100 people who are actually receiving the email. Their price assumes at most one email a day to the whole list. | Subscriber 101. Their pricing page then shows $9 a month, up to 1,000 people. Extras such as tagging or their own analytics are optional paid add-ons. Leave them off. |
| Google Analytics | Visitor counts, only after someone presses Accept | Free | A normal GA4 property. Standard reports stay available. The finer “Explorations” reports keep detail for 2 or 14 months, which you choose. | Google Analytics 360, an enterprise product. Leave the measurement ID blank and analytics stays off and costs nothing. |

Prices above were taken from each company’s own pricing page in November 2026. Check the page again before you upgrade anything. You can run the label site for years without paying any of them.

# What only you can do

These accounts and keys cannot be invented for you. The site already runs without them. The enquiry form and the newsletter stay switched off, and show the email address instead, until the keys below are pasted in. Analytics stays off until you add a measurement ID. The dashboard on your own computer works before any of this.

Do these in order.

## 1. Put the site on the internet (Cloudflare Pages, free)

1. Create a free account at https://dash.cloudflare.com/sign-up with corbinsharpp@gmail.com.
2. In the Cloudflare dashboard, open **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Choose GitHub, then the repository `corbinsharpp/sharp-records-website`. If GitHub asks permission, allow this repository.
4. Use these build settings:
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Press **Save and Deploy**. The first address will look like `sharp-records.pages.dev`. The dashboard at `/admin` on that address will not sign in until step 3, because GitHub only allows one callback address and yours should be the real domain.

## 2. Connect sharprecords.co.uk

1. In the Pages project, open **Custom domains** → **Set up a custom domain**.
2. Type `www.sharprecords.co.uk` and follow the instructions Cloudflare shows. It will tell you which records to add where the domain is registered.
3. Add `sharprecords.co.uk` (without www) as well, and let Cloudflare redirect it to `www`.
4. Wait until both say **Active**. The site is then at https://www.sharprecords.co.uk/.

## 3. Let the dashboard sign in with GitHub

1. On GitHub, open **Settings** (your user settings, not the repository) → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Fill in:
   - Application name: `Sharp Records site`
   - Homepage URL: `https://www.sharprecords.co.uk`
   - Authorization callback URL: `https://www.sharprecords.co.uk/api/callback`
3. Press **Register application**. Copy the **Client ID**.
4. Press **Generate a new client secret**. Copy the secret straight away. GitHub will not show it again.
5. In Cloudflare Pages → your project → **Settings** → **Variables and Secrets**, add:
   - `GITHUB_CLIENT_ID` = the Client ID
   - `GITHUB_CLIENT_SECRET` = the secret (mark this one as a secret / encrypted)
6. Press **Save**, then **Deployments** → **Retry deployment** on the latest build so the new values are used.
7. Open https://www.sharprecords.co.uk/admin and press **Login with GitHub**. Use the GitHub account that owns the repository.

## 4. Enquiry form: spam check and delivery

The form will not send until both of these exist. Visitors can still email corbinsharpp@gmail.com.

**Cloudflare Turnstile (the “I am a person” check, free)**

1. In the Cloudflare dashboard open **Turnstile** → **Add widget**.
2. Widget name: `Sharp Records`. Domains: `sharprecords.co.uk` and `www.sharprecords.co.uk`.
3. Widget mode: Managed. Press **Create**.
4. Copy the **Site key** and the **Secret key**.

**Formspree (delivers the enquiry to your inbox, free tier)**

1. Sign up at https://formspree.io/ with corbinsharpp@gmail.com.
2. Create a form. Copy the form ID, the short code at the end of an address like `https://formspree.io/f/abcdwxyz` (that example is not yours).

**Paste them in Cloudflare** → Pages project → **Settings** → **Variables and Secrets**:

- `PUBLIC_TURNSTILE_SITE_KEY` = the Turnstile site key
- `TURNSTILE_SECRET_KEY` = the Turnstile secret (encrypted)
- `FORMSPREE_FORM_ID` = the Formspree form ID

`PUBLIC_` values are baked in when the site is built. After saving, open **Deployments** and retry the latest deployment. Then send yourself a test enquiry.

## 5. Newsletter (Buttondown, free for the first 100 subscribers)

Addresses are **not** stored in the website dashboard. They would otherwise be saved in GitHub, where other people could read them. Buttondown keeps the list, sends a confirmation email, and puts an unsubscribe link on every message. You export the list and remove people from the Buttondown site, not from the Sharp dashboard.

1. Create a free account at https://buttondown.com/ with corbinsharpp@gmail.com.
2. Open **Settings** → **API** (or https://buttondown.com/settings/api) and create an API key. Copy it.
3. In Cloudflare, add `BUTTONDOWN_API_KEY` as an encrypted secret.
4. Retry the deployment.
5. Subscribe with your own email and confirm the message Buttondown sends. Until someone confirms, they are not on the list.
6. To export or remove someone later: Buttondown → **Subscribers**.

The wording of the newsletter box is edited in the Sharp dashboard under **Settings**.

## 6. Google Analytics, only after someone accepts cookies

1. Go to https://analytics.google.com/ and create an account and a **GA4** property for Sharp Records. The site address is `https://www.sharprecords.co.uk`.
2. Add a **Web** data stream for that address.
3. Copy the Measurement ID. It looks like `G-` followed by letters and numbers.
4. In Cloudflare, add `PUBLIC_GA_MEASUREMENT_ID` with that value.
5. Retry the deployment.

Nothing from Google loads until a visitor presses **Accept** on the cookie banner. **Reject** does not load it. Leave the variable empty if you do not want analytics.

## 7. Read the privacy page

Open **Privacy** in the dashboard. Replace every note in square brackets. Do not type a company number, a street address or an ICO number you do not have. When it says what you actually do, tick **I have reviewed this page**, set the status to **Ready**, and press **Publish**.

## Working on the dashboard before the domain is connected

On your own computer, in this project folder:

```bash
npm install
npm run cms
```

Leave that running. In a second window:

```bash
npm run dev
```

Open http://127.0.0.1:4321/admin in Chrome, Edge or Firefox. With `npm run cms` running, the dashboard opens straight away. There is no password on your own computer. Do not leave `npm run cms` running on a shared network.

## Using the dashboard

The address on the live site is https://www.sharprecords.co.uk/admin. Sign in with GitHub once the OAuth app from the steps above exists.

The left-hand list is the kind of thing you are editing:

- **Releases** — records, artwork, tracklists, listening links
- **Artists** — names, biographies, photographs
- **Events** — dates and ticket links
- **Radio** — mixes and episodes
- **Culture** — articles
- **Homepage** — the front page wording and which release and artist are featured
- **About** — the manifesto
- **Section pages** — the introduction at the top of each page
- **Settings** — email address, the scrolling words, social links, newsletter wording
- **Privacy** — the privacy page

### Save a draft, publish, change, or delete

These buttons are at the top of an entry.

1. **Save** keeps a draft. It is not on the website.
2. When you want it on the website, open the status menu (it says **Status: Draft**), choose **Ready**, then press **Publish** and confirm.
3. To change something that is already live, open it, edit, press **Save**, set the status to **Ready** again, then **Publish**.
4. **Delete unpublished entry** throws away a draft. **Delete published entry** removes it from the website. **Unpublish** takes a live entry back to a draft.

Publishing takes a minute. Cloudflare rebuilds the site after you publish. Refresh the page if you do not see the change straight away.

Pictures show a preview in the form after they upload. Every picture needs the description underneath it. That description is for someone who cannot see the picture. The form will not publish a release or an artist without it.

### Add a release

1. Open **Releases** → **New Release**.
2. Fill in the title, catalogue number (SR002, SR003, …), format and artist. Add the artist first if they are not in the list.
3. Write the paragraph. Upload the cover. You should see the picture appear in the form. Fill in **Description of the cover**.
4. Under **Tracks**, press **Add** for each track, in order. A 15-second MP3 preview gives the vinyl play button. Leave the preview blank if you do not have one.
5. Bandcamp, SoundCloud, Spotify, Mixcloud and YouTube are optional. Paste the link, or the embed code the site gives you. Leave the rest blank.
6. Save as a draft, check it, then publish as above.

### Add or remove an artist

1. **Artists** → **New Artist**.
2. Name, city, a few words of style, photograph, description of the photograph, and the biography.
3. Publish when it is ready.
4. To remove someone, open their entry and press **Delete published entry**. Their release can stay in the catalogue.

### Add an event and a ticket link

1. **Events** → **New Event**.
2. Name, start time in the form `2027-03-20T22:00:00+00:00` (use `+01:00` during British Summer Time), city and venue.
3. Tick **Still a placeholder** if the room is not confirmed.
4. When tickets exist, paste the full ticket URL, starting with `https://`. If you leave it blank, the site says “Details forthcoming”.
5. Publish.

### Upload a radio episode or mix

1. **Radio** → **New Episode**.
2. For a full mix, paste a SoundCloud, Mixcloud, YouTube, Spotify or Bandcamp link. That is the reliable way. A file bigger than 100MB will be rejected.
3. A shorter file can go in **Audio file**.
4. Add a cover and a description of the cover if you have a picture.
5. Publish. Until at least one episode is published, the Radio page keeps the “forthcoming” note.

### Publish a culture article

1. **Culture** → **New Article**.
2. Headline, summary, and the article itself. Add a picture and its description if you have one.
3. Tick **Show on the homepage** if it should appear on the front page. Position `1` appears first.
4. Publish.

### Edit the homepage, social links, and the newsletter sentence

- **Homepage** changes the slogan lines, the section headings, and which release and artist are featured. The manifesto text is under **About**, and the homepage uses that same text.
- **Settings** → **Social links**. Press **Add** only for a profile that really exists. Leave the list empty if you do not want any.
- The newsletter heading, sentence and tick-box wording are in **Settings** too. The list of subscribers is in Buttondown, not here. See the setup steps above.

Do not invent gigs, quotes or profile links to fill space. An empty list is fine.

