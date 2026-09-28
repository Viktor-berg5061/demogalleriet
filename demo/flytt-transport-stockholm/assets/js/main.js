/* ==========================================================================
   Flytt & Transport Stockholm — main.js
   Formulärets endpoint ligger i FORM_ENDPOINT nedan. Ändra bara här.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. FORM_ENDPOINT — hit skickas offertförfrågningar (JSON + urlencoded POST)
   Byt till kundens egen endpoint vid leverans (Formspree, e-posttjänst, eget
   API eller CRM). Demoversionen pekar på vår lokala lead-server.
   -------------------------------------------------------------------------- */
const FORM_ENDPOINT = "http://127.0.0.1:8787/lead"; // <-- KUNDENS ENDPOINT

/* Sajtnyckel: måste finnas i lead-serverns ALLOWED_SITE_KEYS, annars hamnar
   leadet i serverns standardlista. Byt här om sajten byter namn. */
const LEAD_SITE_KEY = "flytt-transport-stockholm";

const CONTACT = {
  phoneDisplay: "070-000 00 00",
  phoneHref: "tel:+46700000000",
  email: "info@exempel.se"
};

document.documentElement.classList.add("js");

/* --------------------------------------------------------------------------
   2. Mobilmeny — öppna/stäng via knapp, backdrop, Escape och länkklick
   -------------------------------------------------------------------------- */
(function mobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const closeBtn = document.querySelector(".nav__close");
  if (!toggle || !nav || !backdrop) return;

  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    nav.classList.add("is-open");
    backdrop.classList.add("is-open");
    backdrop.hidden = false;
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    const first = nav.querySelector("a, button");
    if (first) first.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    nav.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    window.setTimeout(() => { if (!nav.classList.contains("is-open")) backdrop.hidden = true; }, 220);
    if (returnFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => {
    nav.classList.contains("is-open") ? close(true) : open();
  });
  backdrop.addEventListener("click", () => close(true));
  if (closeBtn) closeBtn.addEventListener("click", () => close(true));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => close(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) close(true);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1000 && nav.classList.contains("is-open")) close(false);
  });
})();

/* --------------------------------------------------------------------------
   3. Header-skugga vid scroll (headern är alltid synlig och klickbar)
   -------------------------------------------------------------------------- */
(function headerShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* --------------------------------------------------------------------------
   4. Offertformulär — riktig POST + tydligt kvitto/feilläge (aria-live)
   -------------------------------------------------------------------------- */
(function offertForm() {
  const form = document.querySelector("form[data-lead-form]");
  if (!form) return;
  const status = form.querySelector(".form__status");
  const submit = form.querySelector('[type="submit"]');

  function setStatus(kind, html) {
    if (!status) return;
    status.className = "form__status is-" + kind;
    status.innerHTML = html;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    data.site = LEAD_SITE_KEY;
    data.sida = window.location.href;
    data.skickat = new Date().toISOString();

    const original = submit ? submit.textContent : "";
    form.classList.add("is-sending");
    if (submit) { submit.disabled = true; submit.textContent = "Skickar …"; }
    setStatus("ok", "Skickar din förfrågan …");

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      setStatus("ok", "<strong>Tack! Vi har din förfrågan.</strong> En flyttledare ringer dig inom en arbetsdag och bokar den kostnadsfria flyttkollen. Akut? Ring " + CONTACT.phoneDisplay + ".");
      if (typeof window.flyttLeadOk === "function") window.flyttLeadOk(data);
    } catch (err) {
      // Fallback: skicka som urlencoded (vissa e-posttjänster tar inte JSON) och
      // visa telefonnumret om det ändå inte går vägen.
      let ok = false;
      try {
        const body = new URLSearchParams(data).toString();
        const res2 = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
        ok = res2.ok;
      } catch (e2) { ok = false; }

      if (ok) {
        form.reset();
        setStatus("ok", "<strong>Tack! Vi har din förfrågan.</strong> En flyttledare ringer dig inom en arbetsdag.");
      } else {
        setStatus("err", "<strong>Kunde inte skicka just nu.</strong> Ring " + CONTACT.phoneDisplay + " eller mejla " + CONTACT.email + " så hjälper vi dig direkt.");
      }
    } finally {
      form.classList.remove("is-sending");
      if (submit) { submit.disabled = false; submit.textContent = original; }
      if (status) status.focus({ preventScroll: true });
    }
  });
})();

/* --------------------------------------------------------------------------
   5. Scroll-reveal — sekter tonar in en gång (respekterar reduced motion)
   -------------------------------------------------------------------------- */
(function reveal() {
  const items = Array.from(document.querySelectorAll(".reveal"));
  if (!items.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      window.setTimeout(() => el.classList.add("is-visible"), Math.min(i * 60, 180));
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  items.forEach((el) => io.observe(el));

  // Säkerhetsnät: allt som ligger i viewport vid load ska vara synligt direkt.
  window.addEventListener("load", () => {
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-visible");
    });
  });
})();

/* --------------------------------------------------------------------------
   6. Mobil CTA-rad — göms medan offertformuläret är i vyn
   -------------------------------------------------------------------------- */
(function mobileCta() {
  const bar = document.querySelector(".mobile-cta");
  const offer = document.getElementById("offert");
  if (!bar) return;
  if (!offer || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => bar.classList.toggle("is-hidden", e.isIntersecting));
  }, { threshold: 0.12 });
  io.observe(offer);
})();

/* --------------------------------------------------------------------------
   7. Datumfält: dagens datum som minsta valbara (inga flyttar i det förflutna)
   -------------------------------------------------------------------------- */
(function dateMin() {
  const input = document.querySelector('input[type="date"]');
  if (!input) return;
  const t = new Date();
  const iso = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  input.min = iso;
})();
