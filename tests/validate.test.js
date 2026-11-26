import assert from "node:assert/strict";
import test from "node:test";
import { validateEnquiry, validateSubscription } from "../functions/_lib/validate.js";

test("enquiry rejects an empty submission", () => {
  const result = validateEnquiry({ type: "", name: "", email: "", message: "", demo: "", consent: "" });
  assert.equal(result.spam, false);
  assert.ok(result.errors.type);
  assert.ok(result.errors.email);
  assert.ok(result.errors.consent);
});

test("enquiry accepts a proper message and rejects a bad demo link", () => {
  const bad = validateEnquiry({
    type: "Press",
    name: "Test Person",
    email: "test@example.com",
    message: "I would like to ask about a booking.",
    demo: "notaurl",
    consent: "yes",
  });
  assert.ok(bad.errors.demo);

  const good = validateEnquiry({
    type: "Press",
    name: "Test Person",
    email: "test@example.com",
    message: "I would like to ask about a booking.",
    demo: "https://soundcloud.com/example/demo",
    consent: "yes",
  });
  assert.deepEqual(good.errors, {});
});

test("honeypot is treated as spam and not as a validation error", () => {
  const result = validateEnquiry({
    type: "Press",
    name: "Test Person",
    email: "test@example.com",
    message: "I would like to ask about a booking.",
    demo: "",
    consent: "yes",
    _gotcha: "bot",
  });
  assert.equal(result.spam, true);
});

test("newsletter requires a real email and consent", () => {
  const missing = validateSubscription({ email: "nope", consent: "" });
  assert.ok(missing.errors.email);
  assert.ok(missing.errors.consent);
  const ok = validateSubscription({ email: "listener@example.com", consent: "yes" });
  assert.deepEqual(ok.errors, {});
});
