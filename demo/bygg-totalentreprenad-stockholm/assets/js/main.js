/* ==========================================================================
   Bygg & Entreprenad Stockholm — main.js
   En fil för alla sidor: meny, innehållsvisning, formulär, kalkylator,
   projektfilter. Sidorna laddar samma fil; inget skrivs i sidorna själva.

   ---------------------------------------------------------------------------
   BYT UT VID DRIFTSÄTTNING (enda stället):
   LEAD_ENDPOINT nedan tar emot offertförfrågningar som JSON (POST).
   Servern måste svara 2xx och tillåta CORS. Exempel på egen endpoint:
       var LEAD_ENDPOINT = "https://formspree.io/f/xxxxxxx";
   ========================================================================== */

var LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=bygg-totalentreprenad-stockholm"; /* <-- kundens endpoint */
var SITE_KEY = "bygg-entreprenad-stockholm";

var KONTAKT = {
  foretag: "Bygg & Entreprenad Stockholm",
  telefon: "+46 70 000 00 00",     /* platshållare — byts mot kundens nummer */
  epost: "info@exempel.se",        /* platshållare — byts mot kundens adress */
  ort: "Stockholm"
};

/* Prisläge per projekttyp (kr/m², entreprenad utan moms, Stockholm 2026).
   Samma intervall som står i texten på tjänstesidorna och i räkneexemplet. */
var PRISER = {
  tillbyggnad: { namn: "Tillbyggnad",        lag: 19000, hog: 28000, minsta: 12, enhet: "m² byggnadsarea" },
  badrum:      { namn: "Badrum",             lag: 17000, hog: 30000, minsta: 4,  enhet: "m² golvarea" },
  kok:         { namn: "Kök",                lag: 14000, hog: 26000, minsta: 8,  enhet: "m² golvarea" },
  vind:        { namn: "Vindsinredning",     lag: 12000, hog: 21000, minsta: 15, enhet: "m² vindsyta" },
  fasad:       { namn: "Fasad",              lag: 1600,  hog: 3400,  minsta: 40, enhet: "m² fasad" },
  altan:       { namn: "Altan",              lag: 3800,  hog: 7200,  minsta: 8,  enhet: "m² trallyta" }
};

var STANDARD_FAKTOR = { enkel: 0.9, standard: 1.0, hog: 1.22 };

