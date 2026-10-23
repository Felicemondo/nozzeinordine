(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(function () { root.classList.add("loaded"); });

  /* ---------- la data del sì: scadenze calcolate sul giorno scelto ---------- */
  var PHASES = [
    { t: "12+ mesi prima", d: "Data, budget e location" },
    { t: "9-11 mesi prima", d: "Fornitori principali e preventivi" },
    { t: "6-8 mesi prima", d: "Save the date e abiti" },
    { t: "3-5 mesi prima", d: "Dettagli, menù e inviti" },
    { t: "1-2 mesi prima", d: "Conferme finali e saldi" },
    { t: "Settimana del sì", d: "Scaletta e responsabili" }
  ];
  var MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    if (x.getDate() !== d.getDate()) x = new Date(d.getFullYear(), d.getMonth() + n + 1, 0);
    return x;
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function fmt(d) { return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear(); }
  function parseDay(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function floor(wedding, today) {
    var b = [addMonths(wedding, -12), addMonths(wedding, -9), addMonths(wedding, -6), addMonths(wedding, -3), addDays(wedding, -7), wedding];
    var current = 0;
    while (current < 5 && today > b[current]) current++;
    return PHASES.map(function (p, i) {
      var from = i === 0 ? null : b[i - 1], to = b[i];
      var span = i === 0 ? "fino al " + fmt(to) : fmt(from) + " – " + fmt(i === 5 ? wedding : to);
      var st = i < current ? "past" : i === current ? "now" : "next";
      return { t: p.t, d: p.d, span: span, st: st };
    });
  }

  function drawFloor(box, wedding, today) {
    var tiles = box.querySelectorAll("[data-phase]");
    var ph = floor(wedding, today);
    tiles.forEach(function (el, i) {
      var p = ph[i];
      el.className = "tile" + (p.st === "now" ? " now" : p.st === "past" ? " laid" : "");
      el.querySelector(".when").textContent = p.span;
      var chip = el.querySelector(".chip");
      chip.className = "chip " + (p.st === "now" ? "on" : p.st === "past" ? "past" : "");
      chip.textContent = p.st === "now" ? "In corso" : p.st === "past" ? "Già passata" : "Da venire";
    });
    box.classList.remove("set"); void box.offsetWidth; if (!reduce) box.classList.add("set");
  }

  var inp = document.getElementById("data-si");
  if (inp) {
    var cw = document.getElementById("cd-w"), cd = document.getElementById("cd-d"), msg = document.getElementById("cd-msg");
    var floorBox = document.querySelector(".floor");
    var today0 = new Date(); today0 = new Date(today0.getFullYear(), today0.getMonth(), today0.getDate());
    inp.min = today0.getFullYear() + "-" + String(today0.getMonth() + 1).padStart(2, "0") + "-" + String(today0.getDate()).padStart(2, "0");
    var update = function () {
      var w = parseDay(inp.value);
      if (!w) return;
      var days = Math.round((w - today0) / 86400000);
      if (days < 0) { msg.textContent = "Questa data è già passata: scegline una futura."; return; }
      msg.textContent = "";
      cw.textContent = String(Math.floor(days / 7));
      cd.textContent = String(days % 7);
      if (floorBox) drawFloor(floorBox, w, today0);
    };
    inp.addEventListener("input", update);
    inp.addEventListener("change", update);
    update();
  }

  /* ---------- entrate: una volta, a scaglioni ---------- */
  var rv = document.querySelectorAll("[data-rv]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) { el.classList.add("in"); } else { io.observe(el); }
    });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- sezione "come lo stiamo costruendo": lo stato cambia con il testo ---------- */
  var steps = document.querySelectorAll(".how .step");
  var states = document.querySelectorAll(".how .state");
  if (steps.length && states.length && "IntersectionObserver" in window) {
    var set = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      states.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    };
    set(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(+e.target.getAttribute("data-i")); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add("on"); });
  }

  /* ---------- lista d'attesa ---------- */
  var PREZZI = {
    coppia: [
      { v: "29", t: "29 €", s: "una tantum per matrimonio" },
      { v: "49", t: "49 €", s: "una tantum per matrimonio" },
      { v: "69", t: "69 €", s: "una tantum per matrimonio" },
      { v: "meno", t: "Pagherei meno", s: "meno di 29 €" }
    ],
    planner: [
      { v: "19", t: "19 € al mese", s: "per tutti i tuoi matrimoni" },
      { v: "29", t: "29 € al mese", s: "per tutti i tuoi matrimoni" },
      { v: "49", t: "49 € al mese", s: "per tutti i tuoi matrimoni" },
      { v: "meno", t: "Pagherei meno", s: "meno di 19 € al mese" }
    ]
  };

  var SUPABASE_URL = "https://msokhiezfsmkqsvzgmmi.supabase.co";
  var SUPABASE_KEY = "sb_publishable_kBqdAb3VA2lb4YJ45aA_2Q_0c0EQ85Q";

  var form = document.getElementById("waitlist");
  if (!form) return;
  var profilo = form.getAttribute("data-profile") || "coppia";
  var box = document.getElementById("prezzi");
  var status = document.getElementById("status");
  var btn = document.getElementById("invia");

  function drawPrices() {
    box.innerHTML = "";
    PREZZI[profilo].forEach(function (o, i) {
      var id = "pr-" + i;
      var d = document.createElement("div");
      d.className = "opt";
      var inpt = document.createElement("input");
      inpt.type = "radio"; inpt.name = "prezzo"; inpt.id = id; inpt.value = o.v;
      if (i === 1) inpt.checked = true;
      var lab = document.createElement("label");
      lab.htmlFor = id;
      var strong = document.createElement("span");
      strong.className = "price"; strong.textContent = o.t;
      var small = document.createElement("small");
      small.textContent = o.s;
      lab.appendChild(strong); lab.appendChild(small);
      d.appendChild(inpt); d.appendChild(lab);
      box.appendChild(d);
    });
  }
  drawPrices();

  // Campo trappola per i bot: le persone non lo vedono
  var trap = document.createElement("input");
  trap.type = "text"; trap.name = "sito_web"; trap.tabIndex = -1; trap.autocomplete = "off";
  trap.setAttribute("aria-hidden", "true");
  trap.className = "trap";
  form.appendChild(trap);

  function say(msg, cls) { status.textContent = msg; status.className = cls || ""; }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = form.elements["email"].value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Controlla l'indirizzo email: sembra incompleto.", "err"); form.elements["email"].focus(); return; }
    if (!form.elements["consenso"].checked) { say("Spunta il consenso per poterti scrivere quando la prima versione è pronta.", "err"); return; }
    if (trap.value) { say("Sei in lista. Ti scriviamo appena la prima versione è pronta.", "good"); form.reset(); drawPrices(); return; }
    var dati = {};
    new FormData(form).forEach(function (v, k) {
      if (k !== "consenso" && k !== "email" && k !== "sito_web") dati[k] = String(v);
    });
    if (form.elements["chiamata"]) dati.chiamata = form.elements["chiamata"].checked;
    btn.disabled = true; say("Un momento…");
    try {
      var res = await fetch(SUPABASE_URL + "/rest/v1/waitlist", {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ profilo: profilo, email: email, consenso: true, dati: dati })
      });
      if (!res.ok) throw new Error("http " + res.status);
      say("Sei in lista. Ti scriviamo appena la prima versione è pronta.", "good");
      form.reset(); drawPrices();
    } catch (err) {
      say("Non è stato possibile salvare l'iscrizione. Riprova tra poco o scrivici a info@nozzeinordine.com.", "err");
    }
    btn.disabled = false;
  });
})();
