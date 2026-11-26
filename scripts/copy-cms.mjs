import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/admin", { recursive: true });
copyFileSync("node_modules/decap-cms/dist/decap-cms.js", "public/admin/decap-cms.js");
