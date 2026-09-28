/* ==========================================================================
   Frisör & Barberare Stockholm — beteende (mobilmeny, FAQ, bokningsformulär)
   --------------------------------------------------------------------------
   BYT ENDPOINT VID DRIFTSÄTTNING:
   LEAD_ENDPOINT nedan är salongens bokningsmottagare i demoläget.
   Byt till kundens egen mottagare (Formspree, egen API, bokningssystem):
     var LEAD_ENDPOINT = "https://formspree.io/f/xxxxxxx";
   Mottagaren MÅSTE svara 2xx och tillåta CORS.
   ========================================================================== */

var LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=frisor-barberare-stockholm";
var SITE_KEY = "frisor-barberare-stockholm";

/* ---------------------------------------------------------------------------
   KONTAKTUPPGIFTER — DEMOPLATSHÅLLARE, EN källa per värde.
   Numret/mejlen är påhittade och MÅSTE bytas mot salongens riktiga uppgifter
   före publicering. Samma nummer finns i shell.py (TEL_VISNING).
   --------------------------------------------------------------------------- */
var TEL_VISNING = "+46 70 000 00 00";
var TEL_HREF = "tel:+46700000000";
var EPOST = "info@exempel.se";

function telLank() { return '<a href="' + TEL_HREF + '">' + TEL_VISNING + "</a>"; }
function epostLank() { return '<a href="mailto:' + EPOST + '">' + EPOST + "</a>"; }

