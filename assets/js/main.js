/**
 * Sharp Records — progressive enhancement.
 * The site is fully usable without this file.
 */

document.documentElement.classList.add("js");

const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");

if (nav && toggle) {
  nav.dataset.enhanced = "true";
  toggle.hidden = false;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    const label = toggle.querySelector(".nav-toggle-label");
    if (label) label.textContent = open ? "Close" : "Menu";
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!motionQuery.matches && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    el.classList.add("is-visible");
  });
}

/* Enquire form — Formspree, fetch when JS is available. */
const form = document.getElementById("enquire-form");

if (form) {
  const statusSuccess = document.getElementById("form-success");
  const statusError = document.getElementById("form-error");
  const submitBtn = form.querySelector("[type='submit']");
  const fallback = document.getElementById("mailto-fallback");

  // Single config spot: action URL (FORM_ID) and data-mailto on the form.
  if (fallback && form.dataset.mailto) {
    fallback.href = `mailto:${form.dataset.mailto}`;
    fallback.textContent = form.dataset.mailto;
  }

  const fields = {
    type: form.elements.namedItem("enquiry-type"),
    name: form.elements.namedItem("name"),
    email: form.elements.namedItem("email"),
    message: form.elements.namedItem("message"),
    demo: form.elements.namedItem("demo-link"),
    consent: form.elements.namedItem("consent"),
    subject: form.elements.namedItem("_subject"),
    replyto: form.elements.namedItem("_replyto"),
  };

  const showError = (input, on) => {
    const field = input.closest(".field") || input.closest(".consent")?.parentElement;
    if (!field) return;
    field.classList.toggle("is-invalid", on);
    input.setAttribute("aria-invalid", on ? "true" : "false");
  };

  const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validate = () => {
    let ok = true;
    const typeOn = !fields.type.value;
    showError(fields.type, typeOn); ok = ok && !typeOn;

    const nameOn = fields.name.value.trim().length < 2;
    showError(fields.name, nameOn); ok = ok && !nameOn;

    const emailOn = !emailOk(fields.email.value.trim());
    showError(fields.email, emailOn); ok = ok && !emailOn;

    const messageOn = fields.message.value.trim().length < 10;
    showError(fields.message, messageOn); ok = ok && !messageOn;

    const demoVal = fields.demo.value.trim();
    let demoOn = false;
    if (demoVal) {
      try {
        const url = new URL(demoVal);
        demoOn = !/^https?:$/.test(url.protocol);
      } catch {
        demoOn = true;
      }
    }
    showError(fields.demo, demoOn); ok = ok && !demoOn;

    const consentOn = !fields.consent.checked;
    showError(fields.consent, consentOn); ok = ok && !consentOn;

    return ok;
  };

  ["input", "change", "blur"].forEach((evt) => {
    form.addEventListener(evt, (event) => {
      if (event.target && event.target.name) validate();
    });
  });

  const setLoading = (loading) => {
    form.dataset.submitting = loading ? "true" : "false";
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Sending…" : "Send message";
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusError.hidden = true;

    if (!validate()) {
      const first = form.querySelector("[aria-invalid='true']");
      first?.focus();
      return;
    }
    if (form.dataset.submitting === "true") return;

    if (fields.subject) {
      fields.subject.value = `New Sharp Records enquiry: ${fields.type.value}`;
    }
    if (fields.replyto) {
      fields.replyto.value = fields.email.value.trim();
    }

    setLoading(true);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("submit-failed");
      statusSuccess.hidden = false;
      statusError.hidden = true;
      form.querySelectorAll(".form__fields").forEach((el) => {
        el.hidden = true;
      });
      statusSuccess.focus?.();
    } catch {
      statusError.hidden = false;
      statusSuccess.hidden = true;
    } finally {
      setLoading(false);
    }
  });
}
