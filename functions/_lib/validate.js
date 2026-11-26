const TYPES = ["Bookings", "Demo submission", "Press", "Licensing/Sync", "Other"];

export function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function httpUrlOk(value) {
  if (!value || !String(value).trim()) return true;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEnquiry(data) {
  const errors = {};
  if (String(data._gotcha || "").trim()) return { spam: true, errors };
  if (!TYPES.includes(data.type)) errors.type = "Please choose an enquiry type.";
  if (String(data.name || "").trim().length < 2 || String(data.name || "").length > 200) {
    errors.name = "Please enter your name.";
  }
  if (!emailOk(data.email) || String(data.email || "").length > 320) {
    errors.email = "Please enter a valid email address.";
  }
  const message = String(data.message || "").trim();
  if (message.length < 10) errors.message = "Please write a message of at least a few words.";
  if (message.length > 5000) errors.message = "Please shorten the message.";
  if (!httpUrlOk(data.demo)) errors.demo = "Please enter a full URL starting with http:// or https://.";
  if (data.consent !== "yes") errors.consent = "Please confirm you are happy for us to use your details to reply.";
  return { spam: false, errors };
}

export function validateSubscription(data) {
  const errors = {};
  if (String(data.company || data._gotcha || "").trim()) return { spam: true, errors };
  if (!emailOk(data.email) || String(data.email || "").length > 320) {
    errors.email = "Please enter a valid email address.";
  }
  if (data.consent !== "yes") errors.consent = "Please tick the box if you want the email.";
  return { spam: false, errors };
}

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
