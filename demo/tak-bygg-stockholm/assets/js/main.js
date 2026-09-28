/* ============================================================
   Tak & Bygg Stockholm — main.js
   Vanilla JS. No dependencies.

   ============================================================
   LEAD ENDPOINT (configure here — all form submissions POST here)
   ============================================================ */
const LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=tak-bygg-stockholm";
/* Site key sent with every lead so the shared lead backend stores this
   site's leads under its own file (tak-bygg-stockholm.jsonl). */
const LEAD_SITE = "tak-bygg-stockholm";

/* ------------------------------------------------------------
   0. Reveal failsafe — content must NEVER stay invisible.
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
   1. Mobile nav: toggle drawer, backdrop, Escape, dropdowns.
   ------------------------------------------------------------ */
(function () {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("navLinks");
  var backdrop = document.getElementById("navBackdrop");
  var closeBtn = document.getElementById("navClose");
  if (!toggle || !nav) return;

  function closeNav() {
    nav.classList.remove("open");
    if (backdrop) backdrop.style.display = "none";
    toggle.setAttribute("aria-expanded", "false");
    if (closeBtn) closeBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    document.body.style.overflow = "";
  }
  function openNav() {
    nav.classList.add("open");
    if (backdrop) backdrop.style.display = "block";
    toggle.setAttribute("aria-expanded", "true");
    if (closeBtn) closeBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
    document.body.style.overflow = "hidden";
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    if (nav.classList.contains("open")) { closeNav(); } else { openNav(); }
  });
  if (closeBtn) closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    closeNav();
  });
  if (backdrop) backdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  // Dropdowns (mobile): click on Tjänster toggles the submenu.
  var hasDrop = document.querySelectorAll(".has-drop > a");
  hasDrop.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 1024) {
        var li = link.parentElement;
        var open = li.classList.contains("open");
        document.querySelectorAll(".has-drop.open").forEach(function (el) {
          el.classList.remove("open");
          el.querySelector("a").setAttribute("aria-expanded", "false");
        });
        if (!open) {
          li.classList.add("open");
          link.setAttribute("aria-expanded", "true");
        }
        e.preventDefault();
      }
    });
  });
})();

/* ------------------------------------------------------------
   2. Sticky mobile CTA: hide on scroll down, show on scroll up.
   ------------------------------------------------------------ */
(function () {
  var lastY = window.scrollY || 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    if (y > lastY && y > 240) {
      document.body.classList.add("cta-hidden");
    } else {
      document.body.classList.remove("cta-hidden");
    }
    lastY = y;
  }, { passive: true });
})();

/* ------------------------------------------------------------
   3. FAQ: single-open accordion (details).
   ------------------------------------------------------------ */
(function () {
  var items = document.querySelectorAll(".faq-list details");
  if (!items.length) return;
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        items.forEach(function (other) {
          if (other !== d) other.open = false;
        });
      }
    });
  });
})();

/* ------------------------------------------------------------
   4. Contact form — POST to LEAD_ENDPOINT (see top of file).
   Per-field validation, honeypot, success card, disabled button.
   ------------------------------------------------------------ */
(function () {
  var form = document.getElementById("leadForm");
  if (!form) return;

  var status = document.getElementById("formStatus");
  var submitBtn = form.querySelector('button[type="submit"]');
  var hp = document.getElementById("hpField");

  function setError(field, message) {
    var group = field.closest(".form-group");
    var err = group ? group.querySelector(".field-error") : null;
    if (group) group.classList.add("has-error");
    if (err && message) err.textContent = "⚠ " + message;
    field.setAttribute("aria-invalid", "true");
  }
  function clearError(field) {
    var group = field.closest(".form-group");
    if (group) group.classList.remove("has-error");
    field.removeAttribute("aria-invalid");
  }
  function validPhone(v) {
    return /^[+0-9][0-9\s\-()]{6,19}$/.test(v.replace(/\s+/g, " ").trim());
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  function validateField(field) {
    var name = field.name;
    var val = field.value.trim();
    var ok = true;
    if (name === "name") {
      ok = val.length >= 2;
      if (!ok) setError(field, "Ange ditt namn.");
      else clearError(field);
    } else if (name === "phone") {
      ok = validPhone(val);
      if (!ok) setError(field, "Ange ett giltigt telefonnummer.");
      else clearError(field);
    } else if (name === "email") {
      ok = val === "" || validEmail(val);
      if (!ok) setError(field, "Ange en giltig e-postadress.");
      else clearError(field);
    }
    return ok;
  }

  ["name", "phone", "email"].forEach(function (n) {
    var f = form.querySelector('[name="' + n + '"]');
    if (!f) return;
    f.addEventListener("blur", function () { validateField(f); });
    f.addEventListener("input", function () { validateField(f); });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (status) status.style.display = "none";

    // Honeypot: bots fill it, humans never do.
    if (hp && hp.value) return;

    // Per-field validation pass.
    var fields = ["name", "phone", "email"];
    var firstBad = null;
    fields.forEach(function (n) {
      var f = form.querySelector('[name="' + n + '"]');
      if (f && !validateField(f) && !firstBad) firstBad = f;
    });
    if (firstBad) {
      firstBad.focus();
      return;
    }

    var payload = {
      site: LEAD_SITE,
      name: (form.name ? form.name.value : "").trim(),
      phone: (form.phone ? form.phone.value : "").trim(),
      email: (form.email ? form.email.value : "").trim(),
      service: (form.service ? form.service.value : "").trim(),
      message: (form.message ? form.message.value : "").trim()
    };

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Skickar …"; }

    try {
      var res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      if (status) {
        status.style.display = "flex";
        status.scrollIntoView({ behavior: "smooth", block: "nearest" });
        form.classList.add("is-success");
      }
      if (submitBtn) submitBtn.textContent = "Skickat ✓";
      form.reset();
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Skicka";
      }
      var banner = document.getElementById("formBanner");
      if (banner) banner.style.display = "block";
    }
  });
})();
