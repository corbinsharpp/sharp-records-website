import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = (process.env.PUBLIC_SITE_URL || "https://sharprecords.uk").replace(/\/$/, "");

export default defineConfig({
  site,
  output: "static",
  build: { format: "file" },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/news") && !page.includes("/admin"),
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/") {
          url.pathname = `${url.pathname.replace(/\/$/, "")}.html`;
        }
        item.url = url.href;
        return item;
      },
    }),
  ],
});
