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


/* Compact 15-second waveform preview players */
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

  const trackTitle = (root) => root.dataset.trackTitle || "track";

  let sharedCtx = null;
  let analyser = null;
  const mediaSources = new WeakMap();

  const ensureGraph = (audio) => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx || reduceMotion) return null;
    try {
      if (!sharedCtx) {
        sharedCtx = new Ctx();
        analyser = sharedCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        analyser.connect(sharedCtx.destination);
      }
      if (!mediaSources.has(audio)) {
        const src = sharedCtx.createMediaElementSource(audio);
        src.connect(analyser);
        mediaSources.set(audio, src);
      }
      return analyser;
    } catch {
      return null;
    }
  };

  const setPlaying = (root, playing) => {
    const btn = root.querySelector("[data-preview-btn]");
    if (!btn) return;
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    const title = trackTitle(root);
    btn.setAttribute("aria-label", playing ? `Pause preview of ${title}` : `Play preview of ${title}`);
    root.classList.toggle("is-playing", playing);
    if (!playing) root.style.removeProperty("--live-amp");
  };

  const parsePeaks = (root) => {
    try {
      const raw = JSON.parse(root.getAttribute("data-peaks") || "[]");
      if (Array.isArray(raw) && raw.length) return raw.map((n) => Number(n) || 0);
    } catch {
      /* fall through */
    }
    return Array(72).fill(0.35);
  };

  const renderWave = (root) => {
    const wave = root.querySelector("[data-preview-wave]");
    if (!wave) return [];
    const peaks = parsePeaks(root);
    wave.replaceChildren();
    wave.hidden = false;
    return peaks.map((peak) => {
      const span = document.createElement("span");
      span.className = "preview__bar";
      span.style.setProperty("--peak", String(Math.max(0.08, Math.min(1, peak))));
      span.setAttribute("aria-hidden", "true");
      wave.append(span);
      return span;
    });
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
    const timeEl = root.querySelector("[data-preview-time]");
    const wave = root.querySelector("[data-preview-wave]");
    if (!audio || !btn) return;

    const bars = renderWave(root);
    btn.hidden = false;
    if (timeEl) {
      timeEl.hidden = false;
      timeEl.textContent = "0:00 / 0:15";
    }
    audio.removeAttribute("controls");

    const paint = () => {
      const t = Math.min(audio.currentTime || 0, MAX);
      const progress = bars.length ? t / MAX : 0;
      if (timeEl) timeEl.textContent = `${fmt(t)} / 0:15`;
      bars.forEach((bar, i) => {
        bar.classList.toggle("is-played", (i + 0.5) / bars.length <= progress);
      });
      if (!reduceMotion && analyser && !audio.paused) {
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const amp = Math.min(1, Math.sqrt(sum / buf.length) * 3.4);
        root.style.setProperty("--live-amp", (0.86 + amp * 0.42).toFixed(3));
      }
      if (t >= MAX - 0.05 && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(root, false);
        if (timeEl) timeEl.textContent = "0:00 / 0:15";
        bars.forEach((bar) => bar.classList.remove("is-played"));
      }
    };

    let raf = 0;
    const tick = () => {
      paint();
      if (!audio.paused) raf = requestAnimationFrame(tick);
    };

    const startTick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    btn.addEventListener("click", () => {
      if (audio.paused) {
        pauseOthers(root);
        if (audio.currentTime >= MAX) audio.currentTime = 0;
        setPlaying(root, true);
        ensureGraph(audio);
        if (sharedCtx && sharedCtx.state === "suspended") {
          sharedCtx.resume().catch(() => {});
        }
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => setPlaying(root, false));
        }
        startTick();
      } else {
        audio.pause();
        setPlaying(root, false);
      }
    });

    if (wave) {
      const seekFromEvent = (event) => {
        const rect = wave.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * MAX;
        paint();
      };
      let dragging = false;
      wave.addEventListener("click", seekFromEvent);
      wave.addEventListener("pointerdown", (event) => {
        dragging = true;
        if (wave.setPointerCapture) wave.setPointerCapture(event.pointerId);
        seekFromEvent(event);
      });
      wave.addEventListener("pointermove", (event) => {
        if (dragging) seekFromEvent(event);
      });
      const stopDrag = () => { dragging = false; };
      wave.addEventListener("pointerup", stopDrag);
      wave.addEventListener("pointercancel", stopDrag);
    }

    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      setPlaying(root, false);
      if (timeEl) timeEl.textContent = "0:00 / 0:15";
      bars.forEach((bar) => bar.classList.remove("is-played"));
    });
    audio.addEventListener("pause", () => {
      if (audio.currentTime < MAX - 0.05) setPlaying(root, false);
    });
    audio.addEventListener("play", () => {
      setPlaying(root, true);
      startTick();
    });
  });
})();