(function () {
  "use strict";

  /* ------------------------------- meny ------------------------------- */
  var knapp = document.getElementById("menyKnapp");
  var meny = document.getElementById("mobilmeny");
  var stang = document.getElementById("menyStang");
  var overdrag = document.getElementById("menyOverdrag");

  function stangMeny() {
    if (!meny || !knapp) return;
    meny.classList.remove("mobilmeny--oppen");
    meny.setAttribute("aria-hidden", "true");
    knapp.setAttribute("aria-expanded", "false");
  }

  if (knapp && meny) {
    knapp.addEventListener("click", function () {
      var oppen = meny.classList.toggle("mobilmeny--oppen");
      knapp.setAttribute("aria-expanded", oppen ? "true" : "false");
      meny.setAttribute("aria-hidden", oppen ? "false" : "true");
    });
    if (stang) stang.addEventListener("click", stangMeny);
    if (overdrag) overdrag.addEventListener("click", stangMeny);
    meny.addEventListener("click", function (e) {
      if (e.target.closest("a")) stangMeny();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") stangMeny();
    });
  }

  /* ------------------------------ FAQ ------------------------------- */
  Array.prototype.slice.call(document.querySelectorAll(".faqfraga")).forEach(function (q) {
    var svar = q.parentNode.querySelector(".faqsvar");
    if (!svar) return;
    q.setAttribute("aria-expanded", "false");
    svar.hidden = true;
    q.addEventListener("click", function () {
      var oppen = q.getAttribute("aria-expanded") === "true";
      q.setAttribute("aria-expanded", oppen ? "false" : "true");
      svar.hidden = oppen;
    });
  });

  /* ------------------------------ reveal ---------------------------- */
  var block = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (block.length) {
    var visa = function (el) { el.classList.add("is-synlig"); };
    if (!("IntersectionObserver" in window)) {
      block.forEach(visa);
    } else {
      var io = new IntersectionObserver(function (poster) {
        poster.forEach(function (p) {
          if (p.isIntersecting) { visa(p.target); io.unobserve(p.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      block.forEach(function (el) { io.observe(el); });
      window.setTimeout(function () { block.forEach(visa); }, 1500);
    }
  }

  /* ---------------------------- öppettider --------------------------- */
  /* Dagens rad markeras i öppettidstabellen (1 = måndag … 7 = söndag). */
  var idag = new Date().getDay() === 0 ? 7 : new Date().getDay();
  Array.prototype.slice.call(document.querySelectorAll(".oppettidrad")).forEach(function (rad) {
    if (rad.getAttribute("data-dag") === String(idag)) rad.classList.add("oppettidrad--idag");
  });

  /* --------------------------- bokningsformulär ---------------------- */
  var form = document.getElementById("bokningsForm");
  var ruta = document.getElementById("formSvar");

  function visaSvar(rubrik, text, fel) {
    if (!ruta) return;
    ruta.className = "meddelanderuta" + (fel ? " meddelanderuta--fel" : "");
    ruta.innerHTML = "<strong>" + rubrik + "</strong><br>" + text;
    ruta.hidden = false;
    ruta.focus();
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      /* honungsfälla: osynligt fält som bara botar fyller i */
      var honung = form.querySelector('[name="webbplats"]');
      if (honung && honung.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new URLSearchParams(new FormData(form));
      data.set("site", SITE_KEY);
      data.set("sida", window.location.pathname.split("/").pop() || "index.html");
      data.set("skickat", new Date().toISOString());

      var skicka = form.querySelector('[type="submit"]');
      if (skicka) { skicka.disabled = true; skicka.textContent = "Skickar …"; }

      fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: data.toString()
      })
        .then(function (svar) {
          if (!svar.ok) throw new Error("HTTP " + svar.status);
          return svar.json().catch(function () { return {}; });
        })
        .then(function () {
          /* #formSvar ligger INUTI formuläret. När form.hidden sätts göms även
             kvittot, och kunden fick ingen bekräftelse alls (mätt 2026-09-28:
             p#formSvar hade offsetParent null efter skickat formulär). Flytta
             ut rutan till formulärets förälder innan den visas. */
          if (ruta && ruta.parentNode === form && form.parentNode) {
            form.parentNode.insertBefore(ruta, form.nextSibling);
          }
          form.hidden = true;
          visaSvar(
            "Tack — din förfrågan är skickad.",
            "Vi bekräftar tiden via sms inom en arbetsdag. Brådskande? Ring " +
              telLank() + '.',
            false
          );
        })
        .catch(function () {
          if (skicka) { skicka.disabled = false; skicka.textContent = "Skicka bokningsförfrågan"; }
          visaSvar(
            "Kunde inte skicka just nu.",
            "Formuläret nådde inte fram. Ring " +
              telLank() + " eller mejla " +
              epostLank() + ", så bokar vi tiden direkt.",
            true
          );
        });
    });
  }

  /* ---------------------------- priskalkylator ---------------------- */
  /* Räknar ut ett riktmärkespris ur vald tjänst (select med optgroup) plus
     kryssrutor, och skriver sammanfattningen till bokningsformuläret så att
     förfrågan som skickas in innehåller exakt det val kunden gjorde. */
  var kalTjanst = document.getElementById("kalkylTjanst");
  var kalPris = document.getElementById("kalkylPris");
  var kalTid = document.getElementById("kalkylTid");
  var kalSkicka = document.getElementById("kalkylSkicka");

  function kalSumma() {
    var summa = 0;
    var minuter = 0;
    var delar = [];
    var vald = kalTjanst.options[kalTjanst.selectedIndex];
    if (vald) {
      summa += parseInt(vald.getAttribute("data-pris") || "0", 10);
      minuter += parseInt(vald.getAttribute("data-tid") || "0", 10);
      delar.push(vald.value);
    }
    Array.prototype.slice.call(document.querySelectorAll("[name=\"kalkyl_tillagg\"]")).forEach(function (k) {
      if (!k.checked) return;
      summa += parseInt(k.getAttribute("data-pris") || "0", 10);
      minuter += parseInt(k.getAttribute("data-tid") || "0", 10);
      delar.push(k.value);
    });
    return { kronor: summa, minuter: minuter, delar: delar };
  }

  function kalVisa() {
    if (!kalTjanst || !kalPris) return;
    var s = kalSumma();
    kalPris.textContent = String(s.kronor).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kr";
    if (kalTid) {
      kalTid.textContent = "Cirka " + s.minuter + " minuter i stolen";
    }
    var dolt = document.getElementById("kalkylVal");
    if (dolt) dolt.value = s.delar.join(", ") + " (" + s.kronor + " kr)";
    return s;
  }

  if (kalTjanst) {
    kalTjanst.addEventListener("change", kalVisa);
    Array.prototype.slice.call(document.querySelectorAll("[name=\"kalkyl_tillagg\"]")).forEach(function (k) {
      k.addEventListener("change", kalVisa);
    });
    kalVisa();
  }

  if (kalSkicka) {
    kalSkicka.addEventListener("click", function () {
      var s = kalSumma();
      var falt = document.getElementById("meddelande");
      var text = "Priskalkylatorn: " + s.delar.join(", ") + " = cirka " + s.kronor +
                 " kr och " + s.minuter + " minuter.";
      if (falt && !falt.value) falt.value = text;
      var mal = document.getElementById("bokning");
      if (mal) {
        mal.scrollIntoView({ behavior: "smooth", block: "start" });
        if (falt) falt.focus({ preventScroll: true });
      }
    });
  }

  /* -------------------------------- år ------------------------------- */
  var ar = document.getElementById("ar");
  if (ar) ar.textContent = String(new Date().getFullYear());
})();
