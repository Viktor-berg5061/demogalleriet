/* ============================================================
   LEAD ENDPOINT (configure here — all form submissions POST here)
   ============================================================
   Two targets so a local test can never silently drop a lead and a
   published site never posts into nothing:

   • LEAD_ENDPOINT_LOCAL — the web-loop lead-capture service running on
     this VPS (systemd unit: web-loop-lead-capture, 127.0.0.1:8787).
     Used whenever the page is opened from localhost / 127.0.0.1 /
     file:// — i.e. exactly how the tester and the builder verify the
     money path. Leads land in /home/agentops/web-loop/leads/.
   • LEAD_ENDPOINT_PUBLIC — the public receiver used by a real visitor.
     THIS is the one line to change when the site moves to the
     customer's own domain.

   The old hard-coded tunnel host had expired (DNS dead), so every real
   submission would have failed with a network error = silent lead loss.
   ============================================================ */
const LEAD_ENDPOINT_LOCAL = "https://hermes-web-db.webbtjanst.com/lead?site=arkitekt-studio-stockholm";
const LEAD_ENDPOINT_PUBLIC = "https://hermes-web-db.webbtjanst.com/lead?site=arkitekt-studio-stockholm";
const LEAD_ENDPOINT = (function () {
  var h = (window.location.hostname || "").toLowerCase();
  var local = h === "" || h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  return local ? LEAD_ENDPOINT_LOCAL : LEAD_ENDPOINT_PUBLIC;
})();
/* Site key sent with every lead so the shared lead backend stores this
   site's leads under its own file (arkitekt-studio-stockholm.jsonl). */
const LEAD_SITE = "arkitekt-studio-stockholm";

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
  // Normal path: IntersectionObserver reveals on scroll.
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
    // Failsafe: whatever is still hidden after load+1s gets revealed
    // unconditionally. Guarantees screenshots/AI crawlers see content.
    window.setTimeout(force, 1000);
    window.addEventListener("load", function () { window.setTimeout(force, 300); });
  } else {
    force();
  }
})();

/* ------------------------------------------------------------
   0b. Lazy-image failsafe — force-load below-fold images shortly
   after load. Real users keep loading="lazy" (fast first paint);
   full-page screenshots and AI crawlers still see every image,
   so a screenshot can never show a beige void where a photo
   belongs.
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
    ).filter(function (el) { return el.offsetParent !== null || el === closeBtn; });
  };

  var setOpen = function (open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Stäng meny" : "Öppna menyn");
    // When the drawer is open the burger is hidden from assistive tech AND
    // visually (CSS opacity/pointer-events) so the ONLY close control is the
    // dedicated nav-close button — no "two X icons" confusion. The morph-X
    // animation rules stay in CSS for the a11y state change, but the button
    // is not seen while the drawer covers the page.
    burger.setAttribute("aria-hidden", open ? "true" : "false");
    document.body.classList.toggle("no-scroll", open);
    if (backdrop) backdrop.classList.toggle("visible", open);
    if (open) {
      lastFocus = document.activeElement;
      // Move focus into the drawer: close button first (top-right, visible).
      if (closeBtn) { closeBtn.focus(); }
      else { var first = focusables()[0]; if (first) first.focus(); }
    } else {
      // Restore focus to the burger so keyboard users know where they are.
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }
  };

  burger.addEventListener("click", function () {
    setOpen(!nav.classList.contains("open"));
  });

  // Dedicated visible close button (44px target) inside the drawer.
  if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });

  // Close when a link is tapped
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });

  // Close when the scrim behind the menu is tapped
  if (backdrop) backdrop.addEventListener("click", function () {
    setOpen(false);
  });

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) setOpen(false);
  });

  // Focus trap: Tab cycles inside the drawer while it is open.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !nav.classList.contains("open")) return;
    var items = focusables();
    if (!items.length) { e.preventDefault(); return; }
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === document.body || active === burger) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Close when viewport grows past the mobile breakpoint
  window.addEventListener("resize", function () {
    if (window.innerWidth > 767) setOpen(false);
  });
})();

/* ------------------------------------------------------------
   2b. Mobile sticky CTA — hide on scroll-down, reveal on scroll-up
   The fixed bottom bar must never cover interactive content while the
   user reads/scrolls (head directive: measure overlap mid-scroll, not
   only at max-scroll). Rule: while scrolling DOWN past a small
   threshold the bar slides away; the instant the user scrolls UP it
   returns, so the conversion target is always one thumb-swipe away
   but never blocks the form/footer while consuming content.
   ------------------------------------------------------------ */
(function () {
  var bar = document.querySelector(".mobile-cta-sticky");
  if (!bar) return;
  var lastY = window.scrollY || 0;
  var ticking = false;
  var HIDE_AFTER = 90; // px scrolled before the bar hides
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
    accs.forEach(function (acc, i) {
      // First accordion (Kontakt? No — first = Tjänster) stays open on
      // mobile for immediate navigation; the rest collapse.
      acc.open = !mobile || i === 0 || acc.dataset.keepOpen === "true";
    });
  };
  apply();
  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(apply, 150);
  });
})();

