import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/admin", { recursive: true });
copyFileSync("node_modules/decap-cms/dist/decap-cms.js", "public/admin/decap-cms.js");
copyFileSync("public/admin/config.yml", "public/admin/decap-config.yml");
