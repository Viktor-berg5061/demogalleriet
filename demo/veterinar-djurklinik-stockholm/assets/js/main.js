/* ============================================================================
   Veterinär & Djurklinik Stockholm — beteende
   ----------------------------------------------------------------------------
   1. LEAD_ENDPOINT — boknings- och kontaktformuläret skickar hit (POST, JSON).
      KUNDEN BYTER DENNA RAD vid lansering, till sin egen mottagare
      (t.ex. Formspree, Make, Zapier eller egen server). Se README-raden i
      llms.txt. Ändra bara strängen nedan.
   ========================================================================== */
var LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=veterinar-djurklinik-stockholm";

var SITE_KEY = "veterinar-djurklinik-stockholm";

var KONTAKT = {
  telefon: "08-410 522 30",   /* klinikens växel — byts mot kundens nummer */
  telefonHref: "+46841052230",  /* samma nummer i E.164 för tel:-länken */
  epost: "info@veterinar-djurklinik-stockholm.se"  /* klinikens adress — byts mot kundens vid lansering */
};

/* Öppettider. akut = jourlinjen är bemannad, inte att mottagningen har öppet. */
var OPPETTIDER = {
  1: { oppen: [8, 18], text: "08:00–18:00" },
  2: { oppen: [8, 18], text: "08:00–18:00" },
  3: { oppen: [8, 18], text: "08:00–18:00" },
  4: { oppen: [8, 18], text: "08:00–18:00" },
  5: { oppen: [8, 18], text: "08:00–18:00" },
  6: { oppen: [9, 14], text: "09:00–14:00" },
  0: { oppen: null, text: "Stängt (jour via telefon)" }
};