/* ------------------------------------------------------------
   4. Testimonials carousel
   Auto-rotate 6s · pause on hover · prev/next · dots · keyboard
   ------------------------------------------------------------ */
(function () {
  var root = document.querySelector("[data-carousel]");
  if (!root) return;
  var track = root.querySelector("[data-carousel-track]");
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var prevBtn = root.querySelector("[data-carousel-prev]");
  var nextBtn = root.querySelector("[data-carousel-next]");
  var dotsWrap = root.querySelector("[data-carousel-dots]");
  if (!track || slides.length < 2) return;

  var index = 0;
  var timer = null;
  var INTERVAL = 6000;

  var go = function (i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = "translateX(-" + index * 100 + "%)";
    var dots = dotsWrap.querySelectorAll(".t-dot");
    dots.forEach(function (d, di) {
      d.classList.toggle("is-active", di === index);
      d.setAttribute("aria-selected", di === index ? "true" : "false");
    });
    slides.forEach(function (s, si) {
      s.setAttribute("aria-hidden", si === index ? "false" : "true");
    });
  };

  var stop = function () {
    if (timer) { clearInterval(timer); timer = null; }
  };
  var start = function () {
    stop();
    timer = setInterval(function () { go(index + 1); }, INTERVAL);
  };

  // Dots
  if (dotsWrap) {
    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.className = "t-dot";
      d.type = "button";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", "Visa omdöme " + (i + 1));
      d.addEventListener("click", function () { go(i); start(); });
      dotsWrap.appendChild(d);
    });
  }

  prevBtn.addEventListener("click", function () { go(index - 1); start(); });
  nextBtn.addEventListener("click", function () { go(index + 1); start(); });

  // Keyboard ←/→ when the carousel has focus or the pointer is over it
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { go(index - 1); start(); }
    if (e.key === "ArrowRight") { go(index + 1); start(); }
  });
  root.setAttribute("tabindex", "0");

  // Pause on hover / focus, resume on leave
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);

  go(0);
  start();
})();

/* ------------------------------------------------------------
   5. Contact form — real network POST via fetch()
   Payload JSON: { site, name, email, phone, message }
   Success/error rendered visibly in #form-status.
   Honeypot field (#f-company): bots fill it → we fake success,
   send nothing.
   ------------------------------------------------------------ */
