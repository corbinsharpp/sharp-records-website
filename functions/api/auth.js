export async function onRequest({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("GitHub sign-in is not set up yet. Add GITHUB_CLIENT_ID in the hosting settings.", { status: 503 });
  }
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/callback", request.url).toString();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