(function () {
  "use strict";

  var $ = function (sel, rot) { return (rot || document).querySelector(sel); };
  var $$ = function (sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); };

  function tva(n) { return n < 10 ? "0" + n : String(n); }

  /* ---------------------------------------------------- 1. Mobila menyn */
  function initMeny() {
    var oppnare = $(".menyoppnare");
    var lador = $("#menylador");
    var bakgrund = $("#menybakgrund");
    var stang = $(".menystang");
    if (!oppnare || !lador || !bakgrund) return;

    function oppna() {
      lador.classList.add("menylador--oppen");
      bakgrund.classList.add("menybakgrund--oppen");
      oppnare.setAttribute("aria-expanded", "true");
      lador.removeAttribute("aria-hidden");
      var forsta = $(".menylank", lador);
      if (forsta) forsta.focus();
      document.documentElement.style.overflow = "hidden";
    }

    function stanga() {
      lador.classList.remove("menylador--oppen");
      bakgrund.classList.remove("menybakgrund--oppen");
      oppnare.setAttribute("aria-expanded", "false");
      lador.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      oppnare.focus();
    }

    oppnare.addEventListener("click", function () {
      if (lador.classList.contains("menylador--oppen")) { stanga(); } else { oppna(); }
    });
    bakgrund.addEventListener("click", stanga);
    if (stang) stang.addEventListener("click", stanga);
    $$(".menylank", lador).forEach(function (l) { l.addEventListener("click", stanga); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lador.classList.contains("menylador--oppen")) stanga();
    });
  }

  /* ------------------------------------------------- 2. Sidhuvudet */
  function initHuvud() {
    var huvud = $(".sidhuvud");
    if (!huvud) return;
    var satt = function () {
      if (window.scrollY > 12) { huvud.classList.add("sidhuvud--krympt"); }
      else { huvud.classList.remove("sidhuvud--krympt"); }
    };
    satt();
    window.addEventListener("scroll", satt, { passive: true });
  }

  /* --------------------------------------------- 3. Klinikdygnet (24 h) */
  function initDygn() {
    var bar = $("#dygnsbar");
    if (!bar) return;
    var nu = new Date();
    var idag = OPPETTIDER[nu.getDay()];
    var timme = nu.getHours();
    var oppen = idag && idag.oppen;
    var i = 0;

    for (i = 0; i < 24; i++) {
      var cell = document.createElement("span");
      cell.className = "dygnstimme";
      var inne = oppen && i >= oppen[0] && i < oppen[1];
      if (inne) { cell.classList.add("dygnstimme--oppen"); }
      else { cell.classList.add("dygnstimme--akut"); }
      if (i === timme) cell.classList.add("dygnstimme--nu");
      cell.setAttribute("title", tva(i) + ":00–" + tva(i + 1) + ":00 — " +
        (inne ? "mottagningen öppen" : "jourlinjen bemannad"));
      bar.appendChild(cell);
    }

    var nuText = oppen ? "kl. " + tva(timme) + ":00" : "kl. " + tva(timme) + ":00";
    $$("[data-dygnsnu]").forEach(function (el) { el.textContent = nuText; });

    var statusruta = $("#dygnsstatus");
    if (statusruta) {
      var arOppen = oppen && timme >= oppen[0] && timme < oppen[1];
      statusruta.classList.add(arOppen ? "hjalteskortstatus--oppen" : "hjalteskortstatus--stangd");
      statusruta.textContent = arOppen
        ? "Öppet nu — " + idag.text
        : "Stängt nu — jourlinjen är bemannad";
    }
  }

  /* --------------------------------------------------- 4. Scroll-reveal */
  function initAvsloja() {
    var poster = $$(".avsloja");
    if (!poster.length) return;
    if (!("IntersectionObserver" in window)) {
      poster.forEach(function (p) { p.classList.add("avsloja--synlig"); });
      return;
    }
    var obs = new IntersectionObserver(function (rader) {
      rader.forEach(function (rad) {
        if (rad.isIntersecting) {
          rad.target.classList.add("avsloja--synlig");
          obs.unobserve(rad.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    poster.forEach(function (p) { obs.observe(p); });
  }

  /* ------------------------------------------------------ 5. Formuläret */
  function initForm() {
    var form = $("form[data-leadform]");
    if (!form) return;
    var knapp = $("[type=submit]", form);
    var status = $("#formStatus");
    var original = knapp ? knapp.textContent : "";

    /* Webbläsarens egen validering stängs av här (aldrig i markupen), så att
       formuläret visar klinikens svenska felmeddelande i stället för
       webbläsarens bubbla. checkValidity() nedan gör samma kontroll. */
    form.setAttribute("novalidate", "");

    function visaStatus(typ, html) {
      if (!status) return;
      status.className = "formstatus formstatus--" + typ;
      status.innerHTML = html;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        visaStatus("fel", "Fyll i de obligatoriska fälten: namn, telefon och djurslag. " +
          "Vi behöver dem för att kunna ringa upp och boka in rätt tid.");
        var forstaOgiltig = $(":invalid", form);
        if (forstaOgiltig) forstaOgiltig.focus();
        return;
      }

      var data = {};
      $$("input, select, textarea", form).forEach(function (el) {
        if (!el.name) return;
        if (el.type === "checkbox") { data[el.name] = el.checked; return; }
        if (el.type === "radio" && !el.checked) return;
        data[el.name] = el.value;
      });
      data.sida = location.pathname;
      data.tid = new Date().toISOString();
      data.site = SITE_KEY;

      if (knapp) { knapp.disabled = true; knapp.textContent = "Skickar …"; }
      if (status) status.className = "formstatus";

      fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (svar) {
        if (!svar.ok) throw new Error("HTTP " + svar.status);
        form.reset();
        visaStatus("ok", "<strong>Tack, " + (data.namn || "du") + "!</strong> " +
          "Din bokningsförfrågan är skickad. Vi ringer upp inom en arbetsdag och bekräftar tiden. " +
          "Akut ärende? Ring <a href=\"tel:" + KONTAKT.telefonHref + "\">" + KONTAKT.telefon + "</a> direkt.");
      }).catch(function () {
        visaStatus("fel", "Något gick fel när förfrågan skickades. Försök igen om en stund, " +
          "eller ring <a href=\"tel:" + KONTAKT.telefonHref + "\">" + KONTAKT.telefon + "</a> " +
          "så bokar vi tiden direkt.");
      }).then(function () {
        if (knapp) { knapp.disabled = false; knapp.textContent = original; }
      });
    });
  }

  /* --------------------------------------- 6. Kostnadsuppskattning (priser) */
  function initKalkyl() {
    var form = $("#kostnadskalkyl");
    if (!form) return;

    var priser = {
      vaccination: { bas: 650, perKilo: 0, text: "Vaccination hund" },
      vaccination_katt: { bas: 595, perKilo: 0, text: "Vaccination katt" },
      kastrering_hane: { bas: 3900, perKilo: 12, text: "Kastrering hane" },
      kastrering_hona: { bas: 6900, perKilo: 18, text: "Kastrering hona" },
      tandvard: { bas: 4800, perKilo: 10, text: "Tandvård" },
      rontgen: { bas: 3200, perKilo: 0, text: "Röntgen" },
      halsokontroll: { bas: 890, perKilo: 0, text: "Hälsokontroll" },
      mikrocip: { bas: 595, perKilo: 0, text: "Mikrochip" }
    };

    var belopp = $("#kalkbelopp");
    var beskrivning = $("#kalktext");
    var rabattrad = $("#kalkrabatt");

    function rakna() {
      var tjanst = $("#kalktjanst");
      var kilo = $("#kalkvikt");
      if (!tjanst || !belopp) return;
      var vald = priser[tjanst.value];
      if (!vald) { belopp.textContent = "–"; if (beskrivning) beskrivning.textContent = "Välj en åtgärd."; return; }
      var vikt = Math.max(0, Math.min(90, parseFloat(kilo && kilo.value) || 0));
      var summa = Math.round(vald.bas + vald.perKilo * vikt);
      var kronor = new Intl.NumberFormat("sv-SE").format(summa);
      belopp.textContent = kronor + " kr";
      if (beskrivning) {
        beskrivning.textContent = vald.text + (vald.perKilo ? " för " + vikt + " kg" : "") +
          ". Preliminärt pris inklusive moms; slutpriset sätts efter undersökning.";
      }
      if (rabattrad) {
        rabattrad.textContent = summa >= 3000
          ? "Över 3 000 kr: delbetalning i 6 månader utan ränta, 0 kr i uppläggningsavgift."
          : "Under 3 000 kr betalas på plats. Kort, Swish eller faktura.";
      }
    }

    form.addEventListener("input", rakna);
    form.addEventListener("change", rakna);
    rakna();
  }

  /* ---------------------------------------------------------- 7. Start */
  function start() {
    initMeny();
    initHuvud();
    initDygn();
    initAvsloja();
    initForm();
    initKalkyl();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
