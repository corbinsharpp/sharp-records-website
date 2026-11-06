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


/* 15-second release preview players */
(() => {
  const players = Array.from(document.querySelectorAll("[data-preview]"));
  if (!players.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX = 15;

  const fmt = (s) => {
    const t = Math.max(0, Math.min(MAX, s));
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const setPlaying = (root, playing) => {
    const btn = root.querySelector("[data-preview-btn]");
    const label = root.querySelector("[data-preview-label]");
    if (!btn) return;
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (label) label.textContent = playing ? "Pause preview — 0:15" : "Play preview — 0:15";
  };

  const pauseOthers = (except) => {
    players.forEach((root) => {
      if (root === except) return;
      const audio = root.querySelector("[data-preview-audio]");
      if (audio && !audio.paused) audio.pause();
      setPlaying(root, false);
    });
  };

  players.forEach((root) => {
    const audio = root.querySelector("[data-preview-audio]");
    const btn = root.querySelector("[data-preview-btn]");
    const bar = root.querySelector("[data-preview-bar]");
    const timeEl = root.querySelector("[data-preview-time]");
    const progress = root.querySelector("[data-preview-progress]");
    if (!audio || !btn) return;

    // Progressive enhancement: custom button replaces native controls UI
    btn.hidden = false;
    if (timeEl) timeEl.hidden = false;
    if (progress) progress.hidden = false;
    audio.removeAttribute("controls");

    const sync = () => {
      const t = Math.min(audio.currentTime || 0, MAX);
      if (timeEl) timeEl.textContent = fmt(t);
      if (bar) {
        const pct = (t / MAX) * 100;
        if (reduceMotion) bar.style.width = `${pct}%`;
        else bar.style.width = `${pct}%`;
      }
      if (t >= MAX - 0.05) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(root, false);
        if (timeEl) timeEl.textContent = "0:00";
        if (bar) bar.style.width = "0%";
      }
    };

    btn.addEventListener("click", () => {
      if (audio.paused) {
        pauseOthers(root);
        if (audio.currentTime >= MAX) audio.currentTime = 0;
        setPlaying(root, true);
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => setPlaying(root, false));
        }
      } else {
        audio.pause();
        setPlaying(root, false);
      }
    });

    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      setPlaying(root, false);
      if (timeEl) timeEl.textContent = "0:00";
      if (bar) bar.style.width = "0%";
    });
    audio.addEventListener("pause", () => {
      if (audio.currentTime < MAX - 0.05) setPlaying(root, false);
    });
    audio.addEventListener("play", () => setPlaying(root, true));
  });
})();
