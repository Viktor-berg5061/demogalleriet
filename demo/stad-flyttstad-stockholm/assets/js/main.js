/* ==========================================================================
   Städ & Flyttstäd Stockholm — main.js
   Delas av alla nio sidor. Skrivs bara här, inte i sidorna.

   INNAN SAJTEN PUBLICERAS: byt ut LEAD_ENDPOINT och KONTAKT nedan mot kundens
   egna adresser. Allt annat kan lämnas som det är.
   ========================================================================== */

/* ------------------------------------------------- 1. BYT UT DESSA VÄRDEN */
/* Formulärets endpoint: varje inskickad bokning POST:as som JSON hit.
   Svaret måste vara HTTP 200–299, annars visas felmeddelandet för besökaren. */
const LEAD_ENDPOINT = "https://hermes-web-db.webbtjanst.com/lead?site=stad-flyttstad-stockholm"; // <-- kundens formulärendpoint
const KONTAKT = {
  foretag: "Städ & Flyttstäd Stockholm",
  telefon: "+46 70 494 90 87",   // samma nummer som i sidfoten och på kontaktsidan
  epost: "vberg024@gmail.com",   // samma adress som i sidfoten och på kontaktsidan
  ort: "Stockholm"
};

/* Priser per timme före RUT, tid per kvadratmeter och minsta debitering.
   Samma tal som står i texten på sajten. */
const PRISER = {
  flyttstad:   { namn: "Flyttstäd",   krTimme: 649, minuterPerM2: 8,   minTimmar: 4,   enhet: "m²" },
  hemstad:     { namn: "Hemstäd",     krTimme: 549, minuterPerM2: 2.7, minTimmar: 1.5, enhet: "m²" },
  storstaning: { namn: "Storstädning", krTimme: 599, minuterPerM2: 4,  minTimmar: 2,   enhet: "m²" },
  fonsterputs: { namn: "Fönsterputs", krTimme: 593, minuterPerM2: 0,   minTimmar: 1,   enhet: "bågar", perBage: 79, minDebitering: 1200 }
};
const RUT_ANDEL = 0.5;

/* ------------------------------------------------------ 2. Små hjälpmedel */
/* Talformat (runda 5, EN regel för hela sajten):
   jämna kronor skrivs utan öre ("2 995 kr") och belopp med öre skrivs alltid med
   två decimaler ("1 497,50 kr"). Kalkylatorn, tabellerna och texterna använder
   samma regel, så samma belopp skrivs aldrig på två olika sätt på samma sida. */
const krHel = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const krOre = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tal = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 1 });

function pengar(varde) {
  const avrundat = Math.round(varde * 100) / 100;
  const format = Number.isInteger(avrundat) ? krHel : krOre;
  return format.format(avrundat) + " kr";
}
function timmarText(h) {
  const avrundat = Math.round(h * 2) / 2;
  const hel = Math.floor(avrundat);
  const halv = avrundat - hel >= 0.5;
  if (avrundat < 1) return "mindre än 1 timme";
  return hel + (halv ? " och en halv timme" : " timmar");
}
function efterRut(brutto) { return brutto * (1 - RUT_ANDEL); }

/* Tiden avrundas till närmaste halvtimme INNAN priset räknas ut.
   Sajtens alla pristabeller och texter är skrivna efter den regeln, så
   räknaren och tabellerna visar alltid samma tal för samma yta.
   Ändra aldrig den här regeln utan att räkna om texterna. */
function avrundaHalvtimme(h) { return Math.round(h * 2) / 2; }


/* ------------------------------------------------------- 3. Mobilmenyn */
(function meny() {
  const knapp = document.querySelector(".burger");
  const drawer = document.querySelector(".drawer");
  const backdrop = document.querySelector(".backdrop");
  const stang = document.querySelector(".drawer-stang");
  if (!knapp || !drawer) return;
  const knappEtikett = knapp.querySelector(".burger-text");

  const oppna = () => {
    document.body.classList.add("drawer-oppen");
    knapp.setAttribute("aria-expanded", "true");
    if (knappEtikett) knappEtikett.textContent = "Stäng";
    const forsta = drawer.querySelector("a");
    if (forsta) forsta.focus({ preventScroll: true });
  };
  const stang_ = () => {
    document.body.classList.remove("drawer-oppen");
    knapp.setAttribute("aria-expanded", "false");
    if (knappEtikett) knappEtikett.textContent = "Meny";
    knapp.focus({ preventScroll: true });
  };

  knapp.addEventListener("click", () => {
    document.body.classList.contains("drawer-oppen") ? stang_() : oppna();
  });
  if (stang) stang.addEventListener("click", stang_);
  if (backdrop) backdrop.addEventListener("click", stang_);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("drawer-oppen")) stang_();
  });
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    document.body.classList.remove("drawer-oppen");
    knapp.setAttribute("aria-expanded", "false");
    if (knappEtikett) knappEtikett.textContent = "Meny";
  }));
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992 && document.body.classList.contains("drawer-oppen")) {
      document.body.classList.remove("drawer-oppen");
      knapp.setAttribute("aria-expanded", "false");
      if (knappEtikett) knappEtikett.textContent = "Meny";
    }
  });
})();

