const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const pages = [
  "index.html",
  "releases.html",
  "artists.html",
  "events.html",
  "radio.html",
  "culture.html",
  "about.html",
  "enquire.html",
];

const navLabels = ["Releases", "Artists", "Events", "Radio", "Culture", "About", "Enquire"];

function attachConsole(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

async function fillValid(page, extras = {}) {
  await page.selectOption("#enquiry-type", extras.type || "Bookings");
  await page.fill("#name", extras.name || "Test Person");
  await page.fill("#email", extras.email || "test@example.com");
  await page.fill("#message", extras.message || "I would like to ask about a booking.");
  if (extras.demo !== undefined) {
    await page.fill("#demo-link", extras.demo);
  }
  if (extras.consent !== false) {
    await page.check("#consent");
  }
}

test.describe("primary and footer navigation", () => {
  for (const p of pages) {
    test(`nav, Enquire spelling and no console errors on ${p}`, async ({ page }) => {
      const errors = attachConsole(page);
      const res = await page.goto(`/${p}`, { waitUntil: "networkidle" });
      expect(res, `missing response for ${p}`).toBeTruthy();
      expect(res.status(), `${p} should be 200`).toBe(200);

      const nav = page.getByRole("navigation", { name: "Primary" });
      for (const label of navLabels) {
        await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
      }
      await expect(nav.getByRole("link", { name: /^Inquire$/ })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: /^Enquiry$/ })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: /^Enquirer$/ })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: /^News$/ })).toHaveCount(0);

      const footerNav = page.getByRole("navigation", { name: "Footer" });
      for (const label of navLabels) {
        await expect(footerNav.getByRole("link", { name: label, exact: true })).toBeVisible();
      }

      const footer = page.getByRole("contentinfo");
      await expect(footer.getByRole("link", { name: "Enquire", exact: true }).first()).toBeVisible();

      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") || ""));
      expect(hrefs.some((h) => /inquire\.html/i.test(h)), `${p} must not link to inquire.html`).toBeFalsy();
      expect(hrefs.some((h) => /about\.html/i.test(h)), `${p} should link to about.html`).toBeTruthy();

      expect(errors, `${p} console/page errors`).toEqual([]);
    });
  }
});

test("Enquire page title, heading and meta use British spelling", async ({ page }) => {
  await page.goto("/enquire.html");
  await expect(page).toHaveTitle(/^Enquire \| Sharp Records$/);
  await expect(page.getByRole("heading", { level: 1, name: "Enquire", exact: true })).toBeVisible();
  const title = await page.title();
  expect(title).not.toMatch(/Inquire|Enquirer|Enquiry/);
});

test("mobile nav toggle opens, labels Enquire, and closes on Escape", async ({ page }) => {
  const errors = attachConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  const toggle = page.locator("[data-nav-toggle]");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-label", "Open menu");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Enquire", exact: true })).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Close menu");
  await expect(nav.getByRole("link", { name: "Enquire", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-label", "Open menu");
  await expect(nav.getByRole("link", { name: "Enquire", exact: true })).toBeHidden();
  expect(errors).toEqual([]);
});

test("mobile nav link to Enquire navigates and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/releases.html", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Enquire", exact: true }).click();
  await expect(page).toHaveURL(/enquire\.html$/);
  await expect(page.getByRole("heading", { level: 1, name: "Enquire" })).toBeVisible();
});