(function () {
  var form = document.getElementById("leadForm");
  if (!form) return;

  var status = document.getElementById("formStatus");
  var submitBtn = form.querySelector('button[type="submit"]');

  var showStatus = function (kind, html) {
    if (!status) return;
    status.className = "form-status " + kind;
    status.innerHTML = html;
    // Round 12 head: scroll the whole form CARD into view instead of only
    // the status box — with block:"nearest" the browser scrolled just
    // enough that the submit button ended up half under the sticky
    // header. .contact-form-card carries scroll-margin-top: header + 20px,
    // so the card (banner + button + status) always clears the header.
    var card = form.closest(".contact-form-card") || form;
    if (kind === "ok" || kind === "err") {
      card.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      status.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  // After a successful submit the whole form is locked so a double-tap or a
  // reload-backed resend can never create a duplicate lead. (Head directive:
  // "dölj/disable formuläret efter lyckad submit".) The success status stays
  // visible; only the inputs + submit become inert. The submit button swaps
  // to a green "Skickat ✓" state so the card reads as DONE, not editable.
  var lockForm = function () {
    form.classList.add("is-complete");
    // Round 13 (head polish): is-complete only disabled the fields, so the
    // card still LOOKED editable in the vision review. is-locked drives the
    // dashed/muted field styling, the green "Skickat" button and the
    // confirmation ribbon (#formLockNote) — the state is now unmistakable.
    form.classList.add("is-locked");
    Array.prototype.slice.call(form.querySelectorAll("input, textarea, button")).forEach(function (el) {
      el.disabled = true;
    });
    if (submitBtn) {
      submitBtn.classList.remove("is-loading");
      submitBtn.classList.add("is-done");
      submitBtn.removeAttribute("aria-busy");
      var label = submitBtn.querySelector(".btn-label");
      if (label) label.textContent = "Skickat \u2713";
    }
  };

  var setLoading = function (loading) {
    if (!submitBtn) return;
    // Once the form is complete (successful submit) the button stays
    // disabled forever — the finally-block re-enable must not undo the lock.
    if (form.classList.contains("is-complete")) {
      submitBtn.disabled = true;
      return;
    }
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("is-loading", loading);
    submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
    var label = submitBtn.querySelector(".btn-label");
    if (label) label.textContent = loading ? "Skickar…" : "Skicka meddelande";
  };

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Honeypot: if a bot filled the hidden company field, pretend success.
    var honeypot = document.getElementById("f-company");
    if (honeypot && honeypot.value.trim() !== "") {
      showStatus("ok", "Tack! Ditt meddelande har skickats. Vi återkommer inom 24 timmar.");
      form.reset();
      return;
    }

    var name = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var phone = document.getElementById("f-phone");
    var message = document.getElementById("f-message");

    // Client-side validation
    var valid = true;
    [name, email, phone, message].forEach(function (field) {
      if (!field) return;
      var bad = field.value.trim() === "";
      if (field.type === "email" && field.value.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
        bad = true;
      }
      field.setAttribute("aria-invalid", bad ? "true" : "false");
      field.style.borderColor = bad ? "#4A4339" : "";
      if (bad) valid = false;
    });
    if (!valid) {
      showStatus("err", "Fyll i namn, e-post, telefon och meddelande så kontaktar vi dig.");
      var firstEmpty = [name, email, phone, message].find(function (f) { return f && (f.value.trim() === "" || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()))); });
      if (firstEmpty) firstEmpty.focus();
      return;
    }

    var payload = {
      site: LEAD_SITE,
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      message: message.value.trim()
    };

    setLoading(true);
    showStatus("sending", "Skickar…");

    try {
      var res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      showStatus("ok", "<strong>Tack, " + payload.name + "!</strong> Ditt meddelande har skickats. Vi återkommer inom 24 timmar (vardagar).");
      form.reset();
      lockForm(); // prevent double-submit — the form is now inert
    } catch (err) {
      showStatus(
        "err",
        "Något gick fel när meddelandet skulle skickas. Försök igen om en stund, eller ring oss på <a href=\"tel:+4684421730\">08-442 17 30</a>."
      );
    } finally {
      setLoading(false);
    }
  });

  // Clear error styling when the user starts typing again
  ["f-name", "f-email", "f-phone", "f-message"].forEach(function (id) {
    var field = document.getElementById(id);
    if (!field) return;
    field.addEventListener("input", function () {
      field.setAttribute("aria-invalid", "false");
      field.style.borderColor = "";
    });
  });

  // Hide the mobile sticky bottom CTA while a form control is focused
  // (keyboard open) so the fixed bar never covers the active field.
  // body.form-focus is a CSS hook consumed in the ≤767px block.
  var controls = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));
  if (controls.length) {
    var onFocusIn = function () { document.body.classList.add("form-focus"); };
    var onFocusOut = function (e) {
      // Only remove when focus has fully left the form (relatedTarget not inside it).
      if (e.relatedTarget && form.contains(e.relatedTarget)) return;
      document.body.classList.remove("form-focus");
    };
    form.addEventListener("focusin", onFocusIn);
    form.addEventListener("focusout", onFocusOut);
  }
})();

/* ------------------------------------------------------------
   5b. Kalkyl — real price estimator (no dead UI)
   Reads the selected option's data-pris (kr/m2) and the level
   factor, multiplies by the area and renders a rounded estimate.
   Markup contract: #kalkylTyp (select, options carry data-pris),
   #kalkylYta (input range/number, m2), #kalkylNiva (select,
   options carry data-faktor), #kalkylSumma (output), #kalkylDetalj.
   Without JS the panel still shows the static price table, so the
   section is never a blank box.
   ------------------------------------------------------------ */
(function () {
  var typ = document.getElementById("kalkylTyp");
  var yta = document.getElementById("kalkylYta");
  var niva = document.getElementById("kalkylNiva");
  var summa = document.getElementById("kalkylSumma");
  var detalj = document.getElementById("kalkylDetalj");
  if (!typ || !yta || !summa) return;

  var val = function (el, attr, fallback) {
    if (!el) return fallback;
    var opt = el.options ? el.options[el.selectedIndex] : null;
    var raw = opt ? opt.getAttribute(attr) : null;
    var n = raw === null ? NaN : parseFloat(raw);
    return isNaN(n) ? fallback : n;
  };

  var fmt = function (n) {
    try { return n.toLocaleString("sv-SE"); } catch (e) { return String(n); }
  };

  var update = function () {
    var pris = val(typ, "data-pris", 0);
    var faktor = val(niva, "data-faktor", 1);
    var m2 = parseFloat(yta.value) || 0;
    var total = pris * m2 * faktor;
    // Round to the nearest 5 000 kr — an estimate should not pretend to be exact.
    total = Math.round(total / 5000) * 5000;
    summa.textContent = fmt(total) + " kr";
    if (detalj) {
      detalj.textContent = fmt(pris) + " kr/m\u00b2 \u00d7 " + fmt(m2) + " m\u00b2" +
        (faktor !== 1 ? " \u00d7 " + String(faktor).replace(".", ",") + " (niv\u00e5)" : "") +
        ". Prelimin\u00e4rt fast pris ges efter ett kostnadsfritt bes\u00f6k.";
    }
  };

  [typ, yta, niva].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });
  update();
})();

/* ------------------------------------------------------------
   6. Footer year
   ------------------------------------------------------------ */
(function () {
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