/* --------------------------------------------- 4. Markera aktuell sida */
(function aktuell() {
  const fil = location.pathname.split("/").pop() || "index.html";
  const mapp = location.pathname.includes("/tjanster/") ? "tjanster/" : "";
  document.querySelectorAll(".meny a, .drawer a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const slut = href.split("/").pop();
    const iTjanster = href.includes("tjanster/");
    if (slut === fil && (iTjanster ? mapp === "tjanster/" || mapp === "" : true)) {
      if (slut !== "" && slut !== "#") a.setAttribute("aria-current", "page");
    }
  });
})();

/* -------------------------------------------------------- 5. Formuläret */
(function formulär() {
  const form = document.getElementById("bokning");
  if (!form) return;
  const hjalp = document.getElementById("formhjalp");
  const knapp = form.querySelector("button[type=submit]");

  const datum = form.querySelector('input[type="date"]');
  if (datum) {
    const tidigast = new Date(Date.now() + 3 * 864e5);
    datum.min = tidigast.toISOString().slice(0, 10);
  }

  const visa = (text, typ) => {
    if (!hjalp) return;
    hjalp.textContent = text;
    hjalp.hidden = false;
    hjalp.style.color = typ === "fel" ? "var(--larm)" : "var(--citron-djup)";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.tjanst || !data.datum || !data.adress || !data.yta || !data.namn || !data.telefon) {
      visa("Fyll i tjänst, datum, adress, storlek, namn och telefon så kan vi räkna på uppdraget.", "fel");
      return;
    }
    if (!form.querySelector("#villkor")?.checked) {
      visa("Bocka i att vi får spara uppgifterna för att kunna svara på din bokning.", "fel");
      return;
    }
    knapp.disabled = true;
    knapp.textContent = "Skickar …";
    try {
      const svar = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sida: location.pathname, tid: new Date().toISOString() })
      });
      if (!svar.ok) throw new Error("HTTP " + svar.status);
      form.reset();
      visa("Tack! Bokningen är skickad. Vi svarar med fast pris inom 2 timmar på vardagar (07–18).", "ok");
    } catch (fel) {
      visa("Något gick fel när bokningen skickades. Ring " + KONTAKT.telefon +
           " eller mejla " + KONTAKT.epost + " så tar vi bokningen direkt.", "fel");
    } finally {
      knapp.disabled = false;
      knapp.textContent = "Skicka bokningsförfrågan";
    }
  });
})();

/* ----------------------------------------------------- 6. RUT-räknaren */
(function räknare() {
  const rot = document.getElementById("rutkalkyl");
  if (!rot) return;
  const valj = document.getElementById("rut-tjanst");
  const reglage = document.getElementById("rut-yta");
  const utTid = document.getElementById("rut-tid");
  const utFore = document.getElementById("rut-fore");
  const utEfter = document.getElementById("rut-efter");
  const etikett = reglage ? reglage.closest("label") : null;

  function berakna() {
    const nyckel = valj.value;
    const p = PRISER[nyckel];
    const varde = Number(reglage.value);
    let timmar, brutto;

    if (nyckel === "fonsterputs") {
      const bage = Math.max(4, Math.round(varde / 1.54)); // reglaget går 20–150 m²-skala
      brutto = Math.max(bage * p.perBage, p.minDebitering);
      timmar = Math.max(1, bage / 7.5);
      utTid.textContent = bage + " bågar, cirka " + tal.format(Math.round(timmar * 10) / 10) + " timmar";
    } else {
      timmar = avrundaHalvtimme(Math.max(p.minTimmar, (varde * p.minuterPerM2) / 60));
      brutto = timmar * p.krTimme;
      utTid.textContent = timmarText(timmar);
    }
    utFore.textContent = pengar(brutto);
    utEfter.textContent = pengar(efterRut(brutto));
    if (etikett) {
      const text = etikett.childNodes[0];
      if (text) text.nodeValue = nyckel === "fonsterputs" ? "Antal fönsterbågar (20–150) " : "Yta i m² (20–150) ";
    }
  }

  valj.addEventListener("change", berakna);
  reglage.addEventListener("input", berakna);
  berakna();
})();

/* ------------------------------------- 7. Datum och år i sidfoten (smått) */
(function ar() {
  document.querySelectorAll("[data-ar]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
