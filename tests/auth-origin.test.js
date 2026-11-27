import assert from "node:assert/strict";
import test from "node:test";
import { authOrigin, cmsBranch, renderCmsConfig, safeOrigin } from "../functions/_lib/origin.js";

const template = `backend:
  name: github
  repo: corbinsharpp/sharp-records-website
  branch: "cursor/cms-dashboard-784c"
  base_url: https://sharp-records-website.pages.dev
  auth_endpoint: api/auth

site_url: https://sharp-records-website.pages.dev
display_url: https://sharp-records-website.pages.dev
`;

test("auth origin follows the request when SITE_AUTH_ORIGIN is blank", () => {
  const request = new Request("https://sharp-records-website.pages.dev/api/auth");
  assert.equal(authOrigin(request, {}), "https://sharp-records-website.pages.dev");
  const live = new Request("https://sharprecords.uk/api/auth");
  assert.equal(authOrigin(live, { SITE_AUTH_ORIGIN: "  " }), "https://sharprecords.uk");
});

test("SITE_AUTH_ORIGIN overrides the request host", () => {
  const request = new Request("https://sharp-records-website.pages.dev/api/auth");
  assert.equal(
    authOrigin(request, { SITE_AUTH_ORIGIN: "https://sharprecords.uk/" }),
    "https://sharprecords.uk",
  );
  assert.equal(safeOrigin("javascript:alert(1)"), "");
});

test("CMS branch defaults to the branch Cloudflare is publishing", () => {
  assert.equal(cmsBranch({}), "cursor/cms-dashboard-784c");
  assert.equal(cmsBranch({ CMS_BRANCH: " main " }), "main");
});

test("rendered dashboard config uses the request origin and branch", () => {
  const yaml = renderCmsConfig(template, {
    origin: "https://sharprecords.uk",
    branch: "cursor/cms-dashboard-784c",
  });
  assert.match(yaml, /base_url: https:\/\/sharprecords\.uk\n/);
  assert.match(yaml, /site_url: https:\/\/sharprecords\.uk\n/);
  assert.match(yaml, /display_url: https:\/\/sharprecords\.uk\n/);
  assert.match(yaml, /branch: "cursor\/cms-dashboard-784c"/);
  assert.doesNotMatch(yaml, /pages\.dev/);
});
