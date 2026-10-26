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
  var BLOCKS = "main section:not(.hero) :is(h1, h2, .eyebrow, .num, .lead, .small, .ui, .planner-box, .defs > div, .later, .steps > li, .plan, details, .form-card, .next, .pilot-steps > li, .cta-in p, .cta-btns > *, .closing-btns > *, blockquote)";
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

  /* ---------- richieste: moduli in tre passaggi per coppie e planner ---------- */
  var SUPABASE_URL = "https://msokhiezfsmkqsvzgmmi.supabase.co";
  var SUPABASE_KEY = "sb_publishable_kBqdAb3VA2lb4YJ45aA_2Q_0c0EQ85Q";

  var form = document.getElementById("richiesta");
  if (!form) return;
  var profilo = form.getAttribute("data-profile");
  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var status = document.getElementById("status");
  var btn = document.getElementById("invia");
  var cur = 0;

  function say(msg, cls) { status.textContent = msg; status.className = cls || ""; }

  function show(i, focus) {
    cur = i;
    steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    form.classList.toggle("multi", i > 0);
    form.classList.toggle("last", i === steps.length - 1);
    form.querySelector(".progress-n").textContent = (i + 1) + " di " + steps.length;
    form.querySelector(".progress b").style.width = ((i + 1) / steps.length * 100) + "%";
    say("");
    if (focus) {
      steps[i].querySelector(".step-t").focus({ preventScroll: true });
      var top = form.getBoundingClientRect().top + window.scrollY - 140;
      if (window.scrollY > top) window.scrollTo({ top: top });
    }
  }

  // Errori accanto al campo: il primo riceve il fuoco, i valori restano
  function clearErr(box) {
    box.querySelectorAll(".field-err").forEach(function (e) { e.remove(); });
    box.querySelectorAll("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); e.removeAttribute("aria-describedby"); });
    box.querySelectorAll(".fs.bad").forEach(function (e) { e.classList.remove("bad"); });
    box.classList.remove("bad");
  }
  function markErr(el, msg) {
    var id = "err-" + (el.name || el.id);
    var p = document.createElement("p");
    p.className = "field-err"; p.id = id; p.textContent = msg;
    if (el.type === "radio" || el.type === "checkbox" && el.closest(".fs")) {
      var fs = el.closest(".fs"); fs.classList.add("bad"); fs.appendChild(p);
    } else if (el.type === "checkbox") {
      el.closest(".check").insertAdjacentElement("afterend", p);
    } else {
      el.setAttribute("aria-invalid", "true"); el.closest(".fld").appendChild(p);
    }
    el.setAttribute("aria-describedby", id);
  }
  function message(el) {
    if (el.name === "email") return el.value.trim() ? "Controlla l'indirizzo email: sembra incompleto." : "Scrivi la tua email.";
    if (el.name === "consenso") return "Serve il consenso per poterti scrivere.";
    if (el.type === "radio") return "Scegli una risposta.";
    if (el.type === "number") return "Scrivi un numero tra 0 e 200.";
    if (el.tagName === "SELECT") return "Scegli un'opzione.";
    return "Questo campo serve.";
  }
  function check(box) {
    clearErr(box);
    var bad = [], seen = {};
    box.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.name === "sito_web" || seen[el.name]) return;
      var ok;
      if (el.type === "radio") { seen[el.name] = 1; ok = !el.required || !!form.querySelector('input[name="' + el.name + '"]:checked'); }
      else if (el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      else if (el.type === "checkbox") ok = !el.required || el.checked;
      else if (el.type === "number") ok = (!el.required && el.value === "") || (/^\d+$/.test(el.value) && +el.value <= 200);
      else ok = !el.required || !!el.value.trim();
      if (!ok) { bad.push(el); markErr(el, message(el)); }
    });
    if (bad.length) { bad[0].focus(); say(bad.length === 1 ? "Manca una risposta: la trovi evidenziata." : "Mancano " + bad.length + " risposte: le trovi evidenziate.", "err"); }
    return !bad.length;
  }

  form.querySelector("[data-next]").addEventListener("click", function () { if (check(steps[cur])) show(cur + 1, true); });
  form.querySelector("[data-back]").addEventListener("click", function () { clearErr(steps[cur]); show(cur - 1, true); });
  // Invio dentro un campo: avanti, non invio del modulo
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && cur < steps.length - 1) { e.preventDefault(); form.querySelector("[data-next]").click(); }
  });
  // Appena si corregge un campo, il suo errore sparisce
  form.addEventListener("change", function (e) {
    var box = e.target.closest(".fs, .fld");
    if (box) { clearErr(box); return; }
    var c = e.target.closest(".check"), n = c && c.nextElementSibling;
    if (n && n.classList.contains("field-err")) { n.remove(); e.target.removeAttribute("aria-describedby"); }
  });
  show(0, false);

  // Campo trappola per i bot: le persone non lo vedono
  var trap = document.createElement("input");
  trap.type = "text"; trap.name = "sito_web"; trap.tabIndex = -1; trap.autocomplete = "off";
  trap.setAttribute("aria-hidden", "true");
  trap.className = "trap";
  form.appendChild(trap);

  function collect() {
    var dati = { modulo: "richiesta-1" };
    new FormData(form).forEach(function (v, k) {
      if (k === "consenso" || k === "email" || k === "sito_web") return;
      v = String(v).trim().slice(0, 500);
      if (!v) return;
      var el = form.elements[k];
      if (el && el.length && el[0] && el[0].type === "checkbox") (dati[k] = dati[k] || []).push(v);
      else if (el && el.type === "checkbox") dati[k] = true;
      else if (el && el.type === "number") dati[k] = +v;
      else dati[k] = v;
    });
    return dati;
  }

  function finish() {
    var done = document.getElementById("fatto");
    say(""); form.hidden = true; done.hidden = false;
    done.querySelector("h2").focus({ preventScroll: true });
    var top = done.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: Math.max(0, top) });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (cur < steps.length - 1) { form.querySelector("[data-next]").click(); return; }
    if (!check(steps[cur])) return;
    if (trap.value) { finish(); return; }
    btn.disabled = true; say("Un momento…");
    try {
      var res = await fetch(SUPABASE_URL + "/rest/v1/waitlist", {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ profilo: profilo, email: form.elements["email"].value.trim(), consenso: true, dati: collect() })
      });
      if (!res.ok) throw new Error("http " + res.status);
      finish();
    } catch (err) {
      say("Non è stato possibile inviare la richiesta. Le risposte sono ancora qui: riprova tra poco o scrivici a info@nozzeinordine.com.", "err");
    }
    btn.disabled = false;
  });
})();
