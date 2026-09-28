/* ============================================================
   Snickeri & Bygg Stockholm — main.js
   Vanilla JS. No dependencies.

   LEAD ENDPOINT (configure here — all form submissions POST here):
   ============================================================ */
const LEAD_ENDPOINT = "http://127.0.0.1:8787/lead";
/* Site key sent with every lead so the shared lead backend stores this
   site's leads under its own file (snickeri-bygg-stockholm.jsonl). */
const LEAD_SITE = "snickeri-bygg-stockholm";

/* ------------------------------------------------------------
   0. Reveal failsafe — content must NEVER stay invisible.
   The hidden pre-state is only active while JS is confirmed and
   before this timer fires; a full-page screenshot or a crawler
   always sees the content after load.
   ------------------------------------------------------------ */
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  var force = function () {
    els.forEach(function (el) { el.classList.add("is-visible"); });
  };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
    window.setTimeout(force, 1000);
    window.addEventListener("load", function () { window.setTimeout(force, 300); });
  } else {
    force();
  }
})();

/* ------------------------------------------------------------
   0b. Lazy-image failsafe — force-load below-fold images shortly
   after load. Real users keep loading="lazy" (fast first paint);
   full-page screenshots and AI crawlers still see every image.
   ------------------------------------------------------------ */
(function () {
  var forceLazy = function () {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        img.loading = "eager";
        var src = img.getAttribute("src");
        if (src) img.setAttribute("src", src);
      } catch (e) { /* noop */ }
    });
  };
  window.setTimeout(forceLazy, 1600);
  window.addEventListener("load", function () { window.setTimeout(forceLazy, 500); });
})();

/* ------------------------------------------------------------
   1. Sticky header state
   ------------------------------------------------------------ */
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ------------------------------------------------------------
   2. Mobile menu toggle
   Burger + dedicated 44px close button + backdrop + Escape.
   Accessible behavior:
   - opening moves focus to the close button;
   - closing returns focus to the burger;
   - while open, Tab/Shift+Tab stay inside the drawer (focus trap);
   - Escape closes and restores focus.
   ------------------------------------------------------------ */
(function () {
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav-links");
  var backdrop = document.getElementById("nav-backdrop");
  var closeBtn = document.getElementById("nav-close");
  if (!burger || !nav) return;

  var lastFocus = null;
  var focusables = function () {
    if (!nav) return [];
    return Array.prototype.slice.call(
      nav.querySelectorAll('a[href], button:not([disabled])')
    ).filter(function (el) { return el.offsetParent !== null || el === closeBtn || el.classList.contains('drawer-brand'); });
  };

  var setOpen = function (open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Stäng meny" : "Öppna menyn");
    burger.setAttribute("aria-hidden", open ? "true" : "false");
    document.body.classList.toggle("no-scroll", open);
    /* Round 8: body.nav-open drives the "one close affordance" CSS rule
       (burger hidden, ✕ close button shown). */
    document.body.classList.toggle("nav-open", open);
    if (backdrop) backdrop.classList.toggle("visible", open);
    if (open) {
      lastFocus = document.activeElement;
      if (closeBtn) { closeBtn.focus(); }
      else { var first = focusables()[0]; if (first) first.focus(); }
    } else {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      /* Round 9: collapse any open drops when the drawer closes so it
         always opens fresh (drop collapsed) on the next visit. */
      document.querySelectorAll(".has-drop.open").forEach(function (li) {
        li.classList.remove("open");
        var a = li.querySelector(":scope > a");
        if (a) a.setAttribute("aria-expanded", "false");
      });
    }
  };

  /* Round 9: drawer drop toggle — tap Tjänster to expand/collapse on
     mobile (<=1024px); on larger screens the link keeps its normal href
     behavior and the desktop hover CSS shows the drop. */
  nav.querySelectorAll(".has-drop > a").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (window.innerWidth > 1024) return;
      e.preventDefault();
      var open = a.parentNode.classList.toggle("open");
      a.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  burger.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
  if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); return; }
    if (e.key !== "Tab" || !nav.classList.contains("open")) return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

/* ------------------------------------------------------------
   2b. Sticky mobile CTA — hide when scrolling down, show on
   scroll up; never blocks the form/footer while consuming content.
   ------------------------------------------------------------ */
