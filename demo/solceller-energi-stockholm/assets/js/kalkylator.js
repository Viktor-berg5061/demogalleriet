/* ==========================================================================
   Kalkylator — ren klientkod, inga externa anrop.
   Räknar uppskattad solelproduktion, besparing och återbetalningstid för ett
   tak i Stockholmsområdet. Alla antaganden ligger i ANTAGANDEN nedan och
   redovisas i klartext på sidan. Siffrorna är en uppskattning, inte en offert.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- ANTAGANDEN (justera om marknaden ändras) */
  var ANTAGANDEN = {
    kwpPerM2: 0.2,          // ~200 W/m² för moderna paneler
    kwhPerKwpAr: 950,       // kWh per installerad kWp och år, optimalt läge Stockholm
    sjalvforbrukningUtanBatteri: 0.40,
    sjalvforbrukningMedBatteri: 0.78,
    saljpris: 0.70,         // kr/kWh för överskott (spot + skattereduktion, förenklat)
    prisPerKwp: 13500,      // kr per installerad kWp, inkl. montage och elarbete
    batteriPris: 62000,     // kr för batteripaket 10 kWh inkl. installation
    gronTeknikSolceller: 0.20,
    gronTeknikBatteri: 0.50,
    tak: 50000              // maxtak grön teknik per år och åtgärd
  };

  var el = function (id) { return document.getElementById(id); };
  var kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
  var dec = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function lutningsfaktor(v) {
    var punkter = [[0, 0.86], [10, 0.91], [20, 0.96], [30, 0.99], [40, 1.0], [45, 1.0], [55, 0.97], [60, 0.94]];
    for (var i = 1; i < punkter.length; i++) {
      if (v <= punkter[i][0]) {
        var a = punkter[i - 1], b = punkter[i];
        var t = (v - a[0]) / (b[0] - a[0]);
        return a[1] + t * (b[1] - a[1]);
      }
    }
    return 0.94;
  }

  var RIKTNING = { syd: 1.0, sydost: 0.96, ost: 0.86 };

  function berakna() {
    var yta = Number(el("c-yta").value);
    var lutning = Number(el("c-lutning").value);
    var riktning = (document.querySelector("input[name=c-riktning]:checked") || {}).value || "syd";
    var forbrukning = Number(el("c-forbrukning").value);
    var elpris = Number(el("c-elpris").value);
    var batteri = (document.querySelector("input[name=c-batteri]:checked") || {}).value === "ja";
    var agare = (document.querySelector("input[name=c-agare]:checked") || {}).value === "ja";

    var kwp = yta * ANTAGANDEN.kwpPerM2;
    var produktion = kwp * ANTAGANDEN.kwhPerKwpAr * lutningsfaktor(lutning) * (RIKTNING[riktning] || 1);
    var sjalvforbrukningsandel = batteri
      ? ANTAGANDEN.sjalvforbrukningMedBatteri
      : ANTAGANDEN.sjalvforbrukningUtanBatteri;

    var overlapp = Math.min(produktion, forbrukning);
    var egenanvant = overlapp * sjalvforbrukningsandel;
    var overskott = produktion - egenanvant;
    var besparing = egenanvant * elpris + overskott * ANTAGANDEN.saljpris;

    var solkostnad = kwp * ANTAGANDEN.prisPerKwp;
    var batterikostnad = batteri ? ANTAGANDEN.batteriPris : 0;
    var investering = solkostnad + batterikostnad;

    var avdrag = 0;
    if (agare) {
      avdrag = Math.min(solkostnad * ANTAGANDEN.gronTeknikSolceller, ANTAGANDEN.tak)
             + Math.min(batterikostnad * ANTAGANDEN.gronTeknikBatteri, ANTAGANDEN.tak);
    }
    var nettoinvestering = investering - avdrag;

    var aterbetalning = besparing > 0 ? nettoinvestering / besparing : 0;
    var tjugofemAr = besparing * 25 - nettoinvestering;
    var egenandel = produktion > 0 ? (egenanvant / produktion) * 100 : 0;

    /* ---- Skriv ut ---- */
    el("r-besparing").textContent = kr.format(Math.round(besparing / 100) * 100);
    el("r-kwp").textContent = dec.format(kwp) + " kWp";
    el("r-produktion").textContent = kr.format(Math.round(produktion / 10) * 10) + " kWh";
    el("r-kostnad").textContent = kr.format(Math.round(nettoinvestering / 1000) * 1000) + " kr";
    el("r-avdrag").textContent = avdrag > 0 ? "−" + kr.format(Math.round(avdrag / 100) * 100) + " kr" : "0 kr";
    el("r-aterbetalning").textContent = dec.format(aterbetalning) + " år";
    el("r-tjugofem").textContent = kr.format(Math.round(tjugofemAr / 1000) * 1000) + " kr";
    el("r-egenanvant").textContent = kr.format(Math.round(egenanvant / 10) * 10) + " kWh";
    el("r-overskott").textContent = kr.format(Math.round(overskott / 10) * 10) + " kWh";
    el("r-produktionsnot").textContent =
      dec.format(kwp) + " kWp × 950 kWh/kWp × lutningsfaktor " + dec.format(lutningsfaktor(lutning)).replace(",", ",") +
      " × riktningsfaktor " + dec.format(RIKTNING[riktning] || 1);

    var bar = el("r-bar");
    if (bar) {
      bar.style.width = egenandel.toFixed(0) + "%";
      var legend = el("legend-egen");
      if (legend) legend.textContent = "Egenanvänd " + egenandel.toFixed(0) + " %";
    }

    /* ---- Sammanfatta till offertformuläret ---- */
    var hidden = el("kalkyl-summary");
    if (hidden) {
      hidden.value =
        "Takyta " + yta + " m², lutning " + lutning + "°, riktning " + riktning +
        ", förbrukning " + forbrukning + " kWh/år, elpris " + String(elpris).replace(".", ",") + " kr/kWh, " +
        (batteri ? "med batteri" : "utan batteri") + ", " + (agare ? "äger bostaden" : "äger inte bostaden") +
        " → " + dec.format(kwp) + " kWp, ca " + kr.format(Math.round(produktion / 10) * 10) + " kWh/år, " +
        "besparing ca " + kr.format(Math.round(besparing / 100) * 100) + " kr/år, " +
        "nettoinvestering ca " + kr.format(Math.round(nettoinvestering / 1000) * 1000) + " kr, " +
        "återbetalning ca " + dec.format(aterbetalning) + " år.";
    }
  }

  function bind(input, out, suffix, formatter) {
    function update() {
      out.textContent = formatter ? formatter(input.value) : input.value + suffix;
      var pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty("--fill", pct.toFixed(1) + "%");
    }
    input.addEventListener("input", function () { update(); berakna(); });
    update();
  }

  function init() {
    if (!el("c-yta")) return;

    bind(el("c-yta"), el("v-yta"), " m²");
    bind(el("c-lutning"), el("v-lutning"), "°");
    bind(el("c-forbrukning"), el("v-forbrukning"), " kWh/år",
      function (v) { return kr.format(Number(v)); });
    bind(el("c-elpris"), el("v-elpris"), " kr/kWh",
      function (v) { return Number(v).toFixed(2).replace(".", ",") + " kr/kWh"; });

    Array.prototype.forEach.call(
      document.querySelectorAll("#kalkyl input[type=radio]"),
      function (r) { r.addEventListener("change", berakna); }
    );

    var reset = el("c-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        var form = el("kalkyl");
        form.reset();
        Array.prototype.forEach.call(form.querySelectorAll("input[type=range]"), function (input) {
          var pct = ((input.value - input.min) / (input.max - input.min)) * 100;
          input.style.setProperty("--fill", pct.toFixed(1) + "%");
        });
        el("v-yta").textContent = el("c-yta").value + " m²";
        el("v-lutning").textContent = el("c-lutning").value + "°";
        el("v-forbrukning").textContent = kr.format(Number(el("c-forbrukning").value));
        el("v-elpris").textContent = Number(el("c-elpris").value).toFixed(2).replace(".", ",") + " kr/kWh";
        berakna();
      });
    }

    berakna();
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(init);
})();
