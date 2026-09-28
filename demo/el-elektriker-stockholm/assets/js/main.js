/* ==========================================================================
   El & Elektriker Stockholm — site scripts (vanilla, dependency-free)
   ========================================================================== */

/* =====================================================================
   LEAD ENDPOINT — kontaktformuläret skickar leaddata hit (JSON POST).
   Ändra denna konstant om mottagaren av leads byts ut.
   ===================================================================== */
const LEAD_ENDPOINT = "https://covered-bennett-parks-photographic.trycloudflare.com/lead";

(function () {
  "use strict";

  /* ---------- Mobile menu toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Stäng menyn" : "Öppna menyn");
    }
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    /* Klick utanför menyn (inkl. backdrop) stänger */
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("open") && !menu.contains(e.target) && !toggle.contains(e.target)) {
        setMenu(false);
      }
    });
    /* Escape stänger och återställer fokus */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Contact forms (fetch POST to LEAD_ENDPOINT) ---------- */
  document.querySelectorAll("form[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var status = form.querySelector(".form-status");
      var button = form.querySelector("button[type='submit']");
      var name = form.querySelector("[name='name']").value.trim();
      var phone = form.querySelector("[name='phone']").value.trim();
      var message = (form.querySelector("[name='message']") || {}).value
        ? form.querySelector("[name='message']").value.trim()
        : "";

      if (!name || !phone) {
        showStatus(status, "err", "Fyll i namn och telefonnummer så kontaktar vi dig.");
        return;
      }

      var payload = { name: name, phone: phone, message: message };

      if (button) {
        button.disabled = true;
        var original = button.innerHTML;
        button.innerHTML = "Skickar…";
      }
      showStatus(status, "loading", "");

      fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          showStatus(status, "ok", "Tack! Din förfrågan är mottagen – vi återkommer inom 30 minuter under kontorstid.");
          form.reset();
        })
        .catch(function () {
          showStatus(status, "err", "Något gick fel vid skickningen. Ring oss istället på +46 70 000 00 00 så hjälper vi dig direkt.");
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.innerHTML = original;
          }
        });
    });
  });

  /* ---------- Prisguide / kalkylator (index) ---------- */
  var calcWrap = document.querySelector("#calc-options");
  if (calcWrap) {
    var calcPrice = document.getElementById("calc-price");
    var calcSub = document.getElementById("calc-sub");
    var calcIncludes = document.getElementById("calc-includes");
    function renderCalc(opt) {
      if (!opt) return;
      calcWrap.querySelectorAll(".calc-opt").forEach(function (o) {
        o.classList.toggle("active", o === opt);
        o.setAttribute("aria-selected", o === opt ? "true" : "false");
      });
      if (calcPrice) calcPrice.textContent = "från " + opt.getAttribute("data-price");
      if (calcSub) calcSub.textContent = opt.getAttribute("data-desc");
      if (calcIncludes) {
        calcIncludes.innerHTML = opt.getAttribute("data-includes")
          .split("|")
          .map(function (item) {
            return '<li><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;margin-top:4px;color:var(--amber-400)"><path d="M20 6 9 17l-5-5"/></svg>' + item + "</li>";
          })
          .join("");
      }
    }
    calcWrap.querySelectorAll(".calc-opt").forEach(function (opt) {
      opt.setAttribute("role", "option");
      opt.addEventListener("click", function () { renderCalc(opt); });
    });
    renderCalc(calcWrap.querySelector(".calc-opt.active"));
  }

  function showStatus(el, type, text) {
    if (!el) return;
    el.className = "form-status";
    if (type === "loading") {
      el.innerHTML = '<span class="spinner"></span>Skickar förfrågan…';
      el.style.display = "block";
      return;
    }
    el.classList.add(type);
    el.textContent = text;
    el.style.display = "block";
  }
})();
