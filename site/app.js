(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- menu su telefono e tablet ---------- */
  var burger = document.querySelector(".burger"), menu = document.getElementById("menu");
  if (burger && menu) {
    var label = burger.querySelector(".burger-label");
    var setMenu = function (open, focusBack) {
      menu.classList.toggle("open", open);
      root.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Chiudi" : "Menu";
      if (open) menu.querySelector("a").focus({ preventScroll: true });
      else if (focusBack) burger.focus();
    };
    burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false, true); });
    matchMedia("(min-width: 1025px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- entrate al passaggio: ogni blocco arriva una volta, nell'ordine in cui si legge ---------- */
  var PICS = ".feat-pic, .side-pic, .project-pic, .glance-col > img, .inset-pic figure";
  var BLOCKS = "main section:not(.hero) :is(h1, h2, .eyebrow, .num, .lead, .small, .ui, .planner-box, .defs > div, .later, .steps > li, .plan, details, .form-card, .signup-text > h3, .cta-in p, .cta-btns > *, .closing-btns > *, blockquote)";
  function countUp(box) {
    box.querySelectorAll("[data-weeks], [data-days]").forEach(function (b) {
      var end = +b.textContent, t0 = performance.now();
      if (!end) return;
      (function step(t) {
        var k = Math.min(1, (t - t0) / 1100);
        b.textContent = String(Math.round(end * (1 - Math.pow(2, -10 * k))));
        if (k < 1) requestAnimationFrame(step); else b.textContent = String(end);
      })(t0);
    });
  }
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(BLOCKS + ", " + PICS));
    nodes = nodes.filter(function (el) { return !nodes.some(function (o) { return o !== el && o.contains(el); }); });
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.style.setProperty("--d", Math.min(n++, 6) * 0.08 + "s");
        el.classList.add("is-in");
        countUp(el);
        // a entrata finita si torna allo stato normale, così hover e pressione non ereditano i ritardi
        setTimeout(function () { el.classList.remove("rv", "pic", "is-in"); el.style.removeProperty("--d"); }, 2600);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    nodes.forEach(function (el) {
      el.classList.add("rv");
      if (el.matches(PICS)) el.classList.add("pic");
      el.querySelectorAll(".mosaic i, .path li, .sched li").forEach(function (x) {
        x.style.setProperty("--k", Array.prototype.indexOf.call(x.parentNode.children, x));
      });
      io.observe(el);
    });
  }

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
