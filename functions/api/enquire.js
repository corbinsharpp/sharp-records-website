import { sameOrigin, validateEnquiry } from "../_lib/validate.js";
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
    type: String(form.get("enquiry-type") || ""),
    name: String(form.get("name") || ""),
    email: String(form.get("email") || ""),
    message: String(form.get("message") || ""),
    demo: String(form.get("demo-link") || ""),
    consent: String(form.get("consent") || ""),
    _gotcha: String(form.get("_gotcha") || ""),
  };

  const result = validateEnquiry(data);
  if (result.spam) return json({ ok: true });
  if (Object.keys(result.errors).length) return json({ ok: false, errors: result.errors }, 400);

  const turnstile = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    String(form.get("cf-turnstile-response") || ""),
    request.headers.get("cf-connecting-ip") || "",
  );
  if (!turnstile.ok) return json({ ok: false, error: "captcha" }, 400);

  if (!env.FORMSPREE_FORM_ID) return json({ ok: false, error: "unconfigured" }, 503);

  const forward = new FormData();
  forward.set("enquiry-type", data.type);
  forward.set("name", data.name.trim());
  forward.set("email", data.email.trim());
  forward.set("message", data.message.trim());
  if (data.demo.trim()) forward.set("demo-link", data.demo.trim());
  forward.set("_replyto", data.email.trim());
  forward.set("_subject", `New Sharp Records enquiry: ${data.type}`);

  const sent = await fetch(`https://formspree.io/f/${env.FORMSPREE_FORM_ID}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: forward,
  });
  if (!sent.ok) return json({ ok: false }, 502);
  return json({ ok: true });
}