(function () {
  "use strict";

  /* ---------------------------------------------------- 0. Visa innehållet */
  /* Innehållet får aldrig fastna dolt: en timer tvingar fram allt efter 1,2 s
     även om IntersectionObserver inte hinner köra (skärmbild, crawler, äldre
     webbläsare). */
  var reveal = document.querySelectorAll(".reveal");
  if (reveal.length) {
    var visaAllt = function () {
      for (var i = 0; i < reveal.length; i++) reveal[i].classList.add("is-visible");
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (poster) {
        poster.forEach(function (post) {
          if (post.isIntersecting) {
            post.target.classList.add("is-visible");
            io.unobserve(post.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      for (var j = 0; j < reveal.length; j++) io.observe(reveal[j]);
    } else {
      visaAllt();
    }
    window.setTimeout(visaAllt, 1200);
  }

  /* --------------------------------------------------------------- 1. Meny */
  var burger = document.getElementById("menyKnapp");
  var drawer = document.getElementById("meny");
  var skrim = document.getElementById("skrim");
  var stang = document.getElementById("menyStang");
  var senastFokus = null;

  function oppnaMeny() {
    if (!drawer) return;
    senastFokus = document.activeElement;
    drawer.classList.add("drawer--open");
    drawer.removeAttribute("hidden");
    if (skrim) skrim.classList.add("skrim--open");
    if (burger) burger.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    var forsta = drawer.querySelector("a, button");
    if (forsta) forsta.focus();
  }

  function stangMeny() {
    if (!drawer) return;
    drawer.classList.remove("drawer--open");
    if (skrim) skrim.classList.remove("skrim--open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    if (senastFokus && senastFokus.focus) senastFokus.focus();
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      if (drawer.classList.contains("drawer--open")) { stangMeny(); } else { oppnaMeny(); }
    });
  }
  if (skrim) skrim.addEventListener("click", stangMeny);
  if (stang) stang.addEventListener("click", stangMeny);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("drawer--open")) stangMeny();
  });
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a) stangMeny();
    });
  }

  /* --------------------------------------------------- 2. Offertformuläret */
  var form = document.getElementById("offert");
  if (form) {
    var knapp = form.querySelector('[type="submit"]');
    var status = document.getElementById("formStatus");
    var originalText = knapp ? knapp.textContent : "";

    function visaStatus(typ, html) {
      if (!status) return;
      status.className = "form-status form-status--" + typ;
      status.innerHTML = html;
      status.focus && status.focus();
    }

    function markera(falt, fel) {
      var box = falt.closest(".field");
      if (box) box.classList.toggle("field--error", !!fel);
    }

    function validera() {
      var fel = [];
      var krav = form.querySelectorAll("[required]");
      for (var i = 0; i < krav.length; i++) {
        var f = krav[i];
        var tomt = !f.value || !String(f.value).trim();
        var daligt = tomt;
        if (!tomt && f.type === "email") daligt = !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(f.value);
        if (!tomt && f.type === "tel") daligt = String(f.value).replace(/\D/g, "").length < 7;
        markera(f, daligt);
        if (daligt) fel.push(f);
      }
      return fel;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fel = validera();
      if (fel.length) {
        visaStatus("err", "Kontrollera de markerade fälten: " + fel.length + " uppgift" +
          (fel.length === 1 ? "" : "er") + " saknas eller ser fel ut.");
        fel[0].focus();
        return;
      }
      var honeypot = form.querySelector('[name="foretagsnamn_extra"]');
      if (honeypot && honeypot.value) return; /* bot */

      var data = {};
      var inputs = form.querySelectorAll("input, select, textarea");
      for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        if (!el.name || el.name === "foretagsnamn_extra") continue;
        if (el.type === "checkbox") { data[el.name] = el.checked; continue; }
        if (el.type === "radio" && !el.checked) continue;
        data[el.name] = el.value;
      }
      data.sida = location.pathname;
      data.tid = new Date().toISOString();
      data.site = SITE_KEY;

      if (knapp) { knapp.disabled = true; knapp.textContent = "Skickar …"; }
      if (status) status.className = "form-status";

      fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (svar) {
        if (!svar.ok) throw new Error("HTTP " + svar.status);
        form.reset();
        visaStatus("ok", "<strong>Tack, " + (data.namn || "du") + "!</strong> Förfrågan är skickad. " +
          "Vi återkommer med ett skriftligt förslag inom 24 timmar på vardagar. " +
          "Brådskande? Ring <a href=\"tel:" + KONTAKT.telefon.replace(/\s/g, "") + "\">" + KONTAKT.telefon + "</a>.");
      }).catch(function () {
        visaStatus("err", "Något gick fel när förfrågan skickades. Försök igen om en stund, " +
          "eller ring <a href=\"tel:" + KONTAKT.telefon.replace(/\s/g, "") + "\">" + KONTAKT.telefon + "</a> " +
          "så tar vi uppgifterna direkt.");
      }).then(function () {
        if (knapp) { knapp.disabled = false; knapp.textContent = originalText; }
      });
    });
  }

  /* ----------------------------------------------------- 3. Projektfiltret */
  var filterRad = document.getElementById("filterRad");
  if (filterRad) {
    var poster = document.querySelectorAll("[data-typ]");
    var antal = document.getElementById("filterAntal");
    filterRad.addEventListener("click", function (e) {
      var knapp2 = e.target.closest ? e.target.closest(".filter") : null;
      if (!knapp2) return;
      var val = knapp2.getAttribute("data-filter");
      var alla = filterRad.querySelectorAll(".filter");
      for (var i = 0; i < alla.length; i++) alla[i].setAttribute("aria-pressed", alla[i] === knapp2 ? "true" : "false");
      var synliga = 0;
      for (var j = 0; j < poster.length; j++) {
        var visa = val === "alla" || poster[j].getAttribute("data-typ") === val;
        poster[j].hidden = !visa;
        if (visa) synliga++;
      }
      if (antal) antal.textContent = synliga + " projekt";
    });
  }

  /* -------------------------------------------------------- 4. Kalkylatorn */
  var kalkyl = document.getElementById("kalkyl");
  if (kalkyl) {
    var utTyp = document.getElementById("utTyp");
    var utRange = document.getElementById("utRange");
    var utRader = document.getElementById("utRader");
    var utText = document.getElementById("utText");
    var typVal = document.getElementById("k-typ");
    var areaVal = document.getElementById("k-area");
    var areaUt = document.getElementById("k-area-ut");
    var stdVal = document.getElementById("k-standard");
    var kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

    function rakna() {
      var t = PRISER[typVal.value] || PRISER.tillbyggnad;
      var area = Math.max(t.minsta, Number(areaVal.value) || t.minsta);
      var faktor = STANDARD_FAKTOR[stdVal.value] || 1;
      var lag = t.lag * area * faktor;
      var hog = t.hog * area * faktor;
      utTyp.textContent = t.namn;
      utRange.textContent = kr.format(Math.round(lag / 1000) * 1000) + " – " + kr.format(Math.round(hog / 1000) * 1000) + " kr";
      var rader = "";
      rader += "<li><span>Area</span><span>" + kr.format(area) + " " + t.enhet + "</span></li>";
      rader += "<li><span>Pris per " + t.enhet.replace(" ", " ") + "</span><span>" + kr.format(t.lag) + " – " + kr.format(t.hog) + " kr</span></li>";
      rader += "<li><span>Standardnivå</span><span>" + stdVal.options[stdVal.selectedIndex].text + "</span></li>";
      rader += "<li><span>Moms (25 %)</span><span>" + kr.format(Math.round(lag * 0.25)) + " – " + kr.format(Math.round(hog * 0.25)) + " kr</span></li>";
      utRader.innerHTML = rader;
      utText.textContent = "Intervallet är ett riktmärke för " + t.namn.toLowerCase() + " på " + kr.format(area) + " " +
        t.enhet + " i Stockholmsområdet, räknat utan moms. Efter besiktning lämnar vi ett fast pris — det är summan som gäller, inte intervallet.";
    }

    function uppdateraArea() {
      var t = PRISER[typVal.value] || PRISER.tillbyggnad;
      areaVal.min = t.minsta;
      if (Number(areaVal.value) < t.minsta) areaVal.value = t.minsta;
      areaUt.textContent = areaVal.value + " " + t.enhet;
      rakna();
    }

    typVal.addEventListener("change", uppdateraArea);
    areaVal.addEventListener("input", uppdateraArea);
    stdVal.addEventListener("change", rakna);
    uppdateraArea();

    var tillOffert = document.getElementById("tillOffert");
    if (tillOffert) {
      tillOffert.addEventListener("click", function () {
        var t = PRISER[typVal.value];
        try {
          sessionStorage.setItem("bygg_kalkyl", JSON.stringify({
            typ: t.namn, area: areaVal.value, standard: stdVal.value,
            intervall: utRange.textContent
          }));
        } catch (e) { /* privat läge — ignoreras */ }
      });
    }
  }

  /* Förifyll offertformuläret om besökaren kommer från kalkylatorn */
  if (form) {
    var sparat = null;
    try { sparat = sessionStorage.getItem("bygg_kalkyl"); } catch (e) { sparat = null; }
    if (sparat) {
      try {
        var k = JSON.parse(sparat);
        var fTyp = form.querySelector('[name="projekttyp"]');
        var fArea = form.querySelector('[name="beskrivning"]');
        if (fTyp && k.typ) {
          for (var o = 0; o < fTyp.options.length; o++) {
            if (fTyp.options[o].text.toLowerCase().indexOf(k.typ.toLowerCase().split(" ")[0]) === 0) { fTyp.selectedIndex = o; break; }
          }
        }
        if (fArea && !fArea.value) {
          fArea.value = "Beräknat intervall från kalkylatorn: " + k.intervall +
            " (" + k.typ + ", " + k.area + " m², standard " + k.standard + ").";
        }
        sessionStorage.removeItem("bygg_kalkyl");
      } catch (e) { /* ignoreras */ }
    }
  }

  /* --------------------------------------------------------- 5. Småsaker */
  var ar = document.querySelectorAll("[data-ar]");
  var nu = new Date().getFullYear();
  for (var a = 0; a < ar.length; a++) ar[a].textContent = nu;

  var tillTopp = document.querySelector(".to-top");
  if (tillTopp) {
    tillTopp.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