(function () {
  var lastY = window.scrollY || 0;
  var ticking = false;
  var HIDE_AFTER = 90;
  var update = function () {
    var y = window.scrollY || 0;
    var delta = y - lastY;
    if (y < 12) {
      document.body.classList.remove("cta-scrolled");
    } else if (delta > 4) {
      document.body.classList.add("cta-scrolled");
    } else if (delta < -4) {
      document.body.classList.remove("cta-scrolled");
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();

/* ------------------------------------------------------------
   3. Footer accordions — collapse on mobile, expand on desktop
   ------------------------------------------------------------ */
(function () {
  var accs = Array.prototype.slice.call(document.querySelectorAll(".footer-acc"));
  if (!accs.length) return;
  var apply = function () {
    var mobile = window.innerWidth <= 720;
    accs.forEach(function (acc) {
      if (mobile) { acc.removeAttribute("open"); }
      else { acc.setAttribute("open", "open"); }
    });
  };
  apply();
  window.addEventListener("resize", apply, { passive: true });
})();

/* ------------------------------------------------------------
   4. Contact form — POST to LEAD_ENDPOINT (see top of file).
   - honeypot field: bots that fill it get a fake success and NO
     network request (lead is silently dropped);
   - success panel only after a real 2xx from the backend;
   - errors show an inline message, never a fake "Tack".
   ------------------------------------------------------------ */
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalLabel = submitBtn ? submitBtn.innerHTML : "";

  var setStatus = function (cls, html) {
    if (!status) return;
    status.className = "form-status " + cls;
    status.innerHTML = html;
    status.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // Round 6 a11y: after a real success, move focus into the live region
    // so screen readers announce it (region already has role/aria-live —
    // do not duplicate). Focus only for the ok state.
    if (cls === "ok") {
      status.setAttribute("tabindex", "-1");
      status.focus({ preventScroll: true });
    }
  };

  /* ---- Round 12: per-field inline validation (name/phone/email) ----
     On blur each required field is checked; on input it live re-validates.
     Invalid fields get .is-invalid + .has-error + aria-invalid="true" and a
     <small class="field-error" id="<field>-error"> message with a Swedish
     text. #service and #message stay optional. */
  var fieldRules = [
    { id: "name",  msg: "Fyll i ditt namn." },
    { id: "phone", msg: "Fyll i ditt telefonnummer." },
    { id: "email", msg: "Ange en giltig e-postadress." }
  ];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---- Round 19 (head dir 6): GDPR consent checkbox (required) ----
     If the page ships a consent checkbox, it must be checked before any
     network request fires. Shows an inline error on the group, never a
     fake success. Completely skipped when the control is absent, so the
     verified money path is untouched on pages without the checkbox. */
  var gdprInput = form.querySelector('input[name="gdpr"]');
  var gdprValid = function () {
    if (!gdprInput) return true;
    var group = gdprInput.closest(".form-group");
    var err = document.getElementById("gdpr-error");
    if (gdprInput.checked) {
      if (group) group.classList.remove("has-error");
      if (err && err.parentNode) err.parentNode.removeChild(err);
      return true;
    }
    gdprInput.setAttribute("aria-invalid", "true");
    if (group) group.classList.add("has-error");
    if (!err) {
      err = document.createElement("small");
      err.className = "field-error";
      err.id = "gdpr-error";
      (group || form).appendChild(err);
    }
    err.textContent = "Du måste godkänna att vi kontaktar dig för att skicka förfrågan.";
    return false;
  };
  if (gdprInput) {
    gdprInput.addEventListener("change", function () {
      if (gdprInput.checked) {
        gdprInput.setAttribute("aria-invalid", "false");
        gdprValid();
      }
    });
  }

  var showFieldError = function (input, msg) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    var group = input.closest(".form-group");
    if (group) group.classList.add("has-error");
    var err = document.getElementById(input.id + "-error");
    if (!err) {
      err = document.createElement("small");
      err.className = "field-error";
      err.id = input.id + "-error";
      (group || input.parentNode).appendChild(err);
    }
    err.textContent = msg;
  };

  var clearFieldError = function (input) {
    input.classList.remove("is-invalid");
    input.setAttribute("aria-invalid", "false");
    var group = input.closest(".form-group");
    if (group) group.classList.remove("has-error");
    var err = document.getElementById(input.id + "-error");
    if (err && err.parentNode) err.parentNode.removeChild(err);
  };

  var validateField = function (rule) {
    var input = document.getElementById(rule.id);
    if (!input) return true;
    var value = input.value.trim();
    var valid = value !== "" && (rule.id !== "email" || EMAIL_RE.test(value));
    if (valid) { clearFieldError(input); }
    else { showFieldError(input, rule.msg); }
    return valid;
  };

  var validateAllFields = function () {
    var ok = true;
    fieldRules.forEach(function (rule) {
      if (!validateField(rule)) ok = false;
    });
    return ok;
  };

  fieldRules.forEach(function (rule) {
    var input = document.getElementById(rule.id);
    if (!input) return;
    input.addEventListener("blur", function () { validateField(rule); });
    input.addEventListener("input", function () { validateField(rule); });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Honeypot: pretend success, send nothing.
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) {
      setStatus("ok", '<strong class="ok-title">Tack!</strong><span class="ok-line">Vi återkommer inom 24 timmar på vardagar.</span><div class="ok-next"><strong>Vad händer nu?</strong><div class="ok-steps"><span class="ok-step"><span class="n">1</span>Svar inom 24 h</span><span class="ok-step"><span class="n">2</span>Offert</span><span class="ok-step"><span class="n">3</span>Start</span></div></div>');
      form.classList.add("is-success"); /* fake success hides fields too */
      form.reset();
      return;
    }

    var data = {
      site: LEAD_SITE,
      name: (form.querySelector('[name="name"]') || {}).value || "",
      phone: (form.querySelector('[name="phone"]') || {}).value || "",
      email: (form.querySelector('[name="email"]') || {}).value || "",
      /* Round 17 (head dir 8): optional postnummer lead-qualifier — sent
         when present, never required, never validated (optional field). */
      postnummer: (form.querySelector('[name="postnummer"]') || {}).value || "",
      service: (form.querySelector('[name="service"]') || {}).value || "",
      message: (form.querySelector('[name="message"]') || {}).value || ""
    };

    // Round 19 (head dir 6): GDPR consent must be checked before any POST.
    if (!gdprValid()) {
      setStatus("err", "Du måste godkänna att vi kontaktar dig innan vi kan ta emot din förfrågan.");
      return;
    }

    // Round 12: per-field validation first — marks each invalid field and
    // shows the summary banner; the existing summary check below stays as a
    // fallback for anything that slips past.
    if (!validateAllFields()) {
      setStatus("err", "Fyll i namn, telefon och e-post så återkommer vi.");
      return;
    }

    if (!data.name || !data.phone || !data.email) {
      setStatus("err", "Fyll i namn, telefon och e-post så återkommer vi.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Skickar…";
    }
    setStatus("working", "Skickar din förfrågan…");

    var submitted = false;
    try {
      var res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      submitted = true;
      /* Round 9: success-only state — hide the fields on a real 2xx. */
      form.classList.add("is-success");
      if (submitBtn) { submitBtn.innerHTML = "Skickat ✓"; } /* keep disabled — do NOT re-enable */
      /* Round 11 dir 4: elevated success card — bolder "Tack!" headline
         above the check line (2px amber border + soft shadow in CSS).
         Round 17 (head dir 2): 3-step "Vad händer nu?" strip — Svar inom
         24 h → Offert → Start — fills the card so the desktop layout never
         shows dead space below the message. */
      setStatus("ok", '<strong class="ok-title">Tack!</strong><span class="ok-line">Tack för din förfrågan! Vi återkommer inom 24 timmar på vardagar.</span><div class="ok-next"><strong>Vad händer nu?</strong><div class="ok-steps"><span class="ok-step"><span class="n">1</span>Svar inom 24 h</span><span class="ok-step"><span class="n">2</span>Offert</span><span class="ok-step"><span class="n">3</span>Start</span></div></div>');
      form.reset();
    } catch (err) {
      setStatus("err", "Något gick fel när förfrågan skickades. Ring oss direkt på <a href=\"tel:+46851234567\">08-512 345 67</a> så hjälper vi dig.");
    } finally {
      // Round 6: after a real 2xx the button stays disabled — no duplicate
      // leads from double-clicks. Only re-enable when the request failed.
      if (!submitted) form.classList.remove("is-success"); /* failed → fields return */
      if (submitBtn && !submitted) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    }
  });
})();
