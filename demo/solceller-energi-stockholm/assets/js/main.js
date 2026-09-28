/* ==========================================================================
   Solceller & Energi Stockholm — delad JS (meny, drawer, formulär, animation)
   Ägs av byggaren. Undersidor får inte skriva om denna fil.
   ========================================================================== */

/* --------------------------------------------------------------------------
   KONTAKTFORMULÄRETS ENDPOINT — ÄNDRA HÄR (enda stället)
   --------------------------------------------------------------------------
   Alla formulär på sajten (kontakt.html, offertformulär på tjänstesidor och
   "skicka in min kalkyl" i kalkylatorn) POST:ar till adressen nedan.

   Så byter kunden ut den:
     1. Byt strängen mot kundens endpoint, t.ex. ett eget API eller en
        formulärtjänst (Formspree, Netlify Forms, egen server).
     2. Endpointen måste svara 2xx och skicka CORS-huvudet
        `Access-Control-Allow-Origin: *` — annars visar formuläret ett fel
        istället för "Tack". Vi visar aldrig en falsk bekräftelse.
     3. Fälten som skickas: namn, epost, telefon, ort, fastighetstyp,
        areal/kWh (om ifyllt), meddelande, sida, honeypot (_gotcha).
   -------------------------------------------------------------------------- */
var LEAD_ENDPOINT = "http://127.0.0.1:8787/lead";

/* Site-nyckel som följer med varje lead så att demobackenden lägger leadet i
   rätt lista (solceller-energi-stockholm). Byt eller ta bort den om kunden
   använder en egen endpoint. */
var LEAD_SITE = "solceller-energi-stockholm";

/* Sajtens kontaktuppgifter i feltexten. SAMMA värden som _shared/contact.json —
   assemble.py (grind G5) failar bygget om de glider isär. Ändra i contact.json
   först, sedan här, och kör om assemblern. */
var KONTAKT_TEL = "+46 70 494 90 87";
var KONTAKT_EPOST = "vberg024@gmail.com";

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------- 1. Drawer */
  function initDrawer() {
    var burger = document.querySelector("[data-drawer-open]");
    var drawer = document.getElementById("site-drawer");
    var backdrop = document.querySelector(".backdrop");
    if (!burger || !drawer || !backdrop) return;

    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.setAttribute("data-open", "true");
      drawer.removeAttribute("aria-hidden");
      backdrop.setAttribute("data-open", "true");
      burger.setAttribute("aria-expanded", "true");
      document.body.setAttribute("data-drawer", "open");
      var close = drawer.querySelector(".drawer__close");
      if (close) close.focus();
    }
    function close() {
      drawer.setAttribute("data-open", "false");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.setAttribute("data-open", "false");
      burger.setAttribute("aria-expanded", "false");
      document.body.removeAttribute("data-drawer");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    burger.addEventListener("click", function () {
      if (drawer.getAttribute("data-open") === "true") close(); else open();
    });
    backdrop.addEventListener("click", close);
    Array.prototype.forEach.call(
      drawer.querySelectorAll("[data-drawer-close]"),
      function (el) { el.addEventListener("click", close); }
    );
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.getAttribute("data-open") === "true") close();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992 && drawer.getAttribute("data-open") === "true") close();
    });
  }

  /* ------------------------------------------------- 2. Sticky header-skugga */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 8) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------------------------------------------------- 3. Reveal + solstrålar */
  function initReveal() {
    var items = document.querySelectorAll(".reveal, .rays[data-animate]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------- 4. Årtal i footer */
  function initYear() {
    var y = String(new Date().getFullYear());
    Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
      el.textContent = y;
    });
  }

  /* ------------------------------------------------------------ 5. Formulär */
  function initForms() {
    Array.prototype.forEach.call(document.querySelectorAll("form[data-lead-form]"), function (form) {
      var status = form.querySelector(".form__status");
      var button = form.querySelector("[type=submit]");

      function setStatus(state, message) {
        if (!status) return;
        status.setAttribute("data-state", state);
        status.textContent = message;
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var honeypot = form.querySelector("[name=_gotcha]");
        if (honeypot && honeypot.value !== "") {
          /* Bot. Låtsas att allt gick bra utan att skicka något. */
          setStatus("ok", "Tack! Vi hör av oss inom en arbetsdag.");
          return;
        }
        if (!form.reportValidity()) return;

        var data = new FormData(form);
        if (!data.get("sida")) {
          data.set("sida", window.location.pathname.replace(/^\//, "") || "index.html");
        }
        var labels = {
          namn: "Namn", epost: "E-post", telefon: "Telefon", ort: "Ort",
          fastighet: "Fastighetstyp", takyta: "Skuggfri takyta (m²)",
          forbrukning: "Elförbrukning (kWh/år)", meddelande: "Meddelande",
          samtycke: "Godkänner kontakt", sida: "Sida", kalkyl: "Kalkyl"
        };
        var lines = [];
        data.forEach(function (value, key) {
          if (key === "_gotcha" || key === "samtycke") return;
          if (String(value).trim() === "") return;
          lines.push((labels[key] || key) + ": " + value);
        });
        data.append("meddelande_text", lines.join("\n"));

        /* JSON-payload: backenden läser site-nyckeln och de svenska faltnamnen
           (kontaktperson/telefon/epost/meddelande). */
        var payload = { site: LEAD_SITE };
        data.forEach(function (value, key) {
          if (key === "_gotcha") return;
          payload[key] = value;
        });
        if (!payload.kontaktperson && payload.namn) payload.kontaktperson = payload.namn;

        if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = "Skickar …"; }
        setStatus("sending", "Skickar …");

        fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.text();
          })
          .then(function () {
            form.reset();
            setStatus("ok", "Tack! Din förfrågan är skickad. Vi svarar inom en arbetsdag, oftast samma dag.");
          })
          .catch(function () {
            setStatus("error",
              "Kunde inte skicka just nu. Ring " + KONTAKT_TEL + " eller mejla " + KONTAKT_EPOST + ", så tar vi det direkt.");
          })
          .then(function () {
            if (button) { button.disabled = false; if (button.dataset.label) button.textContent = button.dataset.label; }
          });
      });
    });
  }

  /* -------------------------------------------------- 6. Aktuell sida i meny */
  function initNavCurrent() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    Array.prototype.forEach.call(document.querySelectorAll(".nav__link, .drawer__nav a"), function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === path) a.setAttribute("aria-current", "page");
    });
  }

  function init() {
    initDrawer();
    initHeader();
    initReveal();
    initYear();
    initForms();
    initNavCurrent();
    document.documentElement.classList.add("js-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
