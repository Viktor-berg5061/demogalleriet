/* ==========================================================================
   Trädgård & Anläggning Stockholm — beteende
   --------------------------------------------------------------------------
   BYT ENDPOINT VID DRIFTSÄTTNING:
   LEAD_ENDPOINT nedan pekar på web-loopens lokala lead-server (demoläge).
   Ersätt med kundens produktionsendpoint, t.ex. Formspree eller egen API:
     var LEAD_ENDPOINT = "https://formspree.io/f/xxxxxxx";
   Servern MÅSTE svara 2xx och tillåta CORS (Access-Control-Allow-Origin).
   ========================================================================== */

var LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=tradgard-anlaggning-stockholm";
var SITE_KEY = "tradgard-anlaggning-stockholm";

(function () {
  "use strict";

  /* ------------------------------- meny ------------------------------- */
  var knapp = document.getElementById("menyKnapp");
  var meny = document.getElementById("meny");
  // Skrimen (det mörka överdraget bakom mobilmenyn) är frivillig markup:
  // saknas den ska menyn fungera precis som förut.
  var skrim = document.getElementById("skrim");

  function visaSkrim(synlig) {
    if (!skrim) return;
    if (synlig) {
      skrim.classList.add("skrim--synlig");
    } else {
      skrim.classList.remove("skrim--synlig");
    }
  }

  function stangMeny() {
    if (!meny || !knapp) return;
    meny.classList.remove("meny--oppen");
    knapp.setAttribute("aria-expanded", "false");
    visaSkrim(false);
  }

  if (knapp && meny) {
    knapp.addEventListener("click", function () {
      var oppen = meny.classList.toggle("meny--oppen");
      knapp.setAttribute("aria-expanded", oppen ? "true" : "false");
      visaSkrim(oppen);
    });
    if (skrim) {
      skrim.addEventListener("click", function () { stangMeny(); });
    }
    meny.addEventListener("click", function (e) {
      if (e.target.closest("a")) stangMeny();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") stangMeny();
    });
    document.addEventListener("click", function (e) {
      if (!meny.classList.contains("meny--oppen")) return;
      if (e.target.closest("#meny") || e.target.closest("#menyKnapp")) return;
      stangMeny();
    });
  }

  /* ------------------------------ linjal ------------------------------ */
  var fyllnad = document.getElementById("linjalfyllnad");
  if (fyllnad) {
    var rita = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      fyllnad.style.width = Math.max(0, Math.min(100, p)) + "%";
    };
    rita();
    window.addEventListener("scroll", rita, { passive: true });
    window.addEventListener("resize", rita);
  }

  /* ------------------------------ reveal ------------------------------ */
  var kort = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (kort.length) {
    var visaElement = function (el) { el.classList.add("is-synlig"); };
    if (!("IntersectionObserver" in window)) {
      kort.forEach(visaElement);
    } else {
      var io = new IntersectionObserver(function (poster) {
        poster.forEach(function (p) {
          if (p.isIntersecting) { visaElement(p.target); io.unobserve(p.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      kort.forEach(function (el) { io.observe(el); });
      // skyddsnät: allt synligt inom 1,8 s även om observationen inte hinner
      window.setTimeout(function () { kort.forEach(visaElement); }, 1800);
    }
  }

  /* --------------------------- säsongshjulet --------------------------- */
  var hjul = document.getElementById("sasongshjul");
  var nav = document.getElementById("hjulnav");
  var niva = document.getElementById("hjulniva");
  if (hjul) {
    var kakel = Array.prototype.slice.call(hjul.querySelectorAll(".kakel"));
    var valj = function (nr) {
      kakel.forEach(function (k) {
        var traff = k.getAttribute("data-manad") === String(nr);
        k.classList.toggle("kakel--vald", traff);
        k.setAttribute("aria-pressed", traff ? "true" : "false");
      });
      document.querySelectorAll(".sasongskort").forEach(function (k) {
        k.classList.toggle("sasongskort--aktiv", k.getAttribute("data-manad") === String(nr));
      });
      var mk = document.querySelector('.sasongskort[data-manad="' + nr + '"]');
      if (mk && niva) niva.textContent = (mk.getAttribute("data-namn") || "").slice(0, 3).toUpperCase();
      if (mk && nav) nav.textContent = mk.getAttribute("data-namn") || "";
    };
    kakel.forEach(function (k) {
      k.addEventListener("click", function () { valj(k.getAttribute("data-manad")); });
      k.addEventListener("mouseenter", function () { valj(k.getAttribute("data-manad")); });
    });
    document.querySelectorAll(".sasongskort").forEach(function (k) {
      k.addEventListener("mouseenter", function () { valj(k.getAttribute("data-manad")); });
      k.addEventListener("focusin", function () { valj(k.getAttribute("data-manad")); });
    });
    var nu = new Date().getMonth() + 1;
    valj(nu);
  }

  /* ------------------------------ formulär ------------------------------ */
  var form = document.getElementById("offertForm");
  var ruta = document.getElementById("formSvar");

  function visaMeddelande(rubrik, text, fel) {
    if (!ruta) { return; }
    ruta.className = "meddelanderuta falt--helt" + (fel ? " meddelanderuta--fel" : "");
    ruta.innerHTML = "<strong>" + rubrik + "</strong><br>" + text;
    ruta.hidden = false;
    ruta.focus();
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (form.querySelector('[name="foretag"]') && form.querySelector('[name="foretag"]').value) {
        return; // honungsfälla: tyst stopp
      }

      // Grind: släpp aldrig iväg en POST förrän webbläsaren själv säger att
      // formuläret är giltigt. reportValidity() visar kravmeddelandet vid
      // första ogiltiga fält och knappen hinner aldrig bli "Skickar …".
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new URLSearchParams(new FormData(form));
      data.set("site", SITE_KEY);
      data.set("sida", "index.html");
      data.set("skickat", new Date().toISOString());

      var knapp2 = form.querySelector('[type="submit"]');
      if (knapp2) { knapp2.disabled = true; knapp2.textContent = "Skickar …"; }

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
          form.hidden = true;
          visaMeddelande(
            "Tack, förfrågan är skickad.",
            "Vi läser den samma arbetsdag och svarar med ett förslag på trädgårdsbesök. Brådskande? Ring " +
              '<a href="tel:+46841051230">+46 8 410 512 30</a>.',
            false
          );
        })
        .catch(function () {
          if (knapp2) { knapp2.disabled = false; knapp2.textContent = "Skicka förfrågan"; }
          visaMeddelande(
            "Kunde inte skicka just nu.",
            "Formuläret nådde inte fram. Ring " +
              '<a href="tel:+46841051230">+46 8 410 512 30</a> eller mejla ' +
              '<a href="mailto:info@tradgard-anlaggning-stockholm.se">info@tradgard-anlaggning-stockholm.se</a> så tar vi det direkt.',
            true
          );
        });
    });
  }

  /* ------------------------------- år ------------------------------- */
  var ar = document.getElementById("ar");
  if (ar) ar.textContent = String(new Date().getFullYear());
})();
