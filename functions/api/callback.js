import { authOrigin } from "../_lib/origin.js";

function page(message) {
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<meta charset="utf-8">
<title>Sharp Records sign-in</title>
<script>
  const allowed = window.location.origin;
  const message = ${JSON.stringify(message)};
  window.addEventListener("message", (event) => {
    if (event.origin !== allowed || event.source !== window.opener) return;
    if (event.data !== "authorizing:github") return;
    window.opener.postMessage(message, allowed);
  });
  if (window.opener) window.opener.postMessage("authorizing:github", allowed);
</script>
<p>You can close this window.</p>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "Set-Cookie": "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers.get("Cookie") || "";
  const stored = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];
  if (!state || state !== stored) return new Response("Sign-in could not be checked. Close this window and try again.", { status: 403 });

  if (!code || url.searchParams.get("error")) {
    return page(`authorization:github:error:${JSON.stringify({ message: url.searchParams.get("error") || "missing code" })}`);
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${authOrigin(request, env)}/api/callback`,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    return page(`authorization:github:error:${JSON.stringify({ message: data.error_description || data.error || "GitHub did not return a token" })}`);
  }
  return page(`authorization:github:success:${JSON.stringify({ token: data.access_token, provider: "github" })}`);
}
