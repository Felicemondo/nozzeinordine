(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- la data del sì: settimane, giorni e fase in corso, sul giorno scelto ---------- */
  var STATUS = { past: "Già passata", now: "In corso", next: "Da avviare" };
  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    if (x.getDate() !== d.getDate()) x = new Date(d.getFullYear(), d.getMonth() + n + 1, 0);
    return x;
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function parseDay(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Sei fasi (la scheda corta ne mostra cinque: la quinta e la sesta coincidono con "Settimana")
  function phaseIndex(w) {
    var b = [addMonths(w, -12), addMonths(w, -9), addMonths(w, -6), addMonths(w, -3), addDays(w, -7), w];
    var i = 0;
    while (i < 5 && today > b[i]) i++;
    return i;
  }
  function draw(box, w) {
    var days = Math.max(0, Math.round((w - today) / 86400000));
    var wk = box.querySelector("[data-weeks]"), dd = box.querySelector("[data-days]");
    if (wk) wk.textContent = String(Math.floor(days / 7));
    if (dd) dd.textContent = String(days % 7);
    var steps = box.querySelectorAll("[data-step]"), cur = phaseIndex(w);
    if (steps.length === 5 && cur >= 4) cur = 4;
    steps.forEach(function (el, i) {
      var st = i < cur ? "past" : i === cur ? "now" : "next";
      el.classList.toggle("now", st === "now");
      el.classList.toggle("past", st === "past");
      var s = el.querySelector("small"); if (s) s.textContent = STATUS[st];
    });
  }
  document.querySelectorAll("[data-wedding]").forEach(function (box) {
    var w = parseDay(box.getAttribute("data-wedding"));
    var inp = box.querySelector("#data-si"), msg = box.querySelector("#cd-msg");
    if (inp) {
      inp.min = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      var upd = function () {
        var v = parseDay(inp.value);
        if (!v) return;
        if (v < today) { msg.textContent = "Questa data è già passata: scegline una futura."; return; }
        msg.textContent = "";
        draw(box, v);
      };
      inp.addEventListener("input", upd); inp.addEventListener("change", upd);
    }
    if (w) draw(box, w);
  });

  /* ---------- lista d'attesa ---------- */
  var PREZZI = {
    coppia: [
      { v: "29", t: "29 €", s: "Una tantum per matrimonio" },
      { v: "49", t: "49 €", s: "Una tantum per matrimonio" },
      { v: "69", t: "69 €", s: "Una tantum per matrimonio" },
      { v: "meno", t: "Pagherei meno", s: "Meno di 29 €" }
    ],
    planner: [
      { v: "19", t: "19 € al mese", s: "Per tutti i tuoi matrimoni" },
      { v: "29", t: "29 € al mese", s: "Per tutti i tuoi matrimoni" },
      { v: "49", t: "49 € al mese", s: "Per tutti i tuoi matrimoni" },
      { v: "meno", t: "Pagherei meno", s: "Meno di 19 € al mese" }
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
