/* ============================================================
   Mura & Puts Stockholm — shared JS (menu, form, reveal)
   Loaded once on every page, LAST element before </body>.
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONTACT FORM ENDPOINT (lead backend — change here only)
     POSTs JSON { name, phone, email, message, site } to the
     web-loop lead-capture server (Cloudflare tunnel).
     ---------------------------------------------------------- */
  var CONTACT_FORM_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=mura-puts-stockholm";

  /* ---------------- Mobile menu ---------------- */
  var body = document.body;
  var toggle = document.getElementById("navToggle");
  var backdrop = document.getElementById("navBackdrop");
  var drawer = document.getElementById("drawer");
  var drawerClose = document.getElementById("drawerClose");

  function openMenu() {
    body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeMenu() {
    body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (body.classList.contains("nav-open")) { closeMenu(); } else { openMenu(); }
    });
    if (backdrop) { backdrop.addEventListener("click", closeMenu); }
    if (drawerClose) { drawerClose.addEventListener("click", closeMenu); }
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) { closeMenu(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMenu(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) { closeMenu(); }
    });
  }

  /* ---------------- Header shadow on scroll ---------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Contact form ---------------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var statusEl = document.getElementById("formStatus");
    var submitBtn = form.querySelector("[type=submit]");
    var originalLabel = submitBtn ? submitBtn.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot: bots fill "company" — drop silently */
      var honeypot = form.querySelector("input[name=company]");
      if (honeypot && honeypot.value.trim() !== "") { return; }

      var payload = {
        name: (form.querySelector("[name=name]") || {}).value || "",
        phone: (form.querySelector("[name=phone]") || {}).value || "",
        email: (form.querySelector("[name=email]") || {}).value || "",
        message: (form.querySelector("[name=message]") || {}).value || "",
        site: "mura-puts-stockholm"
      };

      if (!payload.name || !payload.phone) {
        showStatus("Fyll i namn och telefonnummer så ringer vi upp dig.", "err");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Skickar…";
      }

      fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) { throw new Error("HTTP " + res.status); }
          return res.json();
        })
        .then(function (data) {
          if (data && data.status === "ok") {
            form.reset();
            showStatus("Tack! Din förfrågan är mottagen. Vi återkommer inom 24 timmar (vardagar).", "ok");
          } else {
            throw new Error("Bad response");
          }
        })
        .catch(function () {
          showStatus("Något gick fel. Ring oss direkt på 08-121 314 15 så hjälper vi dig på en gång.", "err");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });

    function showStatus(msg, kind) {
      if (!statusEl) { return; }
      statusEl.textContent = msg;
      statusEl.className = "form-status form-status--show form-status--" + kind;
      statusEl.setAttribute("role", "status");
    }
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      Array.prototype.forEach.call(revealEls, function (el) { revealObserver.observe(el); });
      /* Safety net: never leave content hidden. If the observer has not fired
         for an element within 1s (full-page capture, crawler render, or a
         user who jumps straight to a section via anchor), reveal everything.
         1s so quick full-page screenshots never show blank sections — the
         observer still animates on scroll for real users. */
      setTimeout(function () {
        Array.prototype.forEach.call(revealEls, function (el) {
          if (!el.classList.contains("is-in")) { el.classList.add("is-in"); }
        });
      }, 1000);
    } else {
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------------- Years on demand (small helper) ---------------- */
  var yearEls = document.querySelectorAll("[data-year]");
  if (yearEls.length) {
    var year = new Date().getFullYear();
    Array.prototype.forEach.call(yearEls, function (el) { el.textContent = year; });
  }
})();
