const DEFAULT_BRANCH = "cursor/cms-dashboard-784c";

export function safeOrigin(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

/** The host that must match the GitHub OAuth callback. Blank SITE_AUTH_ORIGIN means the host of this request. */
export function authOrigin(request, env) {
  return safeOrigin(env?.SITE_AUTH_ORIGIN) || new URL(request.url).origin;
}

export function cmsBranch(env) {
  const branch = typeof env?.CMS_BRANCH === "string" ? env.CMS_BRANCH.trim() : "";
  return branch || DEFAULT_BRANCH;
}

export function renderCmsConfig(template, { origin, branch }) {
  return template
    .replace(/^  branch:\s*.*$/m, `  branch: "${branch}"`)
    .replace(/^  base_url:\s*.*$/m, `  base_url: ${origin}`)
    .replace(/^site_url:\s*.*$/m, `site_url: ${origin}`)
    .replace(/^display_url:\s*.*$/m, `display_url: ${origin}`);
}