test("Listen now goes to the SR001 release", async ({ page }) => {
  const errors = attachConsole(page);
  await page.goto("/index.html");
  await page.getByRole("link", { name: "Listen now" }).first().click();
  await expect(page).toHaveURL(/releases\.html#sr001/);
  await expect(page.locator("#sr001")).toBeVisible();
  expect(errors).toEqual([]);
});

test("footer Enquire link reaches the form", async ({ page }) => {
  await page.goto("/culture.html");
  await page.getByRole("contentinfo").getByRole("link", { name: "Enquire", exact: true }).first().click();
  await expect(page).toHaveURL(/enquire\.html$/);
  await expect(page.locator("#enquire-form")).toBeVisible();
});

test("no 404s for same-origin links and assets", async ({ page, request, baseURL }) => {
  const seen = new Set();
  const broken = [];
  for (const p of pages) {
    const res = await page.goto(`/${p}`, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) broken.push(`${p} -> ${res && res.status()}`);
    const urls = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("a[href], link[href], img[src], script[src]").forEach((el) => {
        const raw = el.getAttribute("href") || el.getAttribute("src");
        if (raw) out.push(el.href || el.src || raw);
      });
      return out;
    });
    for (const url of urls) {
      if (!url.startsWith(baseURL)) continue;
      const clean = url.split("#")[0];
      if (seen.has(clean)) continue;
      seen.add(clean);
      const asset = await request.get(clean);
      if (asset.status() >= 400) broken.push(`${clean} -> ${asset.status()}`);
    }
  }
  expect(broken, broken.join("\n")).toEqual([]);
});

test("site files include the new pages and British Enquire spelling", async () => {
  const root = path.join(__dirname, "..");
  expect(fs.existsSync(path.join(root, "about.html"))).toBeTruthy();
  expect(fs.existsSync(path.join(root, "radio.html"))).toBeTruthy();
  expect(fs.existsSync(path.join(root, "culture.html"))).toBeTruthy();
  expect(fs.existsSync(path.join(root, "enquire.html"))).toBeTruthy();
  expect(fs.existsSync(path.join(root, "inquire.html"))).toBeFalsy();
});

test("news.html redirects to culture", async ({ page }) => {
  await page.goto("/news.html", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/culture\.html/);
  await expect(page.getByRole("heading", { level: 1, name: "Culture" })).toBeVisible();
});

test.describe("enquire form", () => {
  test("empty submit shows validation errors and does not post", async ({ page }) => {
    const posts = [];
    await page.route("https://formspree.io/**", (route) => {
      posts.push(route.request().url());
      return route.abort();
    });
    await page.goto("/enquire.html");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("#enquiry-type")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#message")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#consent")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Please choose an enquiry type.")).toBeVisible();
    await expect(page.locator("#form-success")).toBeHidden();
    expect(posts).toEqual([]);
  });

  test("invalid email and demo URL are flagged", async ({ page }) => {
    await page.route("https://formspree.io/**", (route) => route.abort());
    await page.goto("/enquire.html");
    await fillValid(page, { email: "not-an-email", demo: "notaurl" });
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#demo-link")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Please enter a full URL starting with http:// or https://.")).toBeVisible();
  });

  test("mocked Formspree success hides the fields", async ({ page }) => {
    const errors = attachConsole(page);
    let posted = null;
    await page.route("https://formspree.io/f/**", async (route) => {
      posted = {
        method: route.request().method(),
        headers: route.request().headers(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto("/enquire.html");
    await fillValid(page, { type: "Press", demo: "https://soundcloud.com/example/demo" });
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("#form-success")).toBeVisible();
    await expect(page.getByText("Thank you. Your enquiry has been sent")).toBeVisible();
    await expect(page.locator(".form__fields")).toBeHidden();
    expect(posted).toBeTruthy();
    expect(posted.method).toBe("POST");
    expect(posted.headers.accept).toMatch(/application\/json/);
    expect(errors).toEqual([]);
  });

  test("mocked Formspree error shows the fallback message", async ({ page }) => {
    const errors = attachConsole(page);
    await page.route("https://formspree.io/f/**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "fail" }),
      });
    });
    await page.goto("/enquire.html");
    await fillValid(page);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("#form-error")).toBeVisible();
    await expect(page.getByText("Sorry — the message could not be sent just now")).toBeVisible();
    await expect(page.locator(".form__fields")).toBeVisible();
    await expect(page.locator("#mailto-fallback")).toHaveAttribute("href", "mailto:corbinsharpp@gmail.com");
    const unexpected = errors.filter((e) => !/Failed to load resource.*400/.test(e));
    expect(unexpected).toEqual([]);
  });
});
