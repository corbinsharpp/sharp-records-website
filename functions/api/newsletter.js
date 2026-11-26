import { sameOrigin, validateSubscription } from "../_lib/validate.js";
import { verifyTurnstile } from "../_lib/turnstile.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") return json({ ok: false }, 405);
  if (!sameOrigin(request)) return json({ ok: false }, 403);

  const form = await request.formData();
  const data = {
    email: String(form.get("email") || ""),
    consent: String(form.get("consent") || ""),
    company: String(form.get("company") || ""),
  };
  const result = validateSubscription(data);
  if (result.spam) return json({ ok: true });
  if (Object.keys(result.errors).length) return json({ ok: false, errors: result.errors }, 400);

  const turnstile = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    String(form.get("cf-turnstile-response") || ""),
    request.headers.get("cf-connecting-ip") || "",
  );
  if (!turnstile.ok) return json({ ok: false, error: "captcha" }, 400);
  if (!env.BUTTONDOWN_API_KEY) return json({ ok: false, error: "unconfigured" }, 503);

  const sent = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: data.email.trim(),
      tags: ["website"],
      metadata: { source: "sharprecords.co.uk" },
    }),
  });

  if (sent.status === 400 || sent.status === 409) {
    const body = await sent.json().catch(() => ({}));
    const code = JSON.stringify(body);
    if (/already|exists|duplicate/i.test(code)) {
      return json({ ok: true, already: true });
    }
  }
  if (!sent.ok && sent.status !== 201) return json({ ok: false }, 502);
  return json({ ok: true });
}
