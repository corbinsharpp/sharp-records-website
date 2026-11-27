export async function verifyTurnstile(secret, token, ip) {
  if (!secret) return { ok: false, reason: "missing-secret" };
  if (!token) return { ok: false, reason: "missing-token" };
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => ({}));
  return { ok: Boolean(data.success), reason: data["error-codes"] ? data["error-codes"].join(",") : "" };
}
