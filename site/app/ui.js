/* Nozze in Ordine: interfaccia della dashboard (coppie, wedding planner, amministrazione).
   Struttura e testi seguono i mockup Figma "Dashboard". Parla solo con window.NIO_API (api.js dal vivo, mock-api.js nella demo).
   Tutto il testo che arriva dai dati passa da textContent: niente innerHTML con contenuti degli utenti. */
(function () {
  "use strict";
  var api = window.NIO_API;
  var root = document.getElementById("app");
  var state = { me: null, weddings: [], invites: [], navOpen: false, wiz: null, hc: {} };
  var PHASES = ["12+ mesi prima", "9-11 mesi prima", "6-8 mesi prima", "3-5 mesi prima", "1-2 mesi prima", "Settimana del sì"];
  var MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var MESI_L = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var LABEL = {
    role: { admin: "Amministratore", coppia: "Coppia", planner: "Wedding planner" },
    member: { sposi: "Coppia", planner: "Wedding planner" },
    ceremony: { civile: "Civile", religioso: "Religioso", simbolico: "Simbolico", da_decidere: "Da decidere" },
    vendor: { da_scegliere: "Da scegliere", in_trattativa: "In trattativa", confermato: "Confermato", scartato: "Scartato" },
    rsvp: { in_attesa: "In attesa", si: "Viene", no: "Non viene" },
    menu: { standard: "Standard", vegano: "Vegano", vegetariano: "Vegetariano", no_carne: "No carne", no_pesce: "No pesce" },
    age: { adulto: "Adulto", bambino: "Bambino", under3: "Bambino sotto i 3 anni" },
    assignee: { sposi: "Sposi", planner: "Planner" },
    priority: { spese: "Tenere sotto controllo le spese", fornitori: "Trovare i fornitori", invitati: "Organizzare gli invitati" },
    stage: { inizio: "Siamo all'inizio", qualcosa: "Qualcosa è già deciso", dettagli: "Mancano i dettagli" },
    perYear: { "1-5": "Da 1 a 5", "6-10": "Da 6 a 10", "11-20": "Da 11 a 20", "20+": "Più di 20" },
    workMode: { autonomia: "Lavoro in autonomia", team: "Lavoro con un team" },
    wl: { nuova: "Nuova", contattata: "Contattata", pilota: "Nella prova pilota", scartata: "Scartata" }
  };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    local: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    setLocal: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  // Gruppi degli invitati: "a" è la prima persona della coppia, "b" la seconda.
  var GROUPS = ["famiglia_a", "famiglia_b", "amici_a", "amici_b", "amici_comuni"];
  function groupLabel(w, g) {
    var a = (w && w.partner_a) || "lei", b = (w && w.partner_b) || "lui";
    return { famiglia_a: "Famiglia di " + a, famiglia_b: "Famiglia di " + b, amici_a: "Amici di " + a, amici_b: "Amici di " + b, amici_comuni: "Amici comuni" }[g] || "Amici comuni";
  }
  // I 14 allergeni del Regolamento UE 1169/2011, più una voce libera
  var ALLERGIES = [["glutine", "Glutine"], ["lattosio", "Latte e lattosio"], ["uova", "Uova"], ["frutta_guscio", "Frutta a guscio"], ["arachidi", "Arachidi"], ["soia", "Soia"], ["pesce", "Pesce"],
    ["crostacei", "Crostacei"], ["molluschi", "Molluschi"], ["sedano", "Sedano"], ["senape", "Senape"], ["sesamo", "Sesamo"], ["solfiti", "Solfiti"], ["lupini", "Lupini"], ["altro", "Altro"]];
  var allergyLabel = function (k) { return (ALLERGIES.filter(function (a) { return a[0] === k; })[0] || [k, k])[1]; };
  function allergyText(x) { return (x.allergies || []).filter(function (k) { return k !== "altro"; }).map(function (k) { return allergyLabel(k).toLowerCase(); }).concat(x.allergies_note ? [x.allergies_note] : []).join(", "); }
  function partyLabel(w, p) { return p === "a" ? (w.partner_a || "Sposa") : p === "b" ? (w.partner_b || "Sposo") : "In comune"; }
  var CATS = ["Location e ricevimento", "Catering", "Fotografo e video", "Abiti e accessori", "Fiori e allestimenti", "Musica e intrattenimento", "Partecipazioni e stampa", "Bomboniere", "Trasporti", "Rito e documenti", "Viaggio di nozze", "Altre spese"];
  // Voci a quota singola: a persona su chi viene, oppure una per nucleo familiare.
  var UNIT = { "Location e ricevimento": "persona", "Catering": "persona", "Bomboniere": "nucleo", "Partecipazioni e stampa": "nucleo" };
  var RENTAL = "Location e ricevimento";
  // Chi viene: tutti tranne chi ha detto no. I bambini sotto i 3 anni non pagano il coperto.
  function headcount(guests) {
    var c = { adulti: 0, bambini: 0, piccoli: 0, nuclei: 0, nucleiTutti: 0 }, coming = {}, all = {};
    guests.forEach(function (g) {
      var key = (g.household || "").trim().toLowerCase() || "#" + g.id;
      if (!g.couple_side) all[key] = 1; // gli sposi non ricevono la partecipazione
      if (g.rsvp === "no") return;
      coming[key] = 1;
      if (g.age_band === "bambino") c.bambini++; else if (g.age_band === "under3") c.piccoli++; else c.adulti++;
    });
    guests.forEach(function (g) { if (g.couple_side) delete coming[(g.household || "").trim().toLowerCase() || "#" + g.id]; });
    c.nuclei = Object.keys(coming).length; c.nucleiTutti = Object.keys(all).length;
    return c;
  }
  // Bomboniere a chi viene, partecipazioni a tutti i nuclei invitati
  function unitCount(b, hc) { return b.category === "Bomboniere" ? hc.nuclei : hc.nucleiTutti; }
  function isUnit(b) { return !!UNIT[b.category] && (num(b.unit_price) > 0 || num(b.unit_child) > 0 || b.rental_amount != null); }
  function unitCost(b, hc) {
    if (UNIT[b.category] === "nucleo") return num(b.unit_price) * unitCount(b, hc);
    return num(b.unit_price) * hc.adulti + num(b.unit_child) * hc.bambini + (b.category === RENTAL ? num(b.rental_amount) : 0);
  }
  // Quanto costa una voce: a quota singola si calcola dagli invitati, altrimenti il contratto se c'è, poi la stima.
  function cost(b) {
    var hc = state.hc[b.wedding_id];
    if (isUnit(b)) return hc ? unitCost(b, hc) : num(b.planned);
    return Number(b.contracted) > 0 ? Number(b.contracted) : Number(b.planned) || 0;
  }
  // Se il matrimonio è seguito da una planner, la coppia modifica solo invitati e tavoli (come nel database).
  var canEdit = function (w) { return state.me.role === "admin" || (w && (w.my_role === "planner" || !w.has_planner)); };
  var opts = function (map) { return Object.keys(map).map(function (k) { return [k, map[k]]; }); };
  // Le attività suggerite all'avvio: senza scadenza, si aggiungono solo se scelte.
  var SUGGEST = ["Parlare delle vostre priorità", "Definire un primo budget", "Abbozzare la lista degli invitati"];

  /* ------------------------------------------------------------ utilità */
  var PROPS = { value: 1, checked: 1, selected: 1, disabled: 1 };
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROPS[k]) el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  var num = function (v) { var n = Number(v); return isFinite(n) ? n : 0; };
  function eur(n) {
    n = Math.round(num(n) * 100) / 100;
    var neg = n < 0; n = Math.abs(n);
    var int = Math.floor(n), cents = Math.round((n - int) * 100);
    var s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "−" : "") + s + (cents ? "," + String(cents).padStart(2, "0") : "") + " €";
  }
  function isoOf(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function todayIso() { return isoOf(new Date()); }
  function parseIso(s) { var p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fmtDate(s, long) {
    if (!s) return "—";
    var d = parseIso(s);
    return d.getDate() + " " + (long ? MESI_L : MESI)[d.getMonth()] + " " + d.getFullYear();
  }
  function daysTo(s) { if (!s) return null; return Math.round((parseIso(s) - parseIso(todayIso())) / 86400000); }
  function whenText(s) {
    var n = daysTo(s);
    if (n == null) return "senza scadenza";
    if (n === 0) return "oggi";
    if (n === 1) return "domani";
    if (n < 0) return n === -1 ? "ieri" : (-n) + " giorni fa";
    return n < 60 ? "tra " + n + " giorni" : fmtDate(s);
  }
  // Come nel database: la data meno mesi e giorni
  function shiftIso(s, months, days) { var d = parseIso(s); return isoOf(new Date(d.getFullYear(), d.getMonth() - months, d.getDate() - (days || 0))); }
  var plural = function (n, one, many) { return n + " " + (n === 1 ? one : many); };

  /* ------------------------------------------------------------ icone (tratto, 24×24) */
  var ICONS = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
    todo: "M21 11.1V12a9 9 0 1 1-5.3-8.2|M21 4.5 12 13.5l-3-3",
    wallet: "M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v3.5h-3.5a2 2 0 0 0 0 4H20V19a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6",
    briefcase: "M3.5 7.5h17v12h-17z|M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2|M9 7.5v12M15 7.5v12",
    users: "M16 20.5v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.5|M9 3.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5|M22 20.5v-1.5a4 4 0 0 0-3-3.8|M16 3.6a3.75 3.75 0 0 1 0 7.3",
    table: "M3.5 3.5h17v17h-17z|M3.5 9.5h17|M3.5 15h17|M12 3.5v17",
    calendar: "M3.5 5h17v15.5h-17z|M3.5 10h17|M8 3v4|M16 3v4",
    file: "M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z|M14 2.5V8h5.5|M8.5 13h7|M8.5 17h7",
    note: "M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z|M15 3v6h6|M7.5 13h9|M7.5 17h6",
    bell: "M6 8.5a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5|M10.3 20.5a1.9 1.9 0 0 0 3.4 0",
    user: "M19 20.5v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1.5|M12 3.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5",
    clock: "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19|M12 7v5l3.5 2",
    building: "M5 2.5h14v19H5z|M9.5 21.5v-4h5v4|M8.5 6.5h1M14.5 6.5h1M8.5 10h1M14.5 10h1M8.5 13.5h1M14.5 13.5h1",
    camera: "M14.5 4.5h-5L7.5 7H4.5a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z|M12 9.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5",
    music: "M9 18V5.5l11-2V16|M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6|M17 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
    search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15|M20.5 20.5l-4.6-4.6",
    arrow: "M5 12h14|M13 6l6 6-6 6",
    back: "M19 12H5|M11 6l-6 6 6 6",
    plus: "M12 5v14|M5 12h14",
    menu: "M4 6.5h16|M4 12h16|M4 17.5h16",
    x: "M18 6 6 18|M6 6l12 12",
    lock: "M5 10.5h14v10H5z|M8 10.5V7a4 4 0 1 1 8 0v3.5|M12 14.5v2",
    mail: "M3 5.5h18v13H3z|M3.5 6.5l8.5 6.5 8.5-6.5",
    trash: "M3.5 6h17|M8.5 6V4h7v2|M18.5 6l-1 14.5h-11L5.5 6|M10 10.5v6M14 10.5v6",
    info: "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19|M12 16v-4.5|M12 8h.01",
    alert: "M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19|M12 7.5v5|M12 16.5h.01",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    check: "M20 6.5 9 17.5l-5-5",
    printer: "M6.5 9V3h11v6|M6.5 18H4.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2|M6.5 14h11v7.5h-11z",
    calplus: "M3.5 5h17v15.5h-17z|M3.5 10h17|M8 3v4|M16 3v4|M12 13v5|M9.5 15.5h5",
    userplus: "M15 20.5v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1.5|M8.5 3.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5|M19 8v6|M16 11h6"
  };
  function icon(name, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    (ICONS[name] || ICONS.info).split("|").forEach(function (d) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); s.append(p);
    });
    return s;
  }
  function payIcon(cat) {
    var c = (cat || "").toLowerCase();
    return c.indexOf("location") >= 0 ? "building" : c.indexOf("foto") >= 0 ? "camera" : c.indexOf("music") >= 0 ? "music" : c.indexOf("viaggio") >= 0 ? "plane" : "wallet";
  }

  /* ------------------------------------------------------------ messaggi, conferme, moduli */
  var live = h("div", { class: "toast", role: "status", "aria-live": "polite" });
  document.body.append(live);
  var toastTimer;
  function toast(msg, bad) {
    live.textContent = msg; live.className = "toast on" + (bad ? " bad" : "");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { live.className = "toast"; }, 4200);
  }
  async function attempt(fn, okMsg) {
    try { var r = await fn(); if (okMsg) toast(okMsg); return r; }
    catch (e) { toast(e.message || String(e), true); if (e && typeof e === "object") e.shown = true; throw e; }
  }
  // l'errore è già stato mostrato: non serve altro rumore in console
  window.addEventListener("unhandledrejection", function (ev) { if (ev.reason && ev.reason.shown) ev.preventDefault(); });

  // Un errore di salvataggio non è mai un falso successo: il modulo resta aperto con i dati inseriti.
  function saveError(e) {
    return h("div", { class: "alert bad", role: "alert" }, icon("alert"), h("div", null, h("b", null, "Non siamo riusciti a salvare. I dati sono ancora qui."),
      h("p", null, (e && e.message ? e.message + ". " : "") + "Controlla la connessione e riprova: la modifica non è stata confermata.")));
  }

  // onOk: se c'è, il dialogo si chiude solo quando il salvataggio riesce.
  function dialog(title, body, actions, onOk) {
    return new Promise(function (resolve) {
      var dlg = h("dialog", { class: "dlg", "aria-labelledby": "dlg-t" });
      var errBox = h("div", { class: "dlg-err" });
      var form = h("form", { method: "dialog" }, h("div", { class: "dlg-head" }, h("h2", { id: "dlg-t" }, title),
        h("button", { class: "icon-btn", type: "button", "aria-label": "Chiudi", onclick: function () { finish("no"); } }, icon("x"))),
        errBox, body, h("div", { class: "dlg-actions" }, actions));
      dlg.append(form);
      document.body.append(dlg);
      // Chiusura gestita a mano: non tutti i browser emettono l'evento "close" in modo affidabile.
      var done = false;
      function finish(v) {
        if (done) return; done = true;
        if (dlg.open) dlg.close(v);
        resolve({ value: v, form: form }); dlg.remove();
      }
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var v = e.submitter ? e.submitter.value : "ok";
        if (v === "ok" && !form.checkValidity()) { form.reportValidity(); return; }
        if (v === "ok" && onOk) {
          var bs = form.querySelectorAll("button"); bs.forEach(function (b) { b.disabled = true; });
          var okBtn = e.submitter, label = okBtn ? okBtn.textContent : "";
          if (okBtn) okBtn.textContent = "Salvataggio in corso…";
          try { await onOk(form); }
          catch (err) {
            if (err && typeof err === "object") err.shown = true;
            errBox.replaceChildren(saveError(err));
            bs.forEach(function (b) { b.disabled = false; }); if (okBtn) okBtn.textContent = label;
            errBox.scrollIntoView({ block: "nearest" });
            return;
          }
        }
        finish(v);
      });
      dlg.addEventListener("cancel", function (e) { e.preventDefault(); finish("no"); });
      dlg.addEventListener("close", function () { finish(dlg.returnValue || "no"); });
      dlg.showModal();
      var first = form.querySelector(".dlg-body input, .dlg-body select, .dlg-body textarea, input, select, textarea");
      if (first) first.focus();
    });
  }
  async function confirmBox(title, text, okLabel, danger) {
    var r = await dialog(title, h("div", { class: "dlg-body" }, h("p", { class: "dlg-text" }, text)), [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"),
      h("button", { class: "btn " + (danger === false ? "primary" : "danger"), value: "ok" }, okLabel || "Conferma")
    ]);
    return r.value === "ok";
  }
  function field(f, v) {
    var id = "f-" + f.name;
    var input;
    if (f.type === "select") {
      var os = f.options.slice();
      if (v != null && v !== "" && !os.some(function (o) { return String(o[0]) === String(v); })) os.unshift([v, v]);
      input = h("select", { id: id, name: f.name, required: f.required }, os.map(function (o) { return h("option", { value: o[0], selected: String(v) === String(o[0]) }, o[1]); }));
    } else if (f.type === "textarea") {
      input = h("textarea", { id: id, name: f.name, rows: 4, maxlength: f.max || 2000, required: f.required, placeholder: f.placeholder });
      input.value = v == null ? "" : v;
    } else if (f.type === "checkbox") {
      return h("label", { class: "check" + (f.wide ? " wide" : ""), for: id }, h("input", { type: "checkbox", id: id, name: f.name, checked: !!v }), h("span", null, f.label));
    } else if (f.type === "chips") {
      var on = v || [];
      return h("fieldset", { class: "fld chips-fld" + (f.wide ? " wide" : ""), id: id }, h("legend", null, f.label + " · facoltativo"),
        h("div", { class: "chip-set" }, f.options.map(function (o) { return h("label", { class: "chip-c" }, h("input", { type: "checkbox", name: f.name, value: o[0], checked: on.indexOf(o[0]) >= 0 }), h("span", null, o[1])); })),
        f.help ? h("small", null, f.help) : null);
    } else {
      input = h("input", {
        // gli importi si scrivono anche con la virgola: campo di testo con tastiera numerica
        id: id, name: f.name, type: f.type === "number" ? "text" : (f.type || "text"), required: f.required, placeholder: f.placeholder,
        min: f.type === "number" ? null : f.min, maxlength: f.max, inputmode: f.type === "number" ? (f.step === "1" ? "numeric" : "decimal") : null,
        pattern: f.type === "number" ? (f.step === "1" ? "[\\d.]*" : "[\\d.]+([,.]\\d{1,2})?") : null, title: f.type === "number" ? (f.step === "1" ? "Solo numeri interi" : "Un importo, per esempio 1250 o 1250,50") : null,
        list: f.list ? id + "-l" : null,
        autocomplete: f.autocomplete || "off", value: v == null ? "" : (f.type === "time" ? String(v).slice(0, 5) : f.type === "number" ? (num(v) ? String(num(v)).replace(".", ",") : "") : String(v))
      });
    }
    return h("div", { class: "fld" + (f.wide ? " wide" : "") }, h("label", { for: id }, f.label + (f.required || f.type === "select" || f.noOpt ? "" : " · facoltativo")), input,
      f.list ? h("datalist", { id: id + "-l" }, f.list.map(function (o) { return h("option", { value: o }); })) : null,
      f.help ? h("small", null, f.help) : null);
  }
  function readForm(form, fields) {
    var out = {};
    fields.forEach(function (f) {
      var el = form.elements[f.name];
      if (!el) return;
      if (f.type === "chips") out[f.name] = Array.prototype.filter.call(form.querySelectorAll('input[name="' + f.name + '"]'), function (x) { return x.checked; }).map(function (x) { return x.value; });
      else if (f.type === "checkbox") out[f.name] = el.checked;
      else if (f.type === "number") out[f.name] = el.value.trim() === "" ? 0 : num(el.value.trim().replace(/\./g, f.step === "1" ? "" : ".").replace(",", "."));
      else if (f.type === "date" || f.type === "time") out[f.name] = el.value || null;
      else out[f.name] = el.value.trim();
    });
    return out;
  }
  // save(dati) salva davvero: se fallisce, il modulo resta aperto con l'errore e i dati.
  async function formDialog(title, fields, values, okLabel, save) {
    values = values || {};
    var data = null;
    var r = await dialog(title, h("div", { class: "dlg-body grid-form" }, fields.map(function (f) { return field(f, values[f.name]); })), [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"),
      h("button", { class: "btn primary", value: "ok" }, okLabel || "Salva")
    ], save ? async function (form) { data = readForm(form, fields); await save(data); } : null);
    if (r.value !== "ok") return null;
    return data || readForm(r.form, fields);
  }
  async function editDialog(title, fields, values, okLabel, save, okMsg) {
    var d = await formDialog(title, fields, values, okLabel, save);
    if (d) { if (okMsg) toast(okMsg); render(); }
    return d;
  }

  /* ------------------------------------------------------------ definizioni dei campi */
  var F = {
    wedding: [
      { name: "title", label: "Nome del matrimonio", required: true, max: 120, placeholder: "Es. Anna e Marco", wide: true },
      { name: "partner_a", label: "Nome della prima persona", max: 60, placeholder: "Es. Anna", noOpt: true, help: "Usato per i gruppi degli invitati: famiglia e amici di ciascuno." },
      { name: "partner_b", label: "Nome della seconda persona", max: 60, placeholder: "Es. Marco", noOpt: true, help: "Per due spose o due sposi scrivete semplicemente i due nomi." },
      { name: "wedding_date", label: "Data del matrimonio", type: "date", help: "Le scadenze si calcolano su questa data. Senza data non ci sono scadenze automatiche." },
      { name: "city", label: "Città o zona", max: 80, placeholder: "Es. Caserta" },
      { name: "ceremony", label: "Rito", type: "select", options: opts(LABEL.ceremony) },
      { name: "budget_total", label: "Budget complessivo (€)", type: "number", min: 0, step: "1", help: "Tetto di spesa totale per il matrimonio." },
      { name: "guests_expected", label: "Invitati previsti", type: "number", min: 0, step: "1", help: "È una stima: non aggiunge persone alla lista." },
      { name: "stage", label: "A che punto siete", type: "select", options: [["", "Non indicato"]].concat(opts(LABEL.stage)) }
    ],
    budget_items: [
      { name: "category", label: "Voce", type: "select", required: true, options: CATS.map(function (c) { return [c, c]; }) },
      { name: "description", label: "Dettaglio", required: true, max: 200, placeholder: "Es. Villa con giardino" },
      { name: "unit_price", label: "Costo per adulto (€)", type: "number", min: 0, step: "0.01", noOpt: true },
      { name: "unit_child", label: "Costo per bambino (€)", type: "number", min: 0, step: "0.01", noOpt: true, help: "I bambini sotto i 3 anni non si contano." },
      { name: "rental", label: "Noleggio della struttura", type: "select", options: [["no", "Non previsto"], ["si", "Previsto"]] },
      { name: "rental_amount", label: "Importo del noleggio (€)", type: "number", min: 0, step: "0.01", noOpt: true, required: true },
      { name: "planned", label: "Costo stimato (€)", type: "number", min: 0, step: "0.01", help: "Quanto pensate di spendere per questa voce." },
      { name: "contracted", label: "Importo del contratto (€)", type: "number", min: 0, step: "0.01", required: true, help: "Quando c'è, prende il posto della stima. Scrivete 0 se non c'è ancora un contratto." },
      { name: "paid", label: "Già pagato (€)", type: "number", min: 0, step: "0.01", required: true, help: "Scrivete 0 se non avete ancora pagato nulla." },
      { name: "deposit", label: "Acconto (€)", type: "number", min: 0, step: "0.01", help: "L'anticipo concordato con il fornitore. Scrivete 0 se non è previsto." },
      { name: "deposit_due", label: "Acconto entro", type: "date", noOpt: true, help: "Quando va versato l'acconto." },
      { name: "due_date", label: "Saldo entro", type: "date", noOpt: true, help: "Entro quando saldare il resto. Serve finché resta qualcosa da pagare." }
    ],
    tables: [
      { name: "name", label: "Nome del tavolo", required: true, max: 60, placeholder: "Es. Capri", wide: true },
      { name: "seats", label: "Posti", type: "select", options: [["8", "8 posti"], ["9", "9 posti"], ["10", "10 posti"], ["11", "11 posti"], ["12", "12 posti"]] },
      { name: "shape", label: "Forma", type: "select", options: [["rotondo", "Rotondo"], ["rettangolare", "Rettangolare"]] }
    ],
    vendors: [
      { name: "category", label: "Categoria", type: "select", required: true, options: [] },
      { name: "name", label: "Nome del fornitore", required: true, max: 120 },
      { name: "contact", label: "Contatto (telefono o email)", required: true, max: 200 },
      { name: "notes", label: "Servizi offerti e note", type: "textarea", max: 2000, wide: true, placeholder: "Es. menù di 5 portate, torta inclusa, prova trucco" }
    ],
    quotes: [
      { name: "label", label: "Nome del preventivo", required: true, max: 120, placeholder: "Es. Menù A" },
      { name: "amount", label: "Importo (€)", type: "number", min: 0, step: "0.01" },
      { name: "per_person", label: "Importo a persona", type: "checkbox" },
      { name: "includes", label: "Cosa comprende", max: 500 },
      { name: "expires_on", label: "Valido fino al", type: "date" }
    ],
    tasks: [
      { name: "title", label: "Attività", required: true, max: 200, wide: true },
      { name: "due_date", label: "Scadenza", type: "date" },
      { name: "phase", label: "Fase", type: "select", options: PHASES.map(function (p, i) { return [String(i), p]; }) },
      { name: "assignee", label: "Chi se ne occupa", type: "select", options: opts(LABEL.assignee) },
      { name: "done", label: "Completata", type: "checkbox" }
    ],
    timeline_items: [
      { name: "start_time", label: "Ora", type: "time", required: true },
      { name: "party", label: "Per chi", type: "select", options: [] },
      { name: "title", label: "Descrizione", required: true, max: 120, placeholder: "Es. Cerimonia" },
      { name: "place", label: "Dove", max: 120 },
      { name: "owner", label: "Chi coordina", max: 120, placeholder: "Es. Fotografo" }
    ],
    internal_notes: [{ name: "body", label: "Nota", type: "textarea", required: true, max: 4000, wide: true }]
  };
  function guestFields(w) {
    return [
      { name: "name", label: "Nome e cognome", required: true, max: 120 },
      { name: "age_band", label: "Età", type: "select", options: opts(LABEL.age) },
      { name: "guest_group", label: "Gruppo", type: "select", options: GROUPS.map(function (g) { return [g, groupLabel(w, g)]; }) },
      { name: "household", label: "Nucleo familiare", max: 120, placeholder: "Es. Famiglia Russo", help: "Una partecipazione e una bomboniera per nucleo." },
      { name: "rsvp", label: "Risposta", type: "select", options: opts(LABEL.rsvp) },
      { name: "menu", label: "Menù", type: "select", options: opts(LABEL.menu) },
      { name: "allergies", label: "Intolleranze e allergie", type: "chips", options: ALLERGIES, wide: true, help: "Solo ciò che l'invitato vi ha indicato, e solo per preparare il menù." },
      { name: "allergies_note", label: "Altre intolleranze o allergie", max: 200, wide: true, required: true, placeholder: "Es. kiwi, nichel" },
      { name: "notes", label: "Note", max: 500, wide: true, placeholder: "Es. arriva dopo la cerimonia" }
    ];
  }

  /* ------------------------------------------------------------ routing */
  function route() { return (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean); }
  function go(path) { if (location.hash !== "#/" + path) location.hash = "#/" + path; else render(); }
  var current = function () { var p = route(); return p[0] === "m" ? p[1] : null; };
  var wedding = function (id) { return state.weddings.filter(function (w) { return w.id === id; })[0]; };
  var isPlannerHere = function (w) { return state.me.role === "admin" || (w && w.my_role === "planner"); };
  // Chiudere il menu toglie anche il blocco dello scorrimento dalla pagina (su telefono restava attivo dopo aver scelto una voce)
  window.addEventListener("hashchange", function () { state.navOpen = false; document.body.classList.remove("nav-open"); render(); });

  /* ------------------------------------------------------------ pezzi comuni */
  // Il logo: solo brand/logo/nozzeinordine-logo.svg, lo stesso del sito
  var MARK_PATHS = ["M75.5811 77.4424L72.2412 79.1143L43.3535 32.2061C42.8808 31.4386 41.7138 31.6393 41.5244 32.5205L37.917 49.3008C37.7225 50.2054 37.8676 51.1787 38.2744 52.0098C52.8835 81.848 25.4352 80.4472 17.2451 134.271C8.93708 188.871 52.1385 193.329 54.3545 195L0 194.442C0.0244547 194.25 7.79015 133.326 18.9512 89.1426C32.6872 34.7656 19.8745 7.05714 11.751 0H42.0479L75.5811 77.4424ZM170.813 0.557617C170.787 0.763793 163.022 61.6794 151.862 105.857C138.126 160.234 150.939 187.943 159.062 195H128.767L95.2324 117.558L98.5732 115.886L127.461 162.794C127.934 163.561 129.101 163.361 129.29 162.479L132.896 145.699C133.091 144.795 132.946 143.821 132.539 142.99C117.93 113.152 145.379 114.553 153.569 60.7285C161.877 6.12862 118.674 1.67143 116.459 0L170.813 0.557617ZM85.6592 83.1396C85.9281 83.1397 86.1905 83.2222 86.4111 83.376C86.6318 83.5299 86.8005 83.7476 86.8936 84L90.0537 92.5781C90.1195 92.7564 90.2231 92.9183 90.3574 93.0527C90.492 93.1873 90.6544 93.2916 90.833 93.3574L99.4102 96.5176C99.6626 96.6106 99.8812 96.7784 100.035 96.999C100.189 97.2198 100.271 97.4829 100.271 97.752C100.271 98.021 100.189 98.2841 100.035 98.5049C99.8812 98.7255 99.6626 98.8933 99.4102 98.9863L90.833 102.146C90.6545 102.212 90.492 102.316 90.3574 102.45C90.2229 102.585 90.1195 102.747 90.0537 102.926L86.8936 111.504C86.8005 111.756 86.6318 111.974 86.4111 112.128C86.1905 112.282 85.9281 112.364 85.6592 112.364C85.3901 112.364 85.127 112.282 84.9062 112.128C84.6857 111.974 84.5179 111.756 84.4248 111.504L81.2646 102.926C81.1989 102.747 81.0945 102.585 80.96 102.45C80.8254 102.316 80.6629 102.212 80.4844 102.146L71.9072 98.9863C71.6549 98.8933 71.4371 98.7254 71.2832 98.5049C71.1293 98.2841 71.0469 98.021 71.0469 97.752C71.0469 97.4829 71.1293 97.2198 71.2832 96.999C71.4371 96.7785 71.6549 96.6106 71.9072 96.5176L80.4844 93.3574C80.663 93.2916 80.8253 93.1873 80.96 93.0527C81.0944 92.9182 81.1989 92.7566 81.2646 92.5781L84.4248 84C84.5178 83.7477 84.6857 83.5298 84.9062 83.376C85.127 83.2221 85.3901 83.1396 85.6592 83.1396Z"];
  function markSvg() {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 171 195"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "mark");
    MARK_PATHS.forEach(function (d) { var p = document.createElementNS(ns, "path"); p.setAttribute("d", d); s.appendChild(p); });
    return s;
  }
  function brand(tone) { return h("a", { class: "brand" + (tone ? " " + tone : ""), href: "#/", "aria-label": "Nozze in Ordine, torna all'inizio" }, markSvg(), h("span", null, "Nozze in Ordine")); }
  function btn(label, onclick, cls, ic) { return h("button", { class: "btn " + (cls || "soft"), type: "button", onclick: onclick }, ic ? icon(ic) : null, label); }
  function linkBtn(href, label, cls, ic, after) { return h("a", { class: "btn " + (cls || "soft"), href: href }, ic ? icon(ic) : null, label, after ? icon(after) : null); }
  function more(href, label) { return h("a", { class: "pill-link", href: href }, label, icon("arrow")); }
  function mini(label, onclick, cls) { return h("button", { class: "mini " + (cls || ""), type: "button", onclick: onclick }, label); }
  function badge(text, kind) { return h("span", { class: "badge " + (kind || "") }, text); }
  function count(n, kind) { return h("span", { class: "count " + (kind || "") }, String(n)); }
  function kpi(label, value, meta, cls, valueCls) {
    return h("div", { class: "kpi " + (cls || "") }, h("p", { class: "kpi-l" }, label), h("p", { class: "kpi-v " + (valueCls || "") }, value), meta ? h("p", { class: "kpi-m" }, meta) : null);
  }
  function kpis(list, cls) { return h("div", { class: "kpis " + (cls || "") }, list); }
  function panel(title, sub, action, body, cls, titleTag) {
    return h("section", { class: "panel " + (cls || "") }, h("header", { class: "panel-head" }, h("div", null, h(titleTag || "h2", null, title), sub ? h("p", { class: "sub" }, sub) : null), action || null), body);
  }
  function rowItem(o) {
    return h("li", { class: "row" + (o.cls ? " " + o.cls : "") }, o.lead || (o.icon ? h("span", { class: "ic-circle " + (o.tone || "") }, icon(o.icon)) : null),
      h("div", { class: "row-main" }, o.href ? h("a", { href: o.href }, h("b", null, o.title)) : h("b", null, o.title), o.meta ? h("small", null, o.meta) : null),
      o.side ? h("div", { class: "row-side" }, o.side) : null);
  }
  function empty(title, text, action, ic) {
    return h("div", { class: "empty" }, ic ? h("span", { class: "empty-ic" }, icon(ic)) : null, h("h2", null, title), text ? h("p", null, text) : null, action || null);
  }
  function eyebrow() { return api.mode === "demo" ? h("p", { class: "eyebrow" }, "Demo · Dati di esempio") : null; }
  function weddingMeta(w) { return [w.wedding_date ? fmtDate(w.wedding_date, true) : "Data da scegliere", w.city, w.ceremony && w.ceremony !== "da_decidere" ? "rito " + LABEL.ceremony[w.ceremony].toLowerCase() : null].filter(Boolean).join(" · "); }
  function chipInfo(text, ic) { return h("span", { class: "info-chip" }, icon(ic || "calendar"), text); }
  function pageHead(title, sub, actions, chip) {
    return h("header", { class: "page-head" }, h("div", { class: "ph-text" }, eyebrow(), h("h1", null, title), sub ? h("p", { class: "sub" }, sub) : null),
      actions || chip ? h("div", { class: "head-actions" }, actions || chip) : null);
  }
  function taskStatus(t, nextId) {
    if (t.done) return ["Completata", "ok"];
    if (t.due_date && t.due_date < todayIso()) return ["In ritardo", "late"];
    if (!t.due_date) return ["Senza scadenza", "wait"];
    if (t.id === nextId) return ["Prossima", "next"];
    return ["Da fare", "todo"];
  }
  function nextTask(tasks) { return tasks.filter(function (t) { return !t.done && t.due_date && t.due_date >= todayIso(); }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; })[0]; }
  function pager(total, size, key, label) {
    var pages = Math.max(1, Math.ceil(total / size)), p = Math.min(pages, Math.max(1, Number(store.get(key)) || 1));
    var set = function (v) { store.set(key, String(v)); render(); };
    var from = total ? (p - 1) * size + 1 : 0, to = Math.min(total, p * size);
    return { page: p, from: from - 1, to: to, el: total > size ? h("div", { class: "pager" }, h("p", null, from + "–" + to + " di " + total + " " + label),
      h("div", { class: "pager-btns" }, h("button", { class: "btn soft sm", type: "button", disabled: p <= 1, onclick: function () { set(p - 1); } }, "Precedente"),
        h("span", { class: "pager-n" }, p + " / " + pages), h("button", { class: "btn soft sm", type: "button", disabled: p >= pages, onclick: function () { set(p + 1); } }, "Successiva"))) : null };
  }
  function bar(parts, total, label, cls) {
    total = total || 1;
    return h("div", { class: "bar " + (cls || ""), role: "img", "aria-label": label }, parts.map(function (p) {
      return h("i", { class: p[1], style: "width:" + Math.max(0, Math.min(100, p[0] / total * 100)).toFixed(1) + "%" });
    }));
  }

  /* ------------------------------------------------------------ guscio */
  function navLink(href, label, ic, active) {
    return h("a", { href: "#/" + href, class: "nav-a" + (active ? " on" : ""), "aria-current": active ? "page" : null }, icon(ic), h("span", null, label));
  }
  /* ---- piani: i limiti li applica il database, qui si spiegano e si chiede il passaggio ---- */
  var PLAN = { gratis: "Gratis", tableau: "Pass Tableau", completo: "Completo", planner: "Planner", prova: "Prova gratuita", team: "Team", studio: "Studio", libero: "Senza limiti" };
  var PLAN_CAPS = { prova: [15, 3], planner: [5, 0], team: [15, 3] };
  /* Matrice dei diritti per piano del matrimonio: l'unico punto dell'interfaccia che decide cosa si può fare.
     Gli stessi limiti li applica il database (migrazione pass_tableau): qui servono a spiegarli prima dell'errore.
     null = senza limite. Prezzi per le coppie: Pass 19 €, Completo 49 €, dal Pass al Completo 30 €. */
  var RIGHTS = {
    gratis:   { guests: 50,   tables: 3,    vendors: 3,    quotes: 1,    print: false, timeline: false, invitePlanner: false, payments: false },
    tableau:  { guests: null, tables: null, vendors: 3,    quotes: 1,    print: true,  timeline: false, invitePlanner: false, payments: false },
    completo: { guests: null, tables: null, vendors: null, quotes: null, print: true,  timeline: true,  invitePlanner: true,  payments: true },
    planner:  { guests: null, tables: null, vendors: null, quotes: null, print: true,  timeline: true,  invitePlanner: true,  payments: true }
  };
  function rights(w) { return RIGHTS[(w && w.plan) || "completo"] || RIGHTS.completo; }
  function isGratis(w) { return !!w && w.plan === "gratis"; }
  function askPlan(plan, w) {
    var demo = api.mode !== "live";
    return attempt(function () { return api.requestPlan(plan, w ? w.id : null); }, demo ? "Demo: piano " + (PLAN[plan] || plan) + " attivato subito." : "Richiesta inviata. Ti scriviamo per email con i prossimi passi.")
      .then(function () { if (demo) return loadBase().then(render); }).catch(function () {});
  }
  // Il piano che sblocca una funzione, partendo dal piano attuale
  function nextPlan(w, feature) { return isGratis(w) && /^(invitati|tavoli|stampa|esporta)$/.test(feature) ? "tableau" : "completo"; }
  function unlockLabel(w, feature) {
    var p = nextPlan(w, feature);
    return p === "tableau" ? "Sblocca il tableau · 19 €" : w && w.plan === "tableau" ? "Passa al Completo · +30 €" : "Sblocca con il Completo · 49 €";
  }
  // "Sblocca": registra l'interesse (unlock_clicks), poi spiega il piano e lo fa chiedere. I pagamenti non sono ancora attivi.
  async function unlock(w, feature, title, text) {
    api.trackUnlock(w ? w.id : null, feature).catch(function () {});
    var p = nextPlan(w, feature), up = w && w.plan === "tableau";
    var price = p === "tableau" ? "Pass Tableau · 19 € una tantum, IVA inclusa" : up ? "Dal Pass Tableau al Completo · 30 €" : "Completo · 49 € una tantum, IVA inclusa";
    var r = await dialog(title, h("div", { class: "dlg-body" }, h("p", { class: "dlg-text" }, text), h("p", { class: "dlg-text" }, h("b", null, price), ". Nessun abbonamento.")), [
      h("a", { class: "btn ghost", href: "#/m/" + w.id + "/piano", onclick: function () { var d = this.closest("dialog"); if (d) d.close("no"); } }, "Il vostro piano"),
      canEdit(w) ? h("button", { class: "btn primary", value: "ok" }, p === "tableau" ? "Chiedi il Pass Tableau" : "Chiedi il piano Completo") : null]);
    if (r.value === "ok") askPlan(p, w);
  }
  // Anteprima di una funzione del Completo: dati di esempio sfocati e un riquadro con «Sblocca»
  function lockPreview(w, feature, title, text, sample) {
    return h("section", { class: "panel lock-prev" }, h("div", { class: "lock-sample", "aria-hidden": "true", inert: "" }, sample),
      h("div", { class: "lock-card" }, icon("lock"), h("h2", { class: "serif" }, title), h("p", null, text),
        h("div", { class: "btn-row" }, canEdit(w) ? unlockBtn(w, feature, title, text, "primary sm") : null, linkBtn("#/m/" + w.id + "/piano", "Il vostro piano", "soft sm"))));
  }
  var TXT_PAY = "Acconti e saldi per ogni fornitore, il grafico dei pagamenti mese per mese e i promemoria prima di ogni scadenza.";
  function samplePayChart() {
    var items = [], d = new Date();
    [1800, 900, 2600, 600, 3200, 1400].forEach(function (a, i) { var x = new Date(d.getFullYear(), d.getMonth() + i + 1, 10); items.push({ date: isoOf(x), amount: a, label: "Esempio" }); });
    return payChart(items, { title: "Pagamenti mese per mese" });
  }
  function sampleTimeline() {
    return h("ol", { class: "rows timeline" }, [["11:00", "Rito in chiesa", "Chiesa di San Michele"], ["12:30", "Foto con le famiglie", "Sagrato"], ["13:30", "Aperitivo di benvenuto", "Giardino della villa"], ["15:00", "Pranzo", "Sala principale"], ["18:30", "Taglio della torta", "Terrazza"]].map(function (r) {
      return h("li", { class: "row tl" }, h("b", { class: "time" }, r[0]), h("div", { class: "row-main" }, h("b", null, r[1])), h("div", { class: "tl-col" }, h("small", null, "Dove"), h("span", null, r[2])));
    }));
  }
  function unlockBtn(w, feature, title, text, cls) { return btn(unlockLabel(w, feature), function () { unlock(w, feature, title, text); }, cls || "primary", "lock"); }
  function planLock(w, title, text, feature) {
    var up = w && w.plan === "tableau";
    return [pageHead(title, null), panel(up ? "Incluso nel piano Completo · dal Pass +30 €" : "Incluso nel piano Completo", text, null, h("div", { class: "btn-row" },
      canEdit(w) ? unlockBtn(w, feature || "altro", title, text) : null, linkBtn("#/m/" + w.id + "/piano", "Il vostro piano", "soft")))];
  }
  function gratisBanner(w) {
    var tab = w.plan === "tableau";
    return h("div", { class: "alert info" }, icon("lock"), h("div", null,
      tab ? h("p", null, h("b", null, "Pass Tableau"), " · invitati e tavoli senza limiti, stampa ed esportazione del tableau. Acconti e saldi con i promemoria, fornitori illimitati, preventivi affiancati e programma del giorno sono nel Completo: dal Pass ci passate con 30 €.")
        : h("p", null, h("b", null, "Piano Gratis"), " · fino a 50 invitati, 3 fornitori, budget per voce e un'anteprima del tableau con 3 tavoli. Con il Pass Tableau (19 €) invitati e tavoli sono illimitati e il tableau si stampa; con il Completo (49 €) anche acconti, saldi e promemoria dei pagamenti."),
      h("div", { class: "btn-row" }, canEdit(w) ? unlockBtn(w, tab ? "altro" : "tavoli", tab ? "Passate al Completo" : "Il tableau completo", tab ? "Fornitori illimitati, preventivi affiancati e programma del giorno." : "Invitati illimitati, tavoli e sala senza limiti, stampa ed esportazione del tableau.", "primary sm") : null,
        linkBtn("#/m/" + w.id + "/piano", "Il vostro piano", "soft sm"))));
  }
  /* ---- il piano della coppia: cosa ha, cosa può sbloccare, a che punto è la richiesta ---- */
  // Offerte per le coppie (linea prezzi C). Mai abbonamenti. Gli sconti solo a tempo: { price: "39 €", until: "2027-01-31", note: "..." }.
  var COUPLE_OFFERS = {
    tableau: { name: "Pass Tableau", price: "19 €", items: ["Invitati illimitati", "Tavoli e sala in pianta senza limiti", "Stampa del tableau per gli ospiti", "Scheda per catering e location"] },
    completo: { name: "Completo", price: "49 €", upgrade: "30 €", items: ["Tutto il Pass Tableau", "Acconti, saldi e promemoria dei pagamenti", "Fornitori illimitati e preventivi affiancati", "Programma del giorno", "Invito alla wedding planner"] }
  };
  var PROMO = {}; // es. { completo: { price: "39 €", until: "2027-01-31" } }
  function promo(k) { var p = PROMO[k]; return p && p.until >= todayIso() ? p : null; }
  async function planView(w) {
    if (w.plan === "planner") return [pageHead("Il vostro piano", null), panel("Seguito dalla vostra wedding planner", "Il piano di questo matrimonio è della planner: per voi lo spazio è gratuito, senza limiti.", null, null)];
    var res = await Promise.all([api.myPlanRequests(w.id).catch(function () { return []; }), api.listPurchases(w.id).catch(function () { return []; }),
      api.list("guests", w.id), api.list("seating_tables", w.id), api.list("vendors", w.id)]);
    var reqs = res[0], buys = res[1], R = rights(w), cur = w.plan, edit = canEdit(w);
    var pending = function (k) { return reqs.filter(function (x) { return x.plan === k && x.stato === "nuova"; })[0]; };
    var use = function (label, n, max) { return h("div", null, h("dt", null, label), h("dd", null, max == null ? String(n) + " · senza limiti" : n + " su " + max)); };
    var current = panel("Piano " + PLAN[cur], cur === "gratis" ? "Senza scadenza. Potete restare sul Gratis quanto volete." : (w.plan_since ? "Attivo dal " + fmtDate(w.plan_since, true) + ". " : "") + "Pagato una volta sola, vale per questo matrimonio.", badge(PLAN[cur], cur === "gratis" ? "plain" : "solid-bord"),
      h("dl", { class: "kv" }, use("Invitati", res[2].length, R.guests), use("Tavoli", res[3].length, R.tables), use("Fornitori", res[4].length, R.vendors),
        h("div", null, h("dt", null, "Stampa ed esportazione del tableau"), h("dd", null, R.print ? "incluse" : "no")),
        h("div", null, h("dt", null, "Acconti, saldi e promemoria dei pagamenti"), h("dd", null, R.payments ? "inclusi" : "no")),
        h("div", null, h("dt", null, "Programma del giorno"), h("dd", null, R.timeline ? "incluso" : "no"))));
    function offer(k) {
      var o = COUPLE_OFFERS[k], up = k === "completo" && cur === "tableau", pr = promo(k), wait = pending(k);
      var price = up ? o.upgrade : pr ? pr.price : o.price;
      return h("article", { class: "panel plan-offer" + (k === "tableau" && cur === "gratis" ? " best" : "") },
        h("h2", { class: "serif" }, up ? "Passa al Completo" : o.name),
        h("p", { class: "plan-price" }, h("b", null, price), h("span", null, up ? " la differenza, una volta sola" : " una volta sola, IVA inclusa"),
          pr && !up ? h("small", null, "Invece di " + o.price + ", fino al " + fmtDate(pr.until, true)) : null),
        h("ul", { class: "checks" }, o.items.map(function (i) { return h("li", null, icon("check"), i); })),
        wait ? h("p", { class: "muted small" }, icon("clock"), " Richiesta inviata il " + fmtDate(wait.created_at, true) + ": vi scriviamo per email.")
          : edit ? btn(up ? "Chiedi il passaggio · " + price : "Chiedi il " + o.name + " · " + price, async function () {
              api.trackUnlock(w.id, k === "tableau" ? "tavoli" : "altro").catch(function () {});
              await askPlan(k, w); render(); }, k === "tableau" && cur === "gratis" || up ? "primary" : "soft") : null);
    }
    var offers = cur === "gratis" ? ["tableau", "completo"] : cur === "tableau" ? ["completo"] : [];
    var done = buys.filter(function (b) { return b.status === "paid" || b.status === "refunded"; });
    return [pageHead("Il vostro piano", "Cosa include il vostro spazio e cosa potete sbloccare. Per le coppie non ci sono abbonamenti."),
      current,
      offers.length ? h("div", { class: "plan-offers" }, offers.map(offer)) : panel("Avete tutto", "Il piano Completo include ogni funzione per le coppie.", null, null),
      offers.length ? h("p", { class: "muted small" }, icon("info"), " I pagamenti online non sono ancora attivi: la richiesta ci arriva e vi scriviamo per email con i passi per attivare il piano. Nessun addebito parte senza il vostro consenso.") : null,
      done.length ? panel("Acquisti", null, null, h("ul", { class: "plain-list" }, done.map(function (b) {
        return h("li", null, h("b", null, PLAN[b.product] || (b.product === "upgrade_completo" ? "Passaggio al Completo" : b.product)), h("span", { class: "muted" }, fmtDate(b.created_at, true) + " · " + eur(b.amount_cents / 100) + (b.status === "refunded" ? " · rimborsato" : "")));
      }))) : null];
  }
  function planPanel() {
    var me = state.me, p = me.plan || "libero", caps = PLAN_CAPS[p], today = new Date().toISOString().slice(0, 10);
    var days = me.trial_ends_at ? Math.ceil((new Date(me.trial_ends_at).getTime() - Date.now()) / 864e5) : 0;
    var active = state.weddings.filter(function (w) { return w.my_role === "planner" && (!w.wedding_date || w.wedding_date >= today); }).length;
    var line = p === "prova" ? (days > 0 ? "Prova gratuita: " + plural(days, "giorno rimasto", "giorni rimasti") + "." : "La prova gratuita è terminata. I matrimoni che segui restano disponibili; per crearne di nuovi serve un piano.")
      : p === "libero" ? "Il tuo account non ha limiti di piano." : "Piano " + PLAN[p] + ".";
    var asks = p === "prova" ? ["planner", "team"] : p === "planner" ? ["team"] : p === "team" ? ["studio"] : [];
    return panel("Il tuo piano", line, null, h("div", { class: "stack-sm" },
      caps ? h("p", { class: "small" }, h("b", null, "Matrimoni attivi"), h("br"), active + " su " + caps[0] + (caps[1] ? " · fino a " + caps[1] + " collaboratori" : " · i collaboratori sono nel piano Team")) : null,
      asks.length ? h("div", { class: "btn-row" }, asks.map(function (k, i) { return btn("Chiedi il piano " + PLAN[k], function () { askPlan(k); }, i === 0 && p === "prova" ? "primary sm" : "soft sm"); }), linkBtn("/prezzi", "Vedi i piani", "soft sm")) : null), "compact");
  }
  function weddingSections(w) {
    var items = [["panoramica", "Panoramica", "home"], ["scadenze", "Da fare", "todo"], ["budget", "Budget e pagamenti", "wallet"], ["fornitori", "Fornitori e preventivi", "briefcase"],
      ["invitati", "Invitati e tavoli", "users"], ["scaletta", "Programma del giorno", "calendar"], ["impostazioni", "Dati del matrimonio", "file"]];
    // collaboratori e note riservate sono strumenti della planner
    if (isPlannerHere(w)) items.splice(7, 0, ["persone", "Collaboratori", "userplus"]), items.push(["note", "Note riservate", "note"]);
    else if (w.plan !== "planner") items.push(["piano", "Il vostro piano", "lock"]);
    return items;
  }
  function weddingSelect(wid) {
    return h("label", { class: "switch" }, icon("search"), h("span", { class: "sr" }, wid ? "Cambia matrimonio" : "Apri un matrimonio"),
      h("select", { onchange: function (e) { if (e.target.value) go("m/" + e.target.value + "/panoramica"); } },
        h("option", { value: "" }, wid ? "Cambia matrimonio" : "Apri un matrimonio…"),
        state.weddings.map(function (x) { return h("option", { value: x.id }, x.title); })));
  }
  function shell(content) {
    var p = route(), wid = current(), w = wedding(wid), me = state.me, sec = wid ? p[2] || "panoramica" : null;
    if (sec === "tavoli") sec = "invitati";
    // la coppia ha un solo matrimonio: anche promemoria e profilo restano dentro il suo menu
    if (!w && me.role === "coppia" && state.weddings[0]) w = state.weddings[0];
    var nAlerts = computeAlerts().length;
    var bellLink = function (cls) {
      return h("a", { class: cls, href: "#/avvisi", "aria-label": nAlerts ? "Promemoria: " + nAlerts : "Promemoria" }, icon("bell"), nAlerts ? h("span", { class: "dot-n" }, String(nAlerts)) : null);
    };
    var ctx, main = [], other = [], tabs = [];
    if (w) {
      var secs = weddingSections(w);
      if (me.role === "coppia") ctx = h("div", { class: "ctx" }, h("p", { class: "ctx-l" }, "Matrimonio"), h("p", { class: "ctx-t" }, w.title), h("p", { class: "ctx-m" }, weddingMeta(w)));
      else ctx = h("div", { class: "ctx" }, h("a", { class: "ctx-box", href: "#/" + (me.role === "admin" ? "eventi" : "eventi") }, icon("back"), me.role === "admin" ? "Tutti i matrimoni" : "I miei matrimoni"),
        h("p", { class: "ctx-l" }, "Matrimonio selezionato"), h("p", { class: "ctx-t" }, w.title), h("p", { class: "ctx-m" }, weddingMeta(w)), state.weddings.length > 1 ? weddingSelect(wid) : null,
        h("p", { class: "ctx-l sp" }, LABEL.role[me.role]), h("p", { class: "ctx-t sm" }, me.full_name || me.email));
      main = secs.map(function (s) { return navLink("m/" + w.id + "/" + s[0], s[1], s[2], sec === s[0]); });
      other = [navLink("avvisi", "Promemoria", "bell", p[0] === "avvisi"), navLink("profilo", "Il mio profilo", "user", p[0] === "profilo")];
      tabs = [["m/" + w.id + "/panoramica", "Panoramica", "home", sec === "panoramica"], ["m/" + w.id + "/scadenze", "Da fare", "todo", sec === "scadenze"], ["m/" + w.id + "/budget", "Budget", "wallet", sec === "budget"], ["m/" + w.id + "/invitati", "Invitati", "users", sec === "invitati"]];
    } else if (me.role === "admin") {
      ctx = h("div", { class: "ctx" }, h("p", { class: "ctx-l" }, "Amministrazione"), h("p", { class: "ctx-t" }, "Privilegi di gestione"), h("p", { class: "ctx-m" }, "Accesso separato da eventi e ruoli pubblici"));
      main = [navLink("admin", "Riepilogo", "home", p[0] === "admin" && !p[1]), navLink("admin/utenti", "Utenti e ruoli", "users", p[1] === "utenti"), navLink("admin/lista", "Lista d'attesa", "table", p[1] === "lista"), navLink("eventi", "Tutti i matrimoni", "briefcase", p[0] === "eventi")];
      other = [navLink("profilo", "Il mio profilo", "user", p[0] === "profilo")];
      tabs = [["admin", "Riepilogo", "home", p[0] === "admin" && !p[1]], ["admin/utenti", "Utenti", "users", p[1] === "utenti"], ["admin/lista", "Lista", "table", p[1] === "lista"], ["profilo", "Profilo", "user", p[0] === "profilo"]];
    } else {
      var label = me.role === "planner" ? "Wedding planner" : "Il tuo account";
      ctx = h("div", { class: "ctx" }, h("p", { class: "ctx-l" }, label), h("p", { class: "ctx-t" }, me.full_name || me.email), h("p", { class: "ctx-m" }, me.business_name || (state.weddings.length ? plural(state.weddings.length, "matrimonio", "matrimoni") : "Spazio professionale · 0 matrimoni")));
      main = [me.role === "planner" ? navLink("eventi", "I miei matrimoni", "home", p[0] === "eventi") : (state.weddings[0] ? navLink("m/" + state.weddings[0].id + "/panoramica", "Il vostro matrimonio", "home", false) : null),
        navLink("avvisi", "Promemoria", "bell", p[0] === "avvisi"), navLink("profilo", "Il mio profilo", "user", p[0] === "profilo")];
      other = state.weddings.length ? [weddingSelect(null)] : [];
      tabs = [["eventi", "Matrimoni", "home", p[0] === "eventi"], ["avvisi", "Promemoria", "bell", p[0] === "avvisi"], ["profilo", "Profilo", "user", p[0] === "profilo"]];
    }
    var tone = me.role === "admin" && !w ? "ceramica" : "";
    function setNav(open) {
      state.navOpen = open;
      var sd = document.getElementById("side"); if (sd) sd.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) { var a = sd && (sd.querySelector(".close-nav") || sd.querySelector("a, button, select")); if (a) a.focus({ preventScroll: true }); } else toggle.focus();
    }
    var toggle = h("button", { class: "menu-btn", type: "button", "aria-expanded": state.navOpen ? "true" : "false", "aria-controls": "side", onclick: function () { setNav(!state.navOpen); } }, icon("menu"), "Menu");
    document.onkeydown = function (e) { if (e.key === "Escape" && state.navOpen) setNav(false); };
    var side = h("aside", { class: "side" + (state.navOpen ? " open" : ""), id: "side", "aria-label": "Navigazione" },
      h("div", { class: "side-top" }, brand(tone), h("button", { class: "icon-btn close-nav", type: "button", "aria-label": "Chiudi il menu", onclick: function () { setNav(false); } }, icon("x"))),
      ctx, h("nav", { class: "nav", "aria-label": "Sezioni" }, h("p", { class: "nav-l" }, "Principali"), main),
      other.length ? h("div", { class: "nav nav-foot" }, h("p", { class: "nav-l" }, "Altro"), other) : null);
    var banner = state.invites.length ? h("section", { class: "alert info invites", "aria-label": "Inviti ricevuti" }, icon("mail"), h("div", null, state.invites.map(function (i) {
      return h("div", { class: "invite-row" }, h("p", null, "Sei invitato a ", h("b", null, i.wedding_title), " come " + LABEL.member[i.member_role].toLowerCase() + ". L'invito usa la tua email: entri nello spazio esistente, senza crearne uno nuovo."),
        h("button", { class: "btn primary sm", type: "button", onclick: function () { acceptInvite(i); } }, "Accetta l'invito"));
    }))) : null;
    var tabbar = h("nav", { class: "tabbar", "aria-label": "Sezioni principali" }, tabs.map(function (t) {
      return h("a", { href: "#/" + t[0], class: t[3] ? "on" : null, "aria-current": t[3] ? "page" : null }, icon(t[2]), h("span", null, t[1]));
    }));
    return h("div", { class: "shell" + (w ? " in-wedding" : "") },
      h("header", { class: "topbar" }, brand(tone), h("div", { class: "top-actions" }, bellLink("bell"), toggle)),
      side, h("div", { class: "scrim", onclick: function () { setNav(false); } }),
      h("main", { class: "main", id: "main", tabindex: "-1" }, banner, content), tabbar);
  }
  async function acceptInvite(i) {
    try { var id = await api.acceptInvite(i.token); toast("Invito accettato."); await loadBase(); go("m/" + id + "/panoramica"); }
    catch (e) { if (/scadut|non valido/i.test(e.message || "")) go("invito-scaduto"); else toast(e.message || String(e), true); }
  }

  /* ------------------------------------------------------------ accesso */
  function passwordField(name, label, auto, help) {
    var inp = h("input", { id: "f-" + name, name: name, type: "password", required: true, autocomplete: auto, placeholder: help ? "Scegli una password sicura" : null });
    var eye = h("button", { class: "eye", type: "button", "aria-label": "Mostra la password", "aria-pressed": "false", onclick: function () {
      var on = inp.type === "password"; inp.type = on ? "text" : "password"; eye.setAttribute("aria-pressed", String(on)); eye.setAttribute("aria-label", on ? "Nascondi la password" : "Mostra la password");
    } }, icon("eye"));
    return h("div", { class: "fld" }, h("label", { for: "f-" + name }, label), h("div", { class: "pw" }, inp, eye), help ? h("small", null, help) : null);
  }
  function authLayout(card, tone) {
    return h("div", { class: "auth" }, h("div", { class: "auth-card" }, brand(tone), card),
      h("figure", { class: "auth-pic", "aria-hidden": "true" }));
  }
  // La registrazione è aperta a tutti: chi ha un invito usa la stessa email a cui è arrivato
  function noAccount(invited) {
    if (invited) return h("p", { class: "small" }, "Registrandoti accetti i termini e confermi di avere almeno 18 anni.");
    return h("div", { class: "no-account" }, h("h2", null, "Non hai ancora un account?"),
      h("p", null, "Crearlo è gratuito e non serve la carta di credito."),
      h("div", { class: "choices two" }, linkBtn("#/registrati", "Crea un account", "soft")),
      h("p", { class: "small" }, "Hai ricevuto un invito a un matrimonio? Registrati con la stessa email a cui è arrivato."));
  }
  function authScreen(kind) {
    var msg = h("p", { class: "form-msg", role: "status", "aria-live": "polite" });
    var say = function (t, bad) { msg.textContent = t; msg.className = "form-msg" + (bad ? " bad" : " good"); };
    var busy = function (f, on) { Array.prototype.forEach.call(f.querySelectorAll("button[type=submit]"), function (b) { b.disabled = on; }); };
    var card;
    if (kind === "registrati") {
      var roleOpt = function (v, t, checked) { return h("label", { class: "choice-card" }, h("input", { type: "radio", name: "role", value: v, checked: checked }), h("span", null, t)); };
      var f = h("form", { class: "auth-form", novalidate: true },
        h("fieldset", null, h("legend", null, "Chi sei?"), h("div", { class: "choices two" }, roleOpt("coppia", "Fai parte della coppia", true), roleOpt("planner", "Sei la wedding planner"))),
        field({ name: "full_name", label: "Nome e cognome", required: true, max: 120, autocomplete: "name", placeholder: "Ad esempio: Anna Russo" }),
        field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email", placeholder: "nome@esempio.it" }),
        passwordField("password", "Password", "new-password", "Almeno 8 caratteri."),
        h("label", { class: "check" }, h("input", { type: "checkbox", name: "privacy", required: true }), h("span", null, "Ho letto l'", h("a", { href: "/privacy", target: "_blank", rel: "noopener" }, "informativa privacy"), " e accetto i ", h("a", { href: "/termini", target: "_blank", rel: "noopener" }, "termini di servizio"), ".")),
        h("button", { class: "btn primary block", type: "submit" }, "Crea l'account"), msg);
      f.addEventListener("submit", async function (e) {
        e.preventDefault();
        var d = { full_name: f.elements.full_name.value.trim(), email: f.elements.email.value.trim(), password: f.elements.password.value, role: f.elements.role.value };
        if (!d.full_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return say("Controlla nome ed email: l'indirizzo sembra incompleto.", true);
        if (d.password.length < 8) return say("La password deve avere almeno 8 caratteri.", true);
        if (!f.elements.privacy.checked) return say("Per creare l'account serve spuntare la casella su privacy e termini.", true);
        busy(f, true);
        try { var r = await api.signUp(d); if (window.nioTrack) window.nioTrack("sign_up", { method: d.role }); say(r.needsConfirmation ? "Fatto. Ti abbiamo mandato un'email: apri il link per confermare l'indirizzo, poi accedi. Al primo accesso configuri il tuo spazio." : "Account creato.", false); }
        catch (err) { say(err.message, true); }
        busy(f, false);
      });
      card = [h("h1", null, "Crea il tuo account"), h("p", { class: "sub" }, "Gratis, senza carta di credito. Se hai ricevuto un invito a un matrimonio, usa la stessa email: entrando lo troverai ad aspettarti."), f,
        h("p", { class: "alt-link" }, "Hai già un account? ", h("a", { href: "#/accedi" }, "Accedi")), noAccount(true)];
    } else if (kind === "password") {
      var fp = h("form", { class: "auth-form", novalidate: true }, field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
        h("button", { class: "btn primary block", type: "submit" }, "Mandami il link"), msg);
      fp.addEventListener("submit", async function (e) {
        e.preventDefault(); busy(fp, true);
        try { await api.resetPassword(fp.elements.email.value.trim()); say("Se l'indirizzo è registrato, riceverai un'email con il link per scegliere una nuova password.", false); }
        catch (err) { say(err.message, true); }
        busy(fp, false);
      });
      card = [h("h1", null, "Recupera la password"), h("p", { class: "sub" }, "Ti mandiamo un link per sceglierne una nuova."), fp, h("p", { class: "alt-link" }, h("a", { href: "#/accedi" }, "Torna all'accesso"))];
    } else {
      var fl = h("form", { class: "auth-form", novalidate: true },
        field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email", placeholder: "nome@esempio.it" }),
        passwordField("password", "Password", "current-password"),
        h("button", { class: "btn primary block", type: "submit" }, "Accedi"), msg);
      fl.addEventListener("submit", async function (e) {
        e.preventDefault(); busy(fl, true);
        try { await api.signIn(fl.elements.email.value.trim(), fl.elements.password.value); }
        catch (err) { say(err.message, true); busy(fl, false); }
      });
      card = [h("h1", null, "Bentornati"), h("p", { class: "sub" }, "Accedi al tuo spazio di Nozze in Ordine."), fl,
        h("p", { class: "alt-row" }, h("span", null, "Password dimenticata?"), h("a", { href: "#/password" }, "Recupera")),
        noAccount()];
    }
    return authLayout(card);
  }

  function demoChooser() {
    var pick = function (role) { return async function () { await api.demoSignIn(role); }; };
    var card = function (title, sub, tag, demo, focus, foot, role, primary) {
      return h("article", { class: "demo-card" + (primary ? " on" : "") }, h("header", null, h("div", null, h("h2", null, title), h("p", null, sub)), badge(tag, primary ? "solid" : "")),
        h("div", { class: "demo-facts" }, h("div", null, h("b", null, "Demo"), h("span", null, demo)), h("div", null, h("b", null, "Focus"), h("span", null, focus))),
        h("footer", null, h("span", null, foot), h("button", { class: "btn " + (primary ? "primary" : "ghost"), type: "button", onclick: pick(role) }, "Apri demo " + ({ coppia: "coppia", vuota: "vuota", planner: "planner" }[role] || "amministrazione"), icon("arrow"))));
    };
    return h("div", { class: "chooser" }, h("header", { class: "chooser-top" }, brand("ceramica"), badge("Demo · Dati di esempio", "")),
      h("div", { class: "chooser-in" }, h("div", { class: "chooser-text" }, h("h1", null, "Scegli la demo"), h("p", null, "Esplora il prodotto con dati di esempio, dal punto di vista di una coppia o di un wedding planner."), h("a", { href: "index.html" }, "Torna all'accesso")),
        h("div", { class: "chooser-cards" }, h("p", { class: "eyebrow" }, "Seleziona il punto di vista"), h("p", { class: "sub" }, "Scegli l'esperienza che vuoi esplorare."),
          card("Organizziamo il nostro matrimonio", "La vista ideale per chi pianifica la propria cerimonia e il ricevimento.", "Coppia", "Anna e Marco · matrimonio a Caserta", "priorità, budget, invitati e tavoli", "Anna e Marco · Caserta", "coppia", true),
          card("Coppia appena iscritta", "Matrimonio vuoto sul piano Gratis: aggiungete invitati e tavoli e provate limiti, tableau e sblocchi. Nella demo i piani si attivano subito.", "Vuota", "Giulia e Luca · nessun dato", "piani, tableau e trascinamento", "Giulia e Luca · Napoli", "vuota"),
          card("Organizzo matrimoni per lavoro", "La vista ideale per wedding planner che seguono più eventi.", "Planner", "Beatrice · due matrimoni in corso", "clienti, fornitori, preventivi e coordinamento", "Beatrice · Wedding planner", "planner"),
          card("Amministrazione", "Utenti, ruoli e lista d'attesa, con accesso separato dagli eventi.", "Admin", "Cinque utenti di esempio", "ruoli e iscrizioni", "Accesso amministrativo", "admin"))));
  }

  function newPasswordScreen() {
    var msg = h("p", { class: "form-msg", role: "status", "aria-live": "polite" });
    var f = h("form", { class: "auth-form", novalidate: true }, passwordField("password", "Nuova password", "new-password", "Almeno 8 caratteri."),
      h("button", { class: "btn primary block", type: "submit" }, "Salva la password"), msg);
    f.addEventListener("submit", async function (e) {
      e.preventDefault();
      var p = f.elements.password.value;
      if (p.length < 8) { msg.textContent = "La password deve avere almeno 8 caratteri."; msg.className = "form-msg bad"; return; }
      try { await api.updatePassword(p); toast("Password aggiornata."); go(""); }
      catch (err) { msg.textContent = err.message; msg.className = "form-msg bad"; }
    });
    return authLayout([h("h1", null, "Scegli una nuova password"), f]);
  }

  /* ------------------------------------------------------------ avvio guidato */
  function wizState() {
    var me = state.me;
    if (!state.wiz || state.wiz.uid !== me.id) {
      var first = (me.full_name || "").trim().split(/\s+/)[0] || "";
      state.wiz = { uid: me.id, step: 1, err: null, d: me.role === "planner"
        ? { full_name: me.full_name || "", business_name: me.business_name || "", city: me.city || "", weddings_per_year: me.weddings_per_year || "1-5", work_mode: me.work_mode || "autonomia",
            path: "crea", partner_a: "", partner_b: "", wedding_date: "", nodate: false, wcity: "", budget: "", inv1: "", inv2: "" }
        : { partner_a: first, partner_b: "", wedding_date: "", nodate: false, city: "", priorities: [], budget: "", nobudget: false, guests: "", stage: "inizio", collab: "", collab_role: "sposi", suggest: [] } };
    }
    return state.wiz;
  }
  function wizard() {
    var me = state.me, s = wizState(), d = s.d, planner = me.role === "planner";
    var steps = planner ? ["La tua attività", "Il primo matrimonio", "Rivedi e crea"] : ["Il vostro matrimonio", "Priorità e persone", "Rivedi e crea"];
    var goStep = function (n) { s.step = n; s.err = null; render(); window.scrollTo(0, 0); };
    var val = function (form, name) { var el = form.elements[name]; return el ? el.value.trim() : ""; };
    var input = function (name, label, o) {
      o = o || {};
      return h("div", { class: "fld" + (o.wide ? " wide" : "") }, h("label", { for: "w-" + name }, label + (o.opt ? " · facoltativo" : "")),
        o.select ? h("select", { id: "w-" + name, name: name }, o.select.map(function (x) { return h("option", { value: x[0], selected: String(d[name]) === x[0] }, x[1]); }))
          : h("input", { id: "w-" + name, name: name, type: o.type || "text", value: d[name] || "", placeholder: o.ph, maxlength: o.max || 120, inputmode: o.num ? "numeric" : null, autocomplete: o.auto || "off", required: o.req, disabled: o.disabled }),
        o.help ? h("small", null, o.help) : null);
    };
    var choice = function (name, value, label, sub, multi) {
      var on = multi ? d[name].indexOf(value) >= 0 : d[name] === value;
      return h("label", { class: "choice-card" + (sub ? " tall" : "") }, h("input", { type: multi ? "checkbox" : "radio", name: name, value: value, checked: on }), h("span", null, h("b", null, label), sub ? h("small", null, sub) : null));
    };
    var info = function (title, text) { return h("div", { class: "alert info" }, icon("info"), h("div", null, h("b", null, title), h("p", null, text))); };
    var errEl = s.err ? h("div", { class: "alert bad", role: "alert" }, icon("alert"), h("div", null, h("b", null, s.err.title), h("p", null, s.err.text))) : null;
    var body, title, sub, foot;
    var form = h("form", { class: "wiz-card", novalidate: true });
    var readCommon = function () {
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || !(el.name in d)) return;
        if (el.type === "checkbox" && Array.isArray(d[el.name])) { /* letto sotto */ }
        else if (el.type === "checkbox") d[el.name] = el.checked;
        else if (el.type === "radio") { if (el.checked) d[el.name] = el.value; }
        else d[el.name] = el.value.trim();
      });
      Object.keys(d).forEach(function (k) { if (Array.isArray(d[k])) d[k] = Array.prototype.filter.call(form.querySelectorAll('input[name="' + k + '"]'), function (x) { return x.checked; }).map(function (x) { return x.value; }); });
    };
    var budgetNum = function (v) { return Math.round(num(String(v || "").replace(/\./g, "").replace(",", "."))); };
    var validEmail = function (v) { return !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); };

    if (!planner && s.step === 1) {
      title = "Cominciamo da voi"; sub = "Bastano i vostri nomi. Il resto può prendere forma con calma.";
      var dateIn = h("input", { id: "w-wedding_date", name: "wedding_date", type: "date", value: d.wedding_date || "", disabled: d.nodate, min: todayIso() });
      body = [h("p", { class: "wiz-q" }, "Come vi chiamate?"),
        h("div", { class: "grid-form" }, input("partner_a", "Il tuo nome", { req: true, help: "Il nome che vuoi usare nello spazio.", auto: "given-name" }), input("partner_b", "Nome dell'altra persona", { help: "Nessun ruolo prestabilito, solo voi." }),
          h("div", { class: "fld wide" }, h("label", { for: "w-wedding_date" }, "Data del matrimonio"), dateIn),
          h("label", { class: "check boxed wide" }, h("input", { type: "checkbox", name: "nodate", checked: d.nodate, onchange: function (e) { dateIn.disabled = e.target.checked; if (e.target.checked) dateIn.value = ""; } }),
            h("span", null, h("b", null, "Non abbiamo ancora scelto la data"), h("small", null, "Potrete aggiungerla più avanti. Per ora, nessuna scadenza automatica."))),
          input("city", "Città", { opt: true, wide: true, ph: "Dove vi piacerebbe festeggiare?", help: "Potete indicare anche solo una zona." })),
        info("Niente fretta di decidere tutto", "Lo spazio partirà senza invitati, spese o attività scadute. Aggiungerete solo quello che vi serve.")];
      foot = [h("span"), h("button", { class: "btn primary", type: "submit" }, "Continua")];
      form.onsubmit = function (e) {
        e.preventDefault(); readCommon();
        if (!d.partner_a) { s.err = { title: "Manca il tuo nome", text: "Scrivi almeno il tuo nome: il resto si può aggiungere dopo." }; return render(); }
        if (!d.nodate && d.wedding_date && d.wedding_date < todayIso()) { s.err = { title: "Questa data è già passata", text: "Scegli una data futura, oppure spunta «Non abbiamo ancora scelto la data»." }; return render(); }
        goStep(2);
      };
    } else if (!planner && s.step === 2) {
      title = "Cosa conta per voi?"; sub = "Poche indicazioni per partire. Le preferenze e gli inviti sono facoltativi.";
      var budIn = h("input", { id: "w-budget", name: "budget", inputmode: "numeric", value: d.budget || "", placeholder: "Importo in €", disabled: d.nobudget });
      body = [h("fieldset", null, h("legend", null, "Le vostre priorità · facoltativo, anche più di una"), h("div", { class: "choices three" }, Object.keys(LABEL.priority).map(function (k) { return choice("priorities", k, LABEL.priority[k], null, true); }))),
        h("div", { class: "grid-form" },
          h("div", { class: "fld" }, h("label", { for: "w-budget" }, "Budget indicativo · facoltativo"), budIn,
            h("label", { class: "check boxed" }, h("input", { type: "checkbox", name: "nobudget", checked: d.nobudget, onchange: function (e) { budIn.disabled = e.target.checked; if (e.target.checked) budIn.value = ""; } }), h("span", null, h("b", null, "Non lo sappiamo ancora")))),
          input("guests", "Invitati previsti", { opt: true, num: true, ph: "Es. 100", help: "È una stima, non aggiunge persone alla lista." })),
        h("fieldset", null, h("legend", null, "A che punto siete?"), h("div", { class: "choices three" }, Object.keys(LABEL.stage).map(function (k) { return choice("stage", k, LABEL.stage[k]); }))),
        h("div", { class: "sub-box" }, h("p", { class: "wiz-q" }, "Organizzate insieme · facoltativo"), h("p", { class: "small" }, "Invita l'altra persona della coppia o una wedding planner a collaborare. Non è un invito agli ospiti del matrimonio."),
          h("div", { class: "grid-form" }, input("collab", "Email del collaboratore", { type: "email", ph: "nome@esempio.it", auto: "email" }),
            input("collab_role", "Ruolo del collaboratore", { select: [["sposi", "Partner della coppia"], ["planner", "Wedding planner"]] })),
          h("p", { class: "small" }, "L'invito partirà solo dopo la creazione dello spazio."))];
      foot = [h("button", { class: "btn ghost", type: "button", onclick: function () { readCommon(); goStep(1); } }, "Indietro"),
        h("div", { class: "wiz-right" }, h("button", { class: "linkish", type: "button", onclick: function () { d.priorities = []; d.budget = ""; d.nobudget = false; d.guests = ""; d.collab = ""; goStep(3); } }, "Salta i campi facoltativi"), h("button", { class: "btn primary", type: "submit" }, "Continua"))];
      form.onsubmit = function (e) {
        e.preventDefault(); readCommon();
        if (!validEmail(d.collab)) { s.err = { title: "Controlla l'email del collaboratore", text: "Completa l'indirizzo o lascia vuoto il campo facoltativo." }; return render(); }
        goStep(3);
      };
    } else if (!planner) {
      title = "Il vostro spazio, come lo volete"; sub = "Controllate i dati prima di confermare. Potete tornare su ogni scelta.";
      var rev = function (l, v, st) { return h("div", { class: "rev" }, h("div", null, h("small", null, l), h("b", null, v)), h("button", { class: "linkish", type: "button", onclick: function () { readCommon(); goStep(st); } }, "Modifica")); };
      body = [rev("La coppia", [d.partner_a, d.partner_b].filter(Boolean).join(" e "), 1),
        rev("Data e città", (d.nodate || !d.wedding_date ? "Data da scegliere" : fmtDate(d.wedding_date, true)) + " · " + (d.city || "Città non indicata"), 1),
        rev("Budget e invitati previsti", (budgetNum(d.budget) ? eur(budgetNum(d.budget)) : "Budget da definire") + " · " + (num(d.guests) ? d.guests + " invitati previsti" : "Nessuna stima invitati"), 2),
        rev("Priorità e fase", (d.priorities.length ? d.priorities.map(function (k) { return { spese: "Spese", fornitori: "Fornitori", invitati: "Invitati" }[k]; }).join(" e ") : "Nessuna priorità indicata") + " · " + LABEL.stage[d.stage], 2),
        rev("Collaboratori", d.collab ? d.collab + " · " + (d.collab_role === "planner" ? "wedding planner" : "partner della coppia") : "Nessun invito da inviare", 2),
        h("fieldset", { class: "suggest" }, h("legend", null, "Da dove iniziare · suggerimenti da rivedere"), h("p", { class: "small" }, "Scegliete cosa aggiungere alla lista Da fare. Senza data, i suggerimenti non hanno scadenze."),
          SUGGEST.map(function (t) { return h("label", { class: "check boxed" }, h("input", { type: "checkbox", name: "suggest", value: t, checked: d.suggest.indexOf(t) >= 0 }), h("span", null, h("b", null, t), h("small", null, "Suggerimento · senza scadenza"))); })),
        info("Pronti a partire, non ancora creato", "Con la conferma creerete il vostro matrimonio. Invitati registrati: 0. Spese: 0 €. " + (d.collab ? "Un invito a " + d.collab + "." : "Nessun invito in partenza."))];
      foot = [h("button", { class: "btn ghost", type: "button", onclick: function () { readCommon(); goStep(2); } }, "Indietro"), h("button", { class: "btn primary", type: "submit" }, "Crea il nostro spazio")];
      form.onsubmit = async function (e) {
        e.preventDefault(); readCommon();
        var b = form.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "Creazione in corso…";
        var id = null;
        try {
          id = await api.createWedding({ title: [d.partner_a, d.partner_b].filter(Boolean).join(" e "), partner_a: d.partner_a, partner_b: d.partner_b, wedding_date: d.nodate ? null : (d.wedding_date || null),
            city: d.city, budget_total: d.nobudget ? 0 : budgetNum(d.budget), guests_expected: Math.round(num(d.guests)), priorities: d.priorities, stage: d.stage || null });
          for (var i = 0; i < d.suggest.length; i++) await api.insert("tasks", { wedding_id: id, title: d.suggest[i] });
          if (d.collab) await api.createInvite(id, d.collab, d.collab_role, me);
        } catch (err) {
          // Lo spazio può essere già nato anche se un passo dopo non è riuscito: si dice cosa è stato salvato.
          s.err = id ? { title: "Lo spazio è stato creato, ma un passaggio non è riuscito", text: (err.message || "") + ". Controllate «Da fare» e «Collaboratori» dalla Panoramica." }
            : { title: "Non siamo riusciti a creare lo spazio. I dati sono ancora qui.", text: (err.message || "") + ". Controlla la connessione e riprova." };
          if (!id) return render();
        }
        state.wiz = null; await loadBase(); toast("Il vostro spazio è pronto."); go("m/" + id + "/panoramica");
      };
    } else if (s.step === 1) {
      title = "Parliamo della tua attività"; sub = "Uno spazio professionale per seguire più matrimoni, senza mescolare dati e persone.";
      body = [h("div", { class: "grid-form" }, input("full_name", "Nome e cognome", { req: true, auto: "name" }), input("business_name", "Nome studio", { opt: true, ph: "Come si chiama la tua attività?", auto: "organization" }),
          input("city", "Area di lavoro", { ph: "Es. Toscana", help: "Regione o città principali." }), input("weddings_per_year", "Matrimoni seguiti in un anno", { select: opts(LABEL.perYear), help: "Una fascia indicativa, modificabile in seguito." })),
        h("fieldset", null, h("legend", null, "Come lavori?"), h("div", { class: "choices two" }, choice("work_mode", "autonomia", "Lavoro in autonomia"), choice("work_mode", "team", "Lavoro con un team"))),
        info("Uno spazio per il tuo lavoro", "Potrai gestire più eventi. Le note riservate al planner non saranno visibili alla coppia.")];
      foot = [h("span"), h("button", { class: "btn primary", type: "submit" }, "Continua")];
      form.onsubmit = function (e) { e.preventDefault(); readCommon(); if (!d.full_name) { s.err = { title: "Manca il tuo nome", text: "Scrivi nome e cognome per continuare." }; return render(); } goStep(2); };
    } else if (s.step === 2) {
      title = "Il primo matrimonio"; sub = "Crea un nuovo evento solo se non esiste già uno spazio per questa coppia.";
      var dIn = h("input", { id: "w-wedding_date", name: "wedding_date", type: "date", value: d.wedding_date || "", disabled: d.nodate, min: todayIso() });
      var creating = d.path === "crea";
      body = [h("div", { class: "choices two" }, h("label", { class: "choice-card tall" }, h("input", { type: "radio", name: "path", value: "crea", checked: creating, onchange: function () { readCommon(); render(); } }), h("span", null, h("b", null, "Crea un matrimonio"), h("small", null, "Per una coppia che non ha ancora uno spazio."))),
          h("label", { class: "choice-card tall" }, h("input", { type: "radio", name: "path", value: "invito", checked: !creating, onchange: function () { readCommon(); render(); } }), h("span", null, h("b", null, "Accetta un invito esistente"), h("small", null, "Unisciti allo spazio della coppia, senza duplicarlo.")))),
        creating ? [h("p", { class: "wiz-q" }, "Dati del nuovo matrimonio"),
          h("div", { class: "grid-form" }, input("partner_a", "Nome di una persona della coppia", { req: true }), input("partner_b", "Nome dell'altra persona"),
            h("div", { class: "fld wide" }, h("label", { for: "w-wedding_date" }, "Data del matrimonio"), dIn),
            h("label", { class: "check boxed wide" }, h("input", { type: "checkbox", name: "nodate", checked: d.nodate, onchange: function (e) { dIn.disabled = e.target.checked; if (e.target.checked) dIn.value = ""; } }), h("span", null, h("b", null, "La coppia non ha ancora scelto la data"))),
            input("wcity", "Città", { opt: true, ph: "Aggiungi una città" }), input("budget", "Budget indicativo", { opt: true, num: true, ph: "Importo in €", help: "Lascia vuoto se non è ancora definito." })),
          h("p", { class: "small" }, "Questo è un evento nuovo: nessun invitato registrato, nessuna spesa e nessuna scadenza finché la data non è nota.")]
          : h("div", { class: "sub-box" }, state.invites.length ? [h("p", null, "Inviti ricevuti con la tua email:"), h("ul", { class: "rows" }, state.invites.map(function (i) {
              return rowItem({ icon: "mail", title: i.wedding_title, meta: "Come " + LABEL.member[i.member_role].toLowerCase(), side: h("button", { class: "btn primary sm", type: "button", onclick: async function () { await saveProfile(); acceptInvite(i); } }, "Accetta") });
            }))] : h("p", null, "Hai ricevuto un invito? Usa il collegamento nell'email e accedi con lo stesso indirizzo. I dati dell'evento saranno recuperati dall'invito: qui comparirà appena arriva."))];
      foot = [h("button", { class: "btn ghost", type: "button", onclick: function () { readCommon(); goStep(1); } }, "Indietro"),
        h("div", { class: "wiz-right" }, creating ? h("button", { class: "linkish", type: "button", onclick: function () { readCommon(); d.wcity = ""; d.budget = ""; goStep(3); } }, "Salta i campi facoltativi") : null, h("button", { class: "btn primary", type: "submit" }, "Continua"))];
      form.onsubmit = function (e) {
        e.preventDefault(); readCommon();
        if (d.path === "crea" && !d.partner_a) { s.err = { title: "Manca un nome della coppia", text: "Scrivi almeno il nome di una persona della coppia." }; return render(); }
        goStep(3);
      };
    } else {
      title = "Controlla, poi inizia"; sub = "Rivedi la tua attività e il primo evento. Nessuno spazio è ancora stato creato.";
      var rv = function (l, v, st) { return h("div", { class: "rev" }, h("div", null, h("small", null, l), h("b", null, v)), h("button", { class: "linkish", type: "button", onclick: function () { readCommon(); goStep(st); } }, "Modifica")); };
      var creating3 = d.path === "crea";
      body = [rv("Attività", [d.full_name, d.business_name || "Wedding planner", LABEL.workMode[d.work_mode].replace("Lavoro ", "")].filter(Boolean).join(" · "), 1),
        rv("Area e volume", (d.city || "Area non indicata") + " · " + LABEL.perYear[d.weddings_per_year] + " matrimoni all'anno", 1),
        rv(creating3 ? "Primo evento · Nuova creazione" : "Primo evento", creating3 ? [d.partner_a, d.partner_b].filter(Boolean).join(" e ") + " · " + (d.nodate || !d.wedding_date ? "Data da scegliere" : fmtDate(d.wedding_date, true)) : "Entrerai tramite l'invito della coppia", 2),
        creating3 ? rv("Città e budget", (d.wcity || "Non indicata") + " · " + (budgetNum(d.budget) ? eur(budgetNum(d.budget)) : "Da definire"), 2) : null,
        creating3 ? h("div", null, h("p", { class: "wiz-q" }, "Invita la coppia · facoltativo"), h("div", { class: "grid-form" }, input("inv1", "Email di una persona della coppia", { type: "email", ph: "nome@esempio.it" }), input("inv2", "Seconda email", { type: "email", opt: true, ph: "nome@esempio.it" })),
          h("p", { class: "small" }, "Senza indirizzi non parte alcun invito. Puoi invitare la coppia anche dopo.")) : null,
        h("div", { class: "sub-box" }, h("p", { class: "wiz-q" }, "Chi vedrà cosa"), h("p", null, "La coppia invitata accederà ai dati condivisi del proprio matrimonio: attività, budget, fornitori e invitati."),
          info("Le note riservate non vengono mai condivise", "Le note del planner restano nello spazio professionale, separate dai contenuti della coppia."))];
      foot = [h("button", { class: "btn ghost", type: "button", onclick: function () { readCommon(); goStep(2); } }, "Indietro"), h("button", { class: "btn primary", type: "submit" }, "Crea il mio spazio")];
      form.onsubmit = async function (e) {
        e.preventDefault(); readCommon();
        if (!validEmail(d.inv1) || !validEmail(d.inv2)) { s.err = { title: "Controlla le email della coppia", text: "Completa gli indirizzi o lascia vuoti i campi." }; return render(); }
        var b = form.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "Creazione in corso…";
        var id = null, profileOk = false;
        try {
          await saveProfile(); profileOk = true;
          if (d.path === "crea") {
            id = await api.createWedding({ title: [d.partner_a, d.partner_b].filter(Boolean).join(" e "), partner_a: d.partner_a, partner_b: d.partner_b, wedding_date: d.nodate ? null : (d.wedding_date || null), city: d.wcity, budget_total: budgetNum(d.budget) });
            if (d.inv1) await api.createInvite(id, d.inv1, "sposi", me);
            if (d.inv2) await api.createInvite(id, d.inv2, "sposi", me);
          }
        } catch (err) {
          s.err = id || profileOk ? { title: "Una parte è stata salvata, una no", text: (id ? "Il matrimonio è stato creato. " : "La tua attività è stata salvata. ") + (err.message || "") + "." }
            : { title: "Non siamo riusciti a salvare. I dati sono ancora qui.", text: (err.message || "") + ". Controlla la connessione e riprova." };
          if (!id) return render();
        }
        state.wiz = null; await loadBase(); toast("Il tuo spazio è pronto."); go(id ? "m/" + id + "/panoramica" : "eventi");
      };
    }
    async function saveProfile() {
      var patch = { full_name: d.full_name, business_name: d.business_name, city: d.city, weddings_per_year: d.weddings_per_year, work_mode: d.work_mode };
      await api.updateMyProfile(me.id, patch); Object.assign(state.me, patch);
    }
    add(form, [errEl, body, h("div", { class: "wiz-foot" }, foot)]);
    var cancel = planner && s.step === 3 ? h("div", { class: "wiz-cancel" }, h("button", { class: "btn ghost", type: "button", onclick: async function () {
      if (!await confirmBox("Annullare la configurazione?", "Esci senza creare lo spazio. Potrai riprendere dal prossimo accesso.", "Esci", false)) return;
      state.wiz = null; await attempt(api.signOut);
    } }, "Annulla configurazione"), h("small", null, "Esci senza creare lo spazio. Per correggere i dati usa Indietro.")) : null;
    return h("div", { class: "wiz" }, h("header", { class: "wiz-top" }, brand("ceramica"), h("p", null, "Configura il tuo spazio · " + (planner ? "Wedding planner" : "Coppia"))),
      h("div", { class: "wiz-in" }, h("aside", { class: "wiz-steps" }, h("p", { class: "tagline" }, planner ? "Per wedding planner" : "Per la coppia"), h("p", { class: "step-n" }, "Passaggio " + s.step + " di 3"),
          h("ol", null, steps.map(function (t, i) { return h("li", { class: i + 1 < s.step ? "done" : i + 1 === s.step ? "on" : null, "aria-current": i + 1 === s.step ? "step" : null }, h("span", null, i + 1 < s.step ? icon("check") : String(i + 1)), t); })),
          h("p", { class: "small" }, planner ? "Ogni matrimonio ha il suo spazio. Le tue note riservate restano separate." : "Un passo alla volta. Potete iniziare anche senza aver deciso tutto."),
          h("p", { class: "small soft" }, "I campi facoltativi sono indicati. Potrai modificarli anche dopo.")),
        h("div", { class: "wiz-main" }, h("h1", null, title), h("p", { class: "sub" }, sub), form, cancel)));
  }

  /* ------------------------------------------------------------ panoramica */
  function budgetTotals(items) { return items.reduce(function (a, b) { a.total += cost(b); a.paid += num(b.paid); return a; }, { total: 0, paid: 0 }); }
  function guestCounts(guests) { var g = { si: 0, no: 0, in_attesa: 0 }; guests.forEach(function (x) { g[x.rsvp]++; }); return g; }
  function taskRow(t, w, nextId, opts) {
    opts = opts || {};
    var st = taskStatus(t, nextId), late = st[1] === "late";
    var setDone = async function (done) {
      if (!!t.done === done) return;
      await attempt(function () { return api.update("tasks", t.id, { done: done }); }, done ? "Attività completata." : "Attività riaperta."); await refreshAlerts(); render();
    };
    var tick = function (done, label) {
      var on = !!t.done === done;
      return h("button", { type: "button", class: "tick" + (on ? " on" : ""), "aria-pressed": String(on), onclick: function () { setDone(done); } }, h("span", { class: "tbox", "aria-hidden": "true" }, on ? icon("check") : null), label);
    };
    var ticks = h("span", { class: "ticks", role: "group", "aria-label": "Stato di " + t.title }, tick(false, "Da fare"), tick(true, "Completata"));
    var meta = opts.meta || [t.due_date ? (opts.rel ? whenText(t.due_date) : fmtDate(t.due_date)) : "senza scadenza", opts.wedding ? opts.wedding : LABEL.assignee[t.assignee]].join(" · ");
    return rowItem({ lead: h("span", { class: "ic-circle " + (t.done ? "ok" : late ? "terra" : "") }, icon(t.done ? "check" : "calendar")), title: t.title, meta: meta, cls: t.done ? "done" : null,
      side: [st[1] === "ok" || st[1] === "todo" ? null : badge(st[0], st[1]), opts.noToggle ? null : ticks, opts.actions ? h("span", { class: "row-actions" },
        mini("Modifica", function () { editDialog("Modifica attività", F.tasks, Object.assign({}, t, { phase: String(t.phase) }), "Salva", function (d) { d.phase = Number(d.phase); return api.update("tasks", t.id, d); }, "Salvato."); }),
        mini("Elimina", async function () { if (!await confirmBox("Eliminare l'attività?", "«" + t.title + "» verrà tolta dalla lista.", "Elimina")) return; await attempt(function () { return api.remove("tasks", t.id); }, "Eliminata."); render(); }, "danger")) : null] });
  }
  function lateSummary(open, tasks, href) {
    var late = open.filter(function (x) { return x.due_date && x.due_date < todayIso(); });
    if (!late.length) return null;
    return rowItem({ icon: "clock", tone: "terra-solid", title: late.length === 1 ? "1 attività è in ritardo" : late.length + " attività sono in ritardo", meta: (tasks.length - open.length) + " completate su " + tasks.length + " · " + late.length + " in ritardo", side: h("a", { class: "badge late", href: href }, late.length + " in ritardo") });
  }
  function payList(bud, rel) {
    var pays = [];
    bud.forEach(function (b) { installments(b).forEach(function (r) { if (r.date) pays.push({ b: b, r: r }); }); });
    pays = pays.sort(function (a, b) { return a.r.date < b.r.date ? -1 : 1; }).slice(0, 4);
    return pays.length ? h("ul", { class: "plain-list" }, pays.map(function (x) {
      var b = x.b;
      return h("li", null, h("span", { class: "ic-circle soft" }, icon(payIcon(b.category))), h("div", null, h("b", null, b.category + (x.r.kind === "pagamento" ? "" : " · " + x.r.kind)), h("small", null, eur(x.r.amount) + " · " + (rel ? whenText(x.r.date) : fmtDate(x.r.date)))));
    })) : h("p", { class: "muted" }, "Nessun pagamento con una data. Aggiungila nelle voci del budget.");
  }

  /* ---- Grafico "pagamenti mese per mese": quanto c'è da pagare in ogni mese, scaduti a parte ----
     items: [{ date: "2027-03-15", amount: 1500, label: "Catering", sub: "Anna e Marco" }] */
  var MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  function payChart(items, opts) {
    opts = opts || {};
    var today = todayIso().slice(0, 7), buckets = {}, overdue = { key: "late", items: [], total: 0 };
    items.forEach(function (x) {
      if (!x.date || !(x.amount > 0)) return;
      if (x.date < todayIso()) { overdue.items.push(x); overdue.total += x.amount; return; }
      var k = x.date.slice(0, 7); (buckets[k] = buckets[k] || { key: k, items: [], total: 0 }); buckets[k].items.push(x); buckets[k].total += x.amount;
    });
    var keys = Object.keys(buckets).sort();
    if (!keys.length && !overdue.items.length) return null;
    var cols = [], cur = today, last = keys.length ? keys[keys.length - 1] : today;
    if (opts.until && opts.until.slice(0, 7) > last) last = opts.until.slice(0, 7);
    while (cur <= last && cols.length < 24) {
      cols.push(buckets[cur] || { key: cur, items: [], total: 0 });
      var y = +cur.slice(0, 4), m = +cur.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } cur = y + "-" + String(m).padStart(2, "0");
    }
    if (overdue.items.length) cols.unshift(overdue);
    var max = Math.max.apply(null, cols.map(function (c) { return c.total; })) || 1;
    var peak = cols.filter(function (c) { return c.key !== "late"; }).reduce(function (a, c) { return c.total > (a ? a.total : 0) ? c : a; }, null);
    var firstKey = null;
    var name = function (c) { if (c.key === "late") return "Scaduti"; var m = MESI_BREVI[+c.key.slice(5, 7) - 1], show = firstKey === null || c.key.slice(5, 7) === "01"; if (firstKey === null) firstKey = c.key; return show ? m + " " + c.key.slice(2, 4) : m; };
    var longName = function (c) { return c.key === "late" ? "Pagamenti scaduti" : fmtDate(c.key + "-01", true).replace(/^1 /, ""); };
    var detail = h("p", { class: "pc-detail", role: "status", "aria-live": "polite" });
    var show = function (c) {
      detail.replaceChildren(h("b", null, longName(c) + ": " + eur(c.total)), c.items.length ? " · " + c.items.slice().sort(function (a, b) { return b.amount - a.amount; }).map(function (x) { return x.label + (x.sub ? " (" + x.sub + ")" : "") + " " + eur(x.amount); }).join(", ") : " · nessun pagamento");
    };
    var bars = cols.map(function (c) {
      var b = h("button", { type: "button", class: "pc-col" + (c.key === "late" ? " late" : "") + (c === peak ? " peak" : "") + (c.total ? "" : " empty"), "aria-label": longName(c) + ", " + eur(c.total) },
        h("span", { class: "pc-val" }, c === peak || c.key === "late" ? eur(c.total) : ""),
        h("span", { class: "pc-bar", style: "height:" + (c.total ? Math.max(3, c.total / max * 100) : 0) + "%" }),
        h("span", { class: "pc-x" }, name(c)));
      ["mouseenter", "focus", "click"].forEach(function (ev) { b.addEventListener(ev, function () { show(c); }); });
      return b;
    });
    show(peak || overdue);
    var table = h("table", { class: "sr" }, h("caption", null, opts.title || "Pagamenti mese per mese"),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, "Mese"), h("th", { scope: "col" }, "Da pagare"))),
      h("tbody", null, cols.map(function (c) { return h("tr", null, h("th", { scope: "row" }, longName(c)), h("td", null, eur(c.total))); })));
    var future = cols.filter(function (c) { return c.key !== "late"; }), sumF = future.reduce(function (s, c) { return s + c.total; }, 0);
    var avg = future.length > 1 && sumF ? h("p", { class: "pc-avg" }, "Media mensile fino al " + (opts.until ? "matrimonio" : "ultimo pagamento") + ": ", h("b", null, eur(Math.round(sumF / future.length))), " · " + plural(future.length, "mese", "mesi") + ", " + eur(sumF) + " in tutto" + (overdue.total ? " più " + eur(overdue.total) + " scaduti" : "") + ".") : null;
    var undated = opts.undated ? h("p", { class: "muted small" }, plural(opts.undated, "voce da pagare non ha", "voci da pagare non hanno") + " una data: non " + (opts.undated === 1 ? "compare" : "compaiono") + " nel grafico.") : null;
    return panel(opts.title || "Pagamenti mese per mese", opts.sub || "Quanto c'è da pagare in ogni mese. Tocca una colonna per vedere le voci.", opts.action || null,
      h("div", { class: "pc" }, h("div", { class: "pc-scroll" }, h("div", { class: "pc-cols", style: "--n:" + cols.length, "aria-hidden": "true" }, bars)), detail, avg, undated, table), "compact pc-panel");
  }
  // Quello che resta da pagare di una voce, diviso in acconto e saldo: il già pagato copre prima l'acconto
  function installments(b) {
    var c = cost(b), paid = num(b.paid), dep = Math.min(num(b.deposit), c), out = [];
    var depLeft = Math.max(0, dep - paid), balLeft = Math.max(0, c - Math.max(paid, dep));
    if (depLeft > 0) out.push({ kind: "acconto", amount: depLeft, date: b.deposit_due || b.due_date });
    if (balLeft > 0) out.push({ kind: dep > 0 ? "saldo" : "pagamento", amount: balLeft, date: b.due_date });
    return out;
  }
  function budgetPayItems(bud, sub) {
    var out = [];
    bud.forEach(function (b) { installments(b).forEach(function (r) { out.push({ date: r.date, amount: r.amount, label: b.category + (r.kind === "pagamento" ? "" : ", " + r.kind), sub: sub }); }); });
    return out;
  }

  async function overview(w) {
    var planner = isPlannerHere(w);
    var res = await Promise.all([api.list("budget_items", w.id), api.list("guests", w.id), api.list("tasks", w.id), api.list("vendors", w.id), planner ? api.list("internal_notes", w.id) : Promise.resolve([])]);
    var bud = res[0], guests = res[1], tasks = res[2], vendors = res[3], notes = res[4];
    state.hc[w.id] = headcount(guests);
    var t = budgetTotals(bud), n = daysTo(w.wedding_date), g = guestCounts(guests), cap = num(w.budget_total);
    var open = tasks.filter(function (x) { return !x.done; }), nx = nextTask(tasks);
    // Il primo giorno: niente invitati e niente spese, la pagina indica da dove cominciare
    if (!guests.length && !bud.length && !vendors.length) return firstDay(w, tasks);
    var focus = open.filter(function (x) { return x.due_date; }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; }).slice(0, planner ? 6 : 3);
    var tasksPanel = panel("Cosa devo fare adesso?", "Le attività più importanti da completare subito.", more("#/m/" + w.id + "/scadenze", "Vedi tutte"),
      h("ul", { class: "rows" }, lateSummary(open, tasks, "#/m/" + w.id + "/scadenze"), focus.map(function (x) { return taskRow(x, w, nx && nx.id, { rel: true, noToggle: !canEdit(w) }); }),
        !focus.length ? h("li", { class: "muted" }, open.length ? "Le attività aperte non hanno una data." : "Tutto fatto. Complimenti.") : null));
    var payPanel = rights(w).payments ? panel("Prossimi pagamenti", null, more("#/m/" + w.id + "/budget", "Vedi tutti"), payList(bud, planner), "compact") : null;
    var side = [planner ? panel("Budget e pagamenti", null, more("#/m/" + w.id + "/budget", "Vedi dettagli"), h("div", null, h("p", { class: "kpi-l" }, "Totale previsto"), h("p", { class: "kpi-v" }, eur(t.total)),
      cap ? h("p", { class: "muted" }, "Tetto di spesa " + eur(cap) + " · " + (t.total > cap ? "sopra di " + eur(t.total - cap) : "margine " + eur(cap - t.total))) : null,
      h("dl", { class: "kv" }, h("div", null, h("dt", null, "Già pagato"), h("dd", null, eur(t.paid))), h("div", null, h("dt", null, "Da pagare"), h("dd", null, eur(t.total - t.paid))),
        cap ? h("div", null, h("dt", null, "Tetto di spesa"), h("dd", null, eur(cap))) : null, cap ? h("div", null, h("dt", null, "Margine"), h("dd", null, eur(cap - t.total))) : null),
      h("p", { class: "bar-l" }, h("span", null, "Pagato"), h("span", null, t.total ? (t.paid / t.total * 100).toFixed(1).replace(".", ",") + "%" : "0%")), bar([[t.paid, "cer"]], t.total, "Pagato"),
      h("p", { class: "bar-l" }, h("span", null, "Da pagare"), h("span", null, t.total ? ((t.total - t.paid) / t.total * 100).toFixed(1).replace(".", ",") + "%" : "0%")), bar([[t.total - t.paid, "bord"]], t.total, "Da pagare")), "compact") : null,
      payPanel,
      planner ? panel("Fornitori", null, more("#/m/" + w.id + "/fornitori", "Vedi tutti"), h("ul", { class: "plain-list" }, [["da_scegliere", "search"], ["in_trattativa", "file"], ["confermato", "todo"]].map(function (k) {
        return h("li", null, h("span", { class: "ic-circle soft" }, icon(k[1])), h("b", null, LABEL.vendor[k[0]] + " " + vendors.filter(function (v) { return v.status === k[0]; }).length));
      })), "compact") : null,
      planner ? panel("Note riservate", null, badge("Solo planner", ""), h("div", null, h("p", { class: "muted" }, notes.length ? plural(notes.length, "nota riservata", "note riservate") + ", visibili solo alle planner." : "Nessuna nota ancora."),
        linkBtn("#/m/" + w.id + "/note", "Apri note riservate", "ghost sm")), "compact") : null];
    return [pageHead("Panoramica", "Cosa devo fare adesso? Ecco le priorità, il budget e gli ospiti in un solo sguardo.", null, chipInfo(weddingMeta(w))),
      kpis([kpi("Data del matrimonio", w.wedding_date ? fmtDate(w.wedding_date, true) : "Da scegliere", n == null ? "Nessun conto alla rovescia" : n < 0 ? "Auguri!" : n + " giorni da oggi · " + fmtDate(todayIso(), true)),
        kpi("Budget totale", eur(t.total), cap ? "Tetto di spesa " + eur(cap) + " · " + (t.total > cap ? "sopra di " + eur(t.total - cap) : "margine " + eur(cap - t.total)) : "Tetto di spesa da impostare"),
        kpi("Pagamenti", eur(t.paid), "Da pagare " + eur(t.total - t.paid)),
        kpi("Invitati", plural(guests.length, "persona", "totali").replace(/^1 persona$/, "1 persona"), g.si + " confermati · " + g.in_attesa + " in attesa · " + g.no + " declinati" + (w.guests_expected ? " · obiettivo " + w.guests_expected : ""))], "four"),
      !rights(w).payments ? lockPreview(w, "pagamenti", "Acconti, saldi e promemoria sono nel Completo", TXT_PAY, samplePayChart()) : (function () { var it = budgetPayItems(bud); return payChart(it, { until: w.wedding_date, undated: it.filter(function (x) { return !x.date; }).length, action: more("#/m/" + w.id + "/budget", "Vedi il budget") }); })(),
      h("div", { class: "split" }, tasksPanel, h("div", { class: "stack" }, side))];
  }
  function firstDay(w, tasks) {
    var names = [w.partner_a, w.partner_b].filter(Boolean).join(" e ") || w.title;
    var step = function (l, t, href, a) { return h("li", null, h("div", null, h("small", null, l), h("b", null, t)), h("a", { href: href }, a)); };
    return [h("header", { class: "page-head" }, h("div", { class: "ph-text" }, h("p", { class: "eyebrow" }, "Il vostro nuovo spazio"), h("h1", null, "Benvenuti, " + names), h("p", { class: "sub" }, "Il vostro spazio è pronto. Iniziate da una piccola scelta, senza dover completare tutto oggi."))),
      kpis([kpi("Data del matrimonio", w.wedding_date ? fmtDate(w.wedding_date, true) : "Da scegliere", w.wedding_date ? daysTo(w.wedding_date) + " giorni da oggi" : "Nessun conto alla rovescia"),
        kpi("Budget", num(w.budget_total) ? eur(w.budget_total) : "Da definire", num(w.budget_total) ? "Tetto di spesa indicativo" : "Nessun tetto impostato"),
        kpi("Spese registrate", "0 €", "0 € pagati · 0 € da pagare"), kpi("Invitati registrati", "0 persone", w.guests_expected ? "Stima: " + w.guests_expected + " previsti" : "Nessuna conferma da attendere")], "four"),
      panel("Da dove volete cominciare?", "Tre primi passi. Potete scegliere l'ordine che preferite.", null, h("ul", { class: "steps-list" },
        step("Il vostro matrimonio", w.wedding_date ? "La data è scelta: le scadenze sono pronte in «Da fare»" : "Aggiungete la data quando l'avrete scelta", "#/m/" + w.id + "/impostazioni", w.wedding_date ? "Rivedi i dati" : "Scegli la data"),
        step("Budget e pagamenti", "Definite una cifra indicativa, anche provvisoria", "#/m/" + w.id + "/budget", "Imposta budget"),
        step("Invitati", "Iniziate dalle persone che volete accanto", "#/m/" + w.id + "/invitati", "Aggiungi invitato"))),
      h("div", { class: "split even" },
        panel("Da fare, con calma", null, null, h("div", null, badge(tasks.some(function (t) { return !t.done && t.due_date && t.due_date < todayIso(); }) ? "Ci sono attività in ritardo" : "Nessuna attività in ritardo", "wait"),
          h("p", { class: "muted" }, w.wedding_date ? "Le scadenze automatiche sono calcolate sulla vostra data." : "Le attività suggerite non hanno scadenza finché la data non è nota. Potete rivederle prima di aggiungerle."),
          linkBtn("#/m/" + w.id + "/scadenze", "Rivedi le attività", "ghost"))),
        isPlannerHere(w) ? panel("Organizzate insieme", null, null, h("div", null, h("p", { class: "muted" }, "Invita la coppia a seguire il matrimonio. Questi accessi sono separati dalla lista degli ospiti."),
          linkBtn("#/m/" + w.id + "/persone", "Invita un collaboratore", "ghost"))) : null)];
  }

  /* ------------------------------------------------------------ da fare */
  async function tasksView(w) {
    var tasks = await api.list("tasks", w.id);
    var filter = store.get("nio-tf") || "open";
    var open = tasks.filter(function (t) { return !t.done; }), doneN = tasks.length - open.length;
    var late = open.filter(function (t) { return t.due_date && t.due_date < todayIso(); }), nx = nextTask(tasks);
    var ro = !canEdit(w);
    var addBtn = ro ? null : more("#", "Aggiungi attività");
    if (addBtn) addBtn.onclick = function (e) {
      e.preventDefault();
      editDialog("Nuova attività", F.tasks, { phase: "0", assignee: "sposi" }, "Aggiungi", function (d) { d.phase = Number(d.phase); d.wedding_id = w.id; return api.insert("tasks", d); }, "Attività aggiunta.");
    };
    var shown = (filter === "done" ? tasks.filter(function (t) { return t.done; }) : filter === "all" ? tasks : open).slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!a.due_date) return 1; if (!b.due_date) return -1; return a.due_date < b.due_date ? -1 : 1;
    });
    var pg = pager(shown.length, 8, "nio-tp-" + filter, filter === "open" ? "attività da fare" : "attività");
    var seg = h("div", { class: "seg", role: "group", "aria-label": "Filtra le attività" }, [["open", "Da fare · " + open.length], ["done", "Completate · " + doneN], ["all", "Tutte · " + tasks.length]].map(function (o) {
      return h("button", { type: "button", class: filter === o[0] ? "on" : null, "aria-pressed": String(filter === o[0]), onclick: function () { store.set("nio-tf", o[0]); render(); } }, o[1]);
    }));
    return [pageHead("Da fare", w.wedding_date ? "Tutte le attività in un elenco compatto. Le date si riferiscono al " + fmtDate(w.wedding_date, true) + "." : "Senza data non ci sono scadenze automatiche: nascono quando scegliete la data.", null, chipInfo(weddingMeta(w))),
      kpis([kpi("Data del matrimonio", w.wedding_date ? fmtDate(w.wedding_date, true) : "Da scegliere", w.wedding_date ? daysTo(w.wedding_date) + " giorni da oggi · " + fmtDate(todayIso(), true) : null),
        kpi("Attività totali", String(tasks.length), doneN + " completate · " + open.length + " da fare"),
        kpi("In ritardo", String(late.length), late.length ? "Scadenze superate al " + fmtDate(todayIso(), true) : "Nessuna scadenza superata", "", late.length ? "terra" : ""),
        kpi("Prossima azione", nx ? fmtDate(nx.due_date) : "—", nx ? nx.title + " · " + whenText(nx.due_date) : "Nessuna scadenza in arrivo")], "four"),
      panel("Tutte le attività", tasks.length + " attività · " + doneN + " completate · " + late.length + " in ritardo", addBtn, [seg,
        shown.length ? h("ul", { class: "rows" }, shown.slice(pg.from, pg.to).map(function (t) { return taskRow(t, w, nx && nx.id, { actions: !ro, noToggle: ro }); }))
          : h("p", { class: "muted pad" }, filter === "open" ? "Niente da fare: tutto completato." : "Nessuna attività."), pg.el])];
  }

  /* ------------------------------------------------------------ budget */
  // Finché resta qualcosa da pagare serve la data del prossimo pagamento
  function checkBudget(d) {
    if (num(d.deposit) > 0 && num(d.deposit) > num(d.paid) && !d.deposit_due) throw new Error("Scrivete entro quando versare l'acconto.");
    if (num(d.deposit) > cost(d) && cost(d) > 0) throw new Error("L'acconto non può superare il costo della voce.");
    if (cost(d) > Math.max(num(d.paid), num(d.deposit)) && !d.due_date) throw new Error("Scrivete entro quando saldare: resta ancora qualcosa da pagare.");
  }
  // Un'unica finestra per tutte le voci: i campi cambiano con la voce scelta, e ogni voce si usa una volta sola.
  async function budgetDialog(w, b, items) {
    var used = items.filter(function (x) { return !b || x.id !== b.id; }).map(function (x) { return x.category; });
    var free = CATS.filter(function (c) { return used.indexOf(c) < 0; });
    if (b && free.indexOf(b.category) < 0) free.unshift(b.category);
    var pays = rights(w).payments;
    var fields = F.budget_items.filter(function (f) { return pays || ["deposit", "deposit_due", "due_date"].indexOf(f.name) < 0; })
      .map(function (f) { return f.name === "category" ? Object.assign({}, f, { options: free.map(function (c) { return [c, c]; }) }) : f; });
    var vals = Object.assign({}, b || { category: free[0] }, { rental: b && b.rental_amount != null ? "si" : "no" });
    var els = {}, hc = state.hc[w.id] || headcount([]);
    var body = h("div", { class: "dlg-body grid-form" }, fields.map(function (f) { return (els[f.name] = field(f, vals[f.name])); }));
    var calc = h("div", { class: "calc wide", "aria-live": "polite" });
    body.append(calc);
    if (!pays) body.append(h("p", { class: "muted small wide" }, icon("lock"), " Acconto, saldo e date dei pagamenti, con i promemoria, sono nel piano Completo."));
    var get = function (n) { var el = body.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
    var amount = function (n) { return num(get(n).replace(",", ".")); };
    var show = function (n, on) { els[n].hidden = !on; els[n].querySelectorAll("input, select").forEach(function (x) { x.disabled = !on; }); };
    function sync() {
      var cat = get("category"), u = UNIT[cat], person = u === "persona", rent = cat === RENTAL && get("rental") === "si";
      show("unit_price", !!u); show("unit_child", person); show("rental", cat === RENTAL); show("rental_amount", rent); show("planned", !u); show("contracted", !u);
      els.unit_price.querySelector("label").textContent = person ? "Costo per adulto (€)" : cat === "Bomboniere" ? "Costo per bomboniera (€)" : "Costo per partecipazione (€)";
      els.unit_price.querySelector("input").required = !!u;
      if (!u) { calc.replaceChildren(); return; }
      var d = { category: cat, unit_price: amount("unit_price"), unit_child: amount("unit_child"), rental_amount: rent ? amount("rental_amount") : null };
      var parts = person ? [hc.adulti + " adulti × " + eur(d.unit_price), hc.bambini + " bambini × " + eur(d.unit_child)].concat(rent ? ["noleggio " + eur(d.rental_amount)] : [])
        : [unitCount(d, hc) + (cat === "Bomboniere" ? " nuclei che vengono" : " nuclei invitati") + " × " + eur(d.unit_price)];
      calc.replaceChildren(h("span", null, "Costo calcolato dagli invitati"), h("b", null, eur(unitCost(d, hc))),
        h("small", null, parts.join(" + ") + (person && hc.piccoli ? " · " + hc.piccoli + " sotto i 3 anni non si contano" : "") + ". Chi ha detto no non si conta; il totale si aggiorna da solo quando cambia la lista."));
    }
    body.addEventListener("input", sync); body.addEventListener("change", sync);
    var p = dialog(b ? "Modifica voce" : "Nuova voce di spesa", body, [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, b ? "Salva" : "Aggiungi")
    ], async function (form) {
      var d = readForm(form, fields), u = UNIT[d.category];
      if (u) {
        d.rental_amount = d.category === RENTAL && d.rental === "si" ? d.rental_amount : null;
        if (u === "nucleo") d.unit_child = 0;
        d.contracted = 0; d.planned = unitCost(d, hc);
      } else { d.unit_price = 0; d.unit_child = 0; d.rental_amount = null; }
      delete d.rental;
      if (pays) checkBudget(Object.assign({ wedding_id: w.id }, d));
      if (b) await api.update("budget_items", b.id, d);
      else { d.wedding_id = w.id; await api.insert("budget_items", d); }
    });
    sync();
    var r = await p;
    if (r.value === "ok") { toast(b ? "Salvato." : "Voce aggiunta."); render(); }
  }
  function unitNote(b) {
    var hc = state.hc[b.wedding_id] || headcount([]);
    if (UNIT[b.category] === "nucleo") return eur(b.unit_price) + " × " + unitCount(b, hc) + (b.category === "Bomboniere" ? " nuclei che vengono" : " nuclei invitati");
    return [eur(b.unit_price) + " × " + hc.adulti + " adulti", num(b.unit_child) ? eur(b.unit_child) + " × " + hc.bambini + " bambini" : null, b.rental_amount != null ? "noleggio " + eur(b.rental_amount) : null].filter(Boolean).join(" + ");
  }
  // Cella "Acconto" o "Saldo": importo, entro quando, e se è già pagato
  function payCell(b, kind) {
    var c = cost(b), dep = Math.min(num(b.deposit), c), paid = num(b.paid);
    var amount = kind === "acconto" ? dep : c - dep, date = kind === "acconto" ? b.deposit_due : b.due_date;
    if (!amount) return h("td", { class: "n" }, h("span", { class: "muted" }, "—"));
    var done = kind === "acconto" ? paid >= dep : paid >= c;
    var late = !done && date && date < todayIso();
    return h("td", { class: "n" }, h("b", null, eur(amount)), h("small", { class: "pay-when" + (late ? " late" : "") }, done ? "pagato" : date ? (late ? "scaduto il " : "entro il ") + fmtDate(date) : "data da scrivere"));
  }
  async function budgetView(w) {
    var res = await Promise.all([api.list("budget_items", w.id), api.list("guests", w.id)]);
    var items = res[0], ro = !canEdit(w);
    state.hc[w.id] = headcount(res[1]);
    var t = budgetTotals(items), cap = num(w.budget_total);
    var full = !CATS.some(function (c) { return !items.some(function (x) { return x.category === c; }); });
    var addBtn = ro ? null : full ? h("span", { class: "muted small" }, "Tutte le voci sono già nel budget") : btn("Aggiungi voce", function () { budgetDialog(w, null, items); }, "primary sm", "plus");
    var left = t.total - t.paid;
    var head = pageHead("Budget e pagamenti", "Quanto spenderete in tutto, quanto avete già pagato e come si divide la spesa.", null, chipInfo(weddingMeta(w)));
    var k = kpis([kpi("Costo previsto", eur(t.total), "Somma di " + plural(items.length, "voce", "voci")), kpi("Già pagato", eur(t.paid), "Acconti e pagamenti registrati"), kpi("Da pagare", eur(left), "Importi ancora da versare"),
      kpi("Budget massimo", cap ? eur(cap) : "Da definire", cap ? (t.total > cap ? "Sopra il tetto di " + eur(t.total - cap) : "Margine disponibile " + eur(cap - t.total)) : h("a", { href: "#/m/" + w.id + "/impostazioni" }, "Imposta il tetto di spesa"), "", cap && t.total > cap ? "terra" : "")], "four");
    if (!items.length) {
      return [head, k, panel("Tutte le voci", null, addBtn, empty("Ancora nessuna voce di spesa", ro ? "La planner non ha ancora inserito le spese." : "Potete partire dalle voci tipiche di un matrimonio, viaggio di nozze compreso, e poi scrivere le cifre.",
        ro ? null : btn("Parti dalle voci tipiche", async function () {
          await attempt(async function () { for (var i = 0; i < CATS.length; i++) await api.insert("budget_items", { wedding_id: w.id, category: CATS[i] }); }, "Voci aggiunte: ora scrivete i costi.");
          render();
        }, "ghost"), "wallet"))];
    }
    var sorted = items.slice().sort(function (a, b) { return cost(b) - cost(a); }), P = rights(w).payments;
    var table = h("div", { class: "tscroll" }, h("table", { class: "tbl" },
      h("caption", { class: "sr" }, "Voci di spesa"),
      h("thead", null, h("tr", null, ["Voce", "Costo", P ? "Acconto" : null, P ? "Saldo" : null, "Già pagato", "Da pagare", ro ? null : "Azioni"].filter(Boolean).map(function (x, i, a) { return h("th", { scope: "col", class: i >= 1 && i < a.length - (ro ? 0 : 1) ? "n" : null }, x); }))),
      h("tbody", null, sorted.map(function (b) {
        var c = cost(b), pct = t.total ? Math.round(c / t.total * 100) : 0, settled = c > 0 && num(b.paid) >= c, unit = isUnit(b);
        return h("tr", { class: settled ? "settled" : null }, h("th", { scope: "row" }, h("b", null, b.category, settled ? badge("Saldato", "ok") : null), h("small", null, [b.description, unit ? unitNote(b) : num(b.contracted) > 0 ? "contratto" : c ? "stima" : "costo da scrivere", pct ? pct + "% del totale" : null].filter(Boolean).join(" · "))),
          h("td", { class: "n" }, eur(c)), P ? payCell(b, "acconto") : null, P ? payCell(b, "saldo") : null, h("td", { class: "n" }, eur(b.paid)), h("td", { class: "n" }, eur(Math.max(0, c - num(b.paid)))),
          ro ? null : h("td", null, h("span", { class: "row-actions" },
            mini("Modifica", function () { budgetDialog(w, b, items); }),
            mini("Elimina", async function () { if (!await confirmBox("Eliminare la voce?", "«" + b.category + "» verrà tolta dal budget.", "Elimina la spesa")) return; await attempt(function () { return api.remove("budget_items", b.id); }, "Eliminata."); render(); }, "danger"))));
      })),
      h("tfoot", null, h("tr", null, h("th", { scope: "row" }, "Totale"), h("td", { class: "n" }, eur(t.total)), P ? h("td", { class: "n" }, eur(items.reduce(function (a, b) { return a + Math.min(num(b.deposit), cost(b)); }, 0))) : null, P ? h("td", { class: "n" }, eur(items.reduce(function (a, b) { return a + Math.max(0, cost(b) - Math.min(num(b.deposit), cost(b))); }, 0))) : null, h("td", { class: "n" }, eur(t.paid)), h("td", { class: "n" }, eur(left)), ro ? null : h("td", null)))));
    // su telefono: una scheda per voce invece della tabella
    var cards = h("ul", { class: "bud-cards" }, sorted.map(function (b) {
      var c = cost(b), paid = num(b.paid), settled = c > 0 && paid >= c, unit = isUnit(b);
      var line = function (kind) {
        var dep = Math.min(num(b.deposit), c), amount = kind === "acconto" ? dep : c - dep, date = kind === "acconto" ? b.deposit_due : b.due_date;
        if (!amount) return null;
        var done = kind === "acconto" ? paid >= dep : paid >= c, late = !done && date && date < todayIso();
        return h("li", { class: "bud-pay" + (done ? " done" : "") + (late ? " late" : "") }, h("span", null, kind === "acconto" ? "Acconto" : dep ? "Saldo" : "Pagamento"),
          h("span", { class: "bud-when" }, done ? "pagato" : date ? (late ? "scaduto il " : "entro il ") + fmtDate(date) : "data da scrivere"), h("b", null, eur(amount)));
      };
      return h("li", { class: "bud-card" + (settled ? " settled" : "") },
        h("div", { class: "bud-top" }, h("div", null, h("b", null, b.category), h("small", null, [b.description, unit ? unitNote(b) : num(b.contracted) > 0 ? "contratto" : c ? "stima" : "costo da scrivere"].filter(Boolean).join(" · "))),
          h("b", { class: "bud-cost" }, eur(c))),
        c ? h("div", { class: "bud-prog" }, bar([[Math.min(paid, c), "cer"]], c, "Pagato"), h("small", null, settled ? "Saldato" : "Pagato " + eur(paid) + " · da pagare " + eur(Math.max(0, c - paid)))) : null,
        P ? h("ul", { class: "bud-pays" }, line("acconto"), line("saldo")) : null,
        ro ? null : h("div", { class: "bud-act" },
          mini("Modifica", function () { budgetDialog(w, b, items); }),
          mini("Elimina", async function () { if (!await confirmBox("Eliminare la voce?", "«" + b.category + "» verrà tolta dal budget.", "Elimina la spesa")) return; await attempt(function () { return api.remove("budget_items", b.id); }, "Eliminata."); render(); }, "danger")));
    }));
    return [head, k, P ? null : lockPreview(w, "pagamenti", "Acconti, saldi e promemoria sono nel Completo", TXT_PAY, samplePayChart()),
      h("section", { class: "panel" }, h("div", { class: "panel-head" }, h("div", null, addBtn, h("h2", { class: "serif" }, "Tutte le voci"))), table, cards,
      h("p", { class: "muted small pad-t" }, "Totale previsto " + eur(t.total) + " · Pagato " + eur(t.paid) + " · Da pagare " + eur(left) + (cap ? " · " + (t.total > cap ? "Sopra il budget di " + eur(t.total - cap) : "Margine sul budget " + eur(cap - t.total)) : "") + ". Location, catering, bomboniere e partecipazioni si calcolano dagli invitati; le altre voci usano il contratto quando c'è, altrimenti la stima."))];
  }

  /* ------------------------------------------------------------ fornitori e preventivi */
  // Schede della stessa pagina: ognuna è un indirizzo a sé, non un'ancora
  function subTabs(base, list, cur) {
    return h("nav", { class: "seg tabs", "aria-label": "Viste della pagina" }, list.filter(Boolean).map(function (t) {
      var on = cur === t[0];
      return h("a", { href: "#/" + base + (t[0] ? "/" + t[0] : ""), class: on ? "on" : null, "aria-current": on ? "page" : null }, t[1]);
    }));
  }
  function vendorCats(w) { return CATS.concat((w.vendor_categories || []).filter(function (c) { return CATS.indexOf(c) < 0; })); }
  // Chi paga un prezzo a persona: chi viene (sotto i 3 anni esclusi), oppure la stima finché la lista è vuota
  function payingPeople(w) { var hc = state.hc[w.id], n = hc ? hc.adulti + hc.bambini : 0; return n || num(w.guests_expected); }
  function vendorTotal(w, qs) { var n = payingPeople(w); return qs.reduce(function (a, q) { return a + (q.per_person ? num(q.amount) * n : num(q.amount)); }, 0); }
  async function vendorDialog(w, v, cats) {
    var fields = F.vendors.map(function (f) { return f.name === "category" ? Object.assign({}, f, { options: cats.map(function (c) { return [c, c]; }) }) : f; });
    if (!v) fields = fields.concat([
      { name: "amount", label: "Costo del servizio (€)", type: "number", min: 0, step: "0.01", help: "Diventa il primo preventivo della scheda: potete aggiungerne altri." },
      { name: "per_person", label: "Il costo è a persona", type: "checkbox" },
      { name: "includes", label: "Cosa comprende il costo", max: 500, wide: true }]);
    return editDialog(v ? "Modifica fornitore" : "Nuovo fornitore", fields, v || { category: cats[0] }, v ? "Salva" : "Aggiungi", async function (d) {
      if (v) return api.update("vendors", v.id, { category: d.category, name: d.name, contact: d.contact, notes: d.notes });
      var id = crypto.randomUUID();
      await api.insert("vendors", { id: id, wedding_id: w.id, category: d.category, name: d.name, contact: d.contact, notes: d.notes, status: "da_scegliere" });
      if (d.amount > 0) await api.insert("quotes", { wedding_id: w.id, vendor_id: id, label: "Costo del servizio", amount: d.amount, per_person: d.per_person, includes: d.includes });
    }, v ? "Salvato." : "Fornitore aggiunto.");
  }
  // Confermare un fornitore archivia gli altri della categoria e porta il suo costo nel budget.
  async function confirmVendor(w, v, vendors, quotes) {
    var others = vendors.filter(function (x) { return x.id !== v.id && x.category === v.category && x.status !== "scartato"; });
    var qs = quotes.filter(function (q) { return q.vendor_id === v.id; });
    var per = qs.reduce(function (a, q) { return a + (q.per_person ? num(q.amount) : 0); }, 0), fixed = qs.reduce(function (a, q) { return a + (q.per_person ? 0 : num(q.amount)); }, 0), tot = vendorTotal(w, qs);
    var items = await api.list("budget_items", w.id), b = items.filter(function (x) { return x.category === v.category; })[0];
    var patch = { description: v.name }, note;
    if (UNIT[v.category] && per > 0 && (!fixed || v.category === RENTAL)) {
      Object.assign(patch, { unit_price: per, contracted: 0 });
      if (v.category === RENTAL && fixed) patch.rental_amount = fixed;
      patch.planned = unitCost(Object.assign({ category: v.category, unit_child: b ? b.unit_child : 0, rental_amount: b ? b.rental_amount : null }, patch), state.hc[w.id] || headcount([]));
      note = "Nel budget, «" + v.category + "» passa a " + eur(per) + (UNIT[v.category] === "nucleo" ? " per nucleo" : " a persona") + (patch.rental_amount ? " più " + eur(fixed) + " di noleggio" : "") + ".";
    } else if (tot) {
      Object.assign(patch, { contracted: tot, unit_price: 0, unit_child: 0, rental_amount: null });
      note = "Nel budget, «" + v.category + "» prende l'importo di " + eur(tot) + ".";
    } else note = "Il fornitore non ha costi: nel budget cambia solo il dettaglio della voce.";
    var text = (others.length ? (others.length === 1 ? "L'altro fornitore" : "Gli altri " + others.length + " fornitori") + " di «" + v.category + "» " + (others.length === 1 ? "passa" : "passano") + " nell'Archivio fornitori. " : "") + note;
    if (!await confirmBox("Confermare " + v.name + "?", text, "Conferma fornitore", false)) return;
    await attempt(async function () {
      await api.update("vendors", v.id, { status: "confermato" });
      for (var i = 0; i < others.length; i++) await api.update("vendors", others[i].id, { status: "scartato" });
      if (b) await api.update("budget_items", b.id, patch);
      else await api.insert("budget_items", Object.assign({ wedding_id: w.id, category: v.category, paid: 0 }, patch));
    }, "Fornitore confermato: budget aggiornato.");
    render();
  }
  async function vendorsView(w, sub) {
    var res = await Promise.all([api.list("vendors", w.id), api.list("quotes", w.id), api.list("guests", w.id)]);
    var vendors = res[0], quotes = res[1], ro = !canEdit(w), archive = sub === "archivio";
    state.hc[w.id] = headcount(res[2]);
    var people = payingPeople(w), cats = vendorCats(w);
    var qsOf = function (v) { return quotes.filter(function (q) { return q.vendor_id === v.id; }); };
    var totalOf = function (v) { return vendorTotal(w, qsOf(v)); };
    var active = vendors.filter(function (v) { return v.status !== "scartato"; }), archived = vendors.filter(function (v) { return v.status === "scartato"; });
    var order = function (list) {
      var seen = {}; list.forEach(function (v) { seen[v.category] = 1; });
      return Object.keys(seen).sort(function (a, b) { var i = cats.indexOf(a), j = cats.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b); });
    };
    // Il prezzo migliore: il totale più basso tra almeno due fornitori con un costo, nella stessa categoria
    var best = {};
    order(active).forEach(function (c) {
      var priced = active.filter(function (v) { return v.category === c && totalOf(v) > 0; });
      if (priced.length > 1) best[c] = priced.reduce(function (a, v) { return totalOf(v) < totalOf(a) ? v : a; }).id;
    });
    var addCat = btn("Aggiungi categoria", function () {
      editDialog("Nuova categoria di fornitori", [{ name: "name", label: "Nome della categoria", required: true, max: 60, wide: true, placeholder: "Es. Pasticceria", help: "Comparirà tra le categorie quando aggiungete un fornitore." }], null, "Aggiungi", async function (d) {
        var name = d.name.replace(/\s+/g, " ");
        if (cats.some(function (c) { return c.toLowerCase() === name.toLowerCase(); })) throw new Error("La categoria «" + name + "» esiste già");
        var list = (w.vendor_categories || []).concat([name]);
        await api.updateWedding(w.id, { vendor_categories: list });
        w.vendor_categories = list;
      }, "Categoria aggiunta.");
    }, "ghost", "plus");
    var R = rights(w), TXT_C = "Fornitori illimitati, più preventivi per fornitore affiancati e il programma del giorno.";
    var addVendor = function () { return btn("Aggiungi fornitore", function () {
      if (R.vendors != null && vendors.length >= R.vendors) return unlock(w, "fornitori", "Il vostro piano arriva a " + R.vendors + " fornitori", TXT_C);
      vendorDialog(w, null, cats); }, "primary", "plus"); };

    function quoteItem(v, q) {
      return h("li", { class: "quote-item" },
        h("div", null, h("b", null, q.label), h("small", null, [q.per_person ? eur(q.amount) + " a persona × " + people : null, q.includes,
          q.expires_on ? (daysTo(q.expires_on) < 0 ? "scaduto il " : "valido fino al ") + fmtDate(q.expires_on) : null].filter(Boolean).join(" · "))),
        h("b", { class: "n" }, eur(q.per_person ? num(q.amount) * people : q.amount)),
        ro || archive ? null : h("span", { class: "row-actions" },
          mini("Modifica", function () { editDialog("Modifica preventivo", F.quotes, q, "Salva", function (d) { return api.update("quotes", q.id, d); }, "Salvato."); }),
          mini("Elimina", async function () { if (!await confirmBox("Eliminare il preventivo?", "«" + q.label + "» verrà eliminato.", "Elimina")) return; await attempt(function () { return api.remove("quotes", q.id); }, "Eliminato."); render(); }, "danger")));
    }
    function card(v) {
      var qs = qsOf(v), isBest = best[v.category] === v.id, conf = v.status === "confermato";
      var setStatus = function (st, msg) { return async function () { await attempt(function () { return api.update("vendors", v.id, { status: st }); }, msg); render(); }; };
      var statusSel = h("label", { class: "status-pill" }, h("span", { class: "sr" }, "Stato di " + v.name),
        h("select", { onchange: function (e) { setStatus(e.target.value, "Stato aggiornato.")(); } },
          [["da_scegliere", LABEL.vendor.da_scegliere], ["in_trattativa", LABEL.vendor.in_trattativa]].map(function (o) { return h("option", { value: o[0], selected: v.status === o[0] }, o[1]); })));
      return h("article", { class: "panel vendor" + (isBest ? " best" : "") + (conf ? " confirmed" : "") },
        h("header", { class: "vendor-head" }, h("div", null, h("p", { class: "small" }, v.category), h("h3", { class: "serif" }, v.name), v.contact ? h("p", null, v.contact) : null),
          h("div", { class: "vendor-side" }, conf ? badge("Confermato", "ok") : null, isBest ? badge("Prezzo migliore", "best") : null,
            conf || archive ? null : ro ? badge(LABEL.vendor[v.status], "plain") : statusSel)),
        v.notes ? h("div", { class: "vendor-notes" }, h("p", { class: "lbl" }, "Servizi offerti e note"), h("p", null, v.notes)) : null,
        h("div", { class: "vendor-cost" }, h("p", { class: "lbl" }, "Costo del servizio"),
          qs.length ? h("ul", { class: "quote-list" }, qs.map(function (q) { return quoteItem(v, q); })) : h("p", { class: "muted small" }, "Nessun costo inserito."),
          h("p", { class: "vendor-total" }, h("span", null, qs.length > 1 ? "Totale dei " + qs.length + " preventivi" : "Totale"), h("b", null, eur(totalOf(v)))),
          ro || archive ? null : h("button", { class: "add-row", type: "button", onclick: function () {
            if (R.quotes != null && qs.length >= R.quotes) return unlock(w, "preventivi", "Più preventivi affiancati", TXT_C);
            editDialog("Nuovo preventivo per " + v.name, F.quotes, null, "Aggiungi", function (d) { d.wedding_id = w.id; d.vendor_id = v.id; return api.insert("quotes", d); }, "Preventivo aggiunto.");
          } }, "+ Aggiungi un preventivo")),
        ro ? null : h("footer", { class: "vendor-foot" },
          archive ? mini("Riporta tra i fornitori", setStatus("da_scegliere", "Fornitore riportato tra i fornitori."), "strong")
            : conf ? mini("Annulla la conferma", setStatus("in_trattativa", "Conferma annullata."))
            : mini("Conferma fornitore", function () { confirmVendor(w, v, vendors, quotes); }, "strong"),
          h("span", { class: "row-actions" },
            mini("Modifica", function () { vendorDialog(w, v, cats); }),
            mini("Elimina", async function () { if (!await confirmBox("Eliminare il fornitore?", "Verranno eliminati anche i suoi preventivi.", "Elimina")) return; await attempt(function () { return api.remove("vendors", v.id); }, "Eliminato."); render(); }, "danger"))));
    }
    var groups = function (list) {
      return order(list).map(function (c) {
        var vs = list.filter(function (v) { return v.category === c; });
        return h("section", { class: "vendor-group", "aria-label": c }, h("h2", { class: "serif" }, c, " ", count(vs.length)), h("div", { class: "vendor-grid" }, vs.map(card)));
      });
    };
    // Il confronto: per ogni categoria una barra per fornitore, lunga quanto il suo totale
    var chart = order(active).map(function (c) {
      var vs = active.filter(function (v) { return v.category === c; }).sort(function (a, b) { return totalOf(a) - totalOf(b); });
      var totals = vs.map(totalOf), max = Math.max.apply(null, totals.concat([1])), priced = totals.filter(function (x) { return x > 0; });
      var conf = vs.filter(function (v) { return v.status === "confermato"; })[0];
      return h("div", { class: "cmp-block" }, h("header", null, h("h3", null, c),
          conf ? badge("Confermato", "ok") : priced.length > 1 ? h("small", null, "Differenza " + eur(Math.max.apply(null, priced) - Math.min.apply(null, priced))) : null),
        h("ul", { class: "cmp-bars" }, vs.map(function (v, i) {
          var isBest = best[c] === v.id;
          return h("li", { class: (isBest ? "best" : "") + (v.status === "confermato" ? " conf" : "") }, h("span", { class: "cmp-name" }, v.name, isBest ? h("small", null, "Prezzo migliore") : null),
            h("span", { class: "cmp-track", "aria-hidden": "true" }, h("i", { style: "width:" + (totals[i] / max * 100).toFixed(1) + "%" })),
            h("b", { class: "cmp-v" }, totals[i] ? eur(totals[i]) : "—"));
        })));
    });
    var head = pageHead("Fornitori e preventivi", "Le schede dei fornitori a confronto, categoria per categoria." + (people ? " I prezzi a persona sono calcolati su " + plural(people, "persona", "persone") + (state.hc[w.id] && state.hc[w.id].adulti + state.hc[w.id].bambini ? " che vengono (sotto i 3 anni esclusi)." : " previste.") : ""), ro ? null : [addCat, addVendor()]);
    var tabs = subTabs("m/" + w.id + "/fornitori", [["", "Fornitori · " + active.length], ["archivio", "Archivio fornitori · " + archived.length]], archive ? "archivio" : "");
    if (archive) return [head, tabs, archived.length ? groups(archived) : empty("L'archivio è vuoto", "Quando confermate un fornitore, gli altri della stessa categoria passano qui.", null, "briefcase")];
    return [head, tabs, active.length ? [panel("Confronto per categoria", "Il totale di ogni fornitore, preventivi sommati. In verde il prezzo più basso della categoria.", null, h("div", { class: "cmp" }, chart)), groups(active)]
      : empty("Ancora nessun fornitore", ro ? "La planner non ha ancora inserito fornitori." : "Aggiungete i fornitori che state valutando, con il costo del servizio: qui li vedrete a confronto.", ro ? null : addVendor(), "briefcase")];
  }

  /* ------------------------------------------------------------ invitati e tavoli (una pagina) */
  function csvCell(c) {
    // Una cella che inizia con = + - @ verrebbe letta come formula da Excel: l'apostrofo la lascia testo.
    c = c == null ? "" : String(c);
    if (/^[=+\-@\t\r]/.test(c)) c = "'" + c;
    return /[";\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
  }
  function download(name, rows) {
    var text = "﻿" + rows.map(function (r) { return r.map(csvCell).join(";"); }).join("\n");
    var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.append(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  var HALL_W = 1600, HALL_H = 1050;
  function shortName(x) { var p = x.name.trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1].charAt(0) + "." : p[0]; }
  function tableGeometry(t) {
    // posti e didascalie attorno al tavolo, in pixel rispetto al centro
    var n = t.seats, seats = [];
    // tavolo degli sposi: i posti su un solo lato, rivolti verso la sala
    if (t.kind === "sposi") {
      var Ws = Math.max(150, 40 + n * 44), Hs = 64;
      for (var q = 0; q < n; q++) seats.push({ x: -Ws / 2 + 20 + 22 + q * ((Ws - 40) / n), y: -Hs / 2 - 22, lx: 0, ly: -26, align: "top" });
      return { w: Ws, h: Hs, seats: seats };
    }
    // imperiale: un unico tavolo lungo, posti fitti e senza nomi (si leggono in «Tavolo per tavolo»)
    if (t.shape === "imperiale") {
      var side = Math.ceil(n / 2), gap = 26, Wi = 24 + side * gap, Hi = 70;
      for (var m = 0; m < n; m++) {
        var top2 = m < side, k2 = top2 ? m : m - side;
        seats.push({ x: -Wi / 2 + 12 + gap / 2 + k2 * gap, y: top2 ? -Hi / 2 - 16 : Hi / 2 + 16 });
      }
      return { w: Wi, h: Hi, seats: seats, small: true };
    }
    if (t.shape === "rettangolare") {
      var top = Math.ceil(n / 2), bottom = n - top, W = 40 + top * 44, H = 74;
      for (var i = 0; i < top; i++) seats.push({ x: -W / 2 + 42 + i * 44, y: -H / 2 - 22, lx: 0, ly: -26, align: "top" });
      for (var j = 0; j < bottom; j++) seats.push({ x: -W / 2 + 42 + j * 44, y: H / 2 + 22, lx: 0, ly: 26, align: "bottom" });
      return { w: W, h: H, seats: seats };
    }
    var D = 112 + (n - 8) * 10, R = D / 2 + 24;
    for (var k = 0; k < n; k++) {
      var a = (k / n) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      seats.push({ x: Math.round(c * R), y: Math.round(s * R), lx: Math.round(c * 26), ly: Math.round(s * 26), align: c > 0.35 ? "right" : c < -0.35 ? "left" : s < 0 ? "top" : "bottom" });
    }
    return { w: D, h: D, seats: seats };
  }
  function freeSpot(tables) {
    for (var i = 0; i < 40; i++) {
      var x = 14 + (i % 4) * 24, y = 16 + Math.floor(i / 4) * 30;
      if (y > 92) break;
      if (!tables.some(function (t) { return Math.abs(t.pos_x - x) < 12 && Math.abs(t.pos_y - y) < 14; })) return [x, y];
    }
    return [50, 50];
  }
  async function seatDialog(w, t, n, guests, tables) {
    var cur = guests.filter(function (x) { return x.table_id === t.id && x.seat_number === n; })[0];
    var tname = function (id) { var x = tables.filter(function (y) { return y.id === id; })[0]; return x ? x.name : ""; };
    var free = guests.filter(function (x) { return !x.table_id && x.rsvp !== "no"; });
    var elsewhere = guests.filter(function (x) { return x.table_id && !(x.table_id === t.id && x.seat_number === n); });
    var sel = h("select", { id: "f-guest", name: "guest" },
      h("option", { value: "" }, "Posto libero"),
      cur ? h("option", { value: cur.id, selected: true }, cur.name + " (ora qui)") : null,
      GROUPS.map(function (k) {
        var rows = free.filter(function (x) { return x.guest_group === k; });
        return rows.length ? h("optgroup", { label: groupLabel(w, k) + " · da sistemare" }, rows.map(function (x) { return h("option", { value: x.id }, x.name + (x.rsvp === "in_attesa" ? " (in attesa)" : "")); })) : null;
      }),
      elsewhere.length ? h("optgroup", { label: "Sposta da un altro posto" }, elsewhere.map(function (x) { return h("option", { value: x.id }, x.name + " · " + tname(x.table_id) + ", posto " + x.seat_number); })) : null);
    var r = await dialog(t.name + " · posto " + n, h("div", { class: "dlg-body" }, h("div", { class: "fld" }, h("label", { for: "f-guest" }, "Chi siede qui"), sel,
      h("small", null, "Chi ha risposto che non viene non compare. Il vecchio posto di chi sposti si libera solo dopo il salvataggio della nuova assegnazione."))), [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, "Salva")],
      async function (form) {
        var chosen = form.elements.guest.value;
        if (cur && chosen === cur.id) return;
        if (cur) await api.update("guests", cur.id, { table_id: null, seat_number: null });
        if (chosen) await api.update("guests", chosen, { table_id: t.id, seat_number: n });
      });
    if (r.value === "ok") { toast("Posto aggiornato."); render(); }
  }
  async function placeGuestDialog(w, x, tables, guests) {
    var options = [];
    tables.forEach(function (t) {
      var used = guests.filter(function (g) { return g.table_id === t.id; }).length;
      for (var n = 1; n <= t.seats; n++) if (!guests.some(function (g) { return g.table_id === t.id && g.seat_number === n; })) options.push([t.id + "|" + n, t.name + " · posto " + n + " (" + used + "/" + t.seats + ")"]);
    });
    if (!options.length) { await confirmBox("Non ci sono posti liberi", "Tutti i tavoli sono al completo: aggiungete un tavolo o liberate un posto. Nessuna assegnazione è stata fatta.", "Ho capito", false); return; }
    var r = await dialog("Dove siede " + x.name + "?", h("div", { class: "dlg-body" }, h("div", { class: "fld" }, h("label", { for: "f-seat" }, "Posto libero"),
      h("select", { id: "f-seat", name: "seat" }, options.map(function (o) { return h("option", { value: o[0] }, o[1]); })),
      h("small", null, "Compaiono solo i posti liberi: nessun posto viene prenotato due volte."))), [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, "Assegna")],
      async function (form) { var v = form.elements.seat.value.split("|"); await api.update("guests", x.id, { table_id: v[0], seat_number: Number(v[1]) }); });
    if (r.value === "ok") { toast("Posto assegnato."); render(); }
  }
  var TABLE_TYPES = [["rotondo", "Rotondo"], ["rettangolare", "Rettangolare"], ["imperiale", "Imperiale · un unico tavolo lungo"], ["sposi", "Tavolo degli sposi"]];
  var SEATS = { rotondo: [6, 8, 10, 12], rettangolare: [6, 8, 10, 12], imperiale: [40, 60, 100], sposi: [2, 4, 6, 8] };
  var tableType = function (t) { return t.kind === "sposi" ? "sposi" : t.shape; };
  // save(dati) salva davvero; restituisce i dati salvati oppure null se si annulla
  async function tableDialog(t, save) {
    var body = h("div", { class: "dlg-body grid-form" },
      field({ name: "name", label: "Nome del tavolo", required: true, max: 60, placeholder: "Es. Capri", wide: true }, t ? t.name : ""),
      field({ name: "type", label: "Tipo di tavolo", type: "select", options: TABLE_TYPES }, t ? tableType(t) : "rotondo"),
      h("div", { class: "fld" }, h("label", { for: "f-seats" }, "Posti"), h("select", { id: "f-seats", name: "seats" })),
      field({ name: "custom", label: "Numero di posti", type: "number", step: "1", noOpt: true, required: true }, t ? t.seats : ""));
    var typeSel = body.querySelector('[name="type"]'), seatSel = body.querySelector('[name="seats"]'), custom = body.querySelector('[name="custom"]'), wrap = custom.closest(".fld");
    var max = function () { return typeSel.value === "imperiale" ? 120 : 30; };
    var want = t ? t.seats : null;
    function fill() {
      var list = SEATS[typeSel.value], pick = list.indexOf(want) >= 0 ? want : want ? "altro" : list[Math.floor(list.length / 2)];
      seatSel.replaceChildren.apply(seatSel, list.map(function (n) { return h("option", { value: n, selected: n === pick }, n + " posti"); }).concat([h("option", { value: "altro", selected: pick === "altro" }, "Altro numero…")]));
      want = null; sync();
    }
    function sync() { var on = seatSel.value === "altro"; wrap.hidden = !on; custom.disabled = !on; wrap.querySelector("small") || wrap.append(h("small")); wrap.querySelector("small").textContent = "Da 1 a " + max() + " posti."; }
    typeSel.addEventListener("change", fill); seatSel.addEventListener("change", sync);
    var data = null;
    var p = dialog(t ? "Modifica " + t.name : "Nuovo tavolo", body, [
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, t ? "Salva" : "Aggiungi")
    ], async function (form) {
      var ty = typeSel.value, n = seatSel.value === "altro" ? Math.round(num(custom.value)) : Number(seatSel.value);
      if (!(n >= 1 && n <= max())) throw new Error("I posti di questo tavolo vanno da 1 a " + max());
      data = { name: form.elements.name.value.trim(), seats: n, shape: ty === "sposi" ? "rettangolare" : ty, kind: ty === "sposi" ? "sposi" : "ospiti" };
      await save(data);
    });
    fill();
    var r = await p;
    return r.value === "ok" ? data : null;
  }
  function wireAllergies(body) {
    var note = body.querySelector('[name="allergies_note"]'), wrap = note.closest(".fld");
    var sync = function () { var on = !!body.querySelector('input[name="allergies"][value="altro"]:checked'); wrap.hidden = !on; note.disabled = !on; };
    body.addEventListener("change", sync); sync();
  }
  // Nuovo invitato: un gruppo di persone, ognuna con il suo nome. Modifica: una persona.
  async function guestDialog(w, x) {
    var fields = guestFields(w), adding = !x;
    var vals = x || { guest_group: store.get("nio-group") || "amici_comuni", rsvp: "in_attesa", menu: "standard", age_band: "adulto", allergies: [] };
    var els = fields.map(function (f) { return field(f, vals[f.name]); });
    var people = h("div", { class: "people-list" }), peopleBox = h("div", { class: "people wide", hidden: true }, h("p", { class: "lbl" }, "Le altre persone del gruppo"), people);
    if (adding) els.splice(2, 0, field({ name: "count", label: "Quante persone", type: "number", step: "1", noOpt: true, placeholder: "1",
      help: "Per una famiglia o una coppia: scrivete quante sono, poi il nome di ciascuno. Menù e allergie valgono per tutto il gruppo; si cambiano poi persona per persona." }, 1), peopleBox);
    var body = h("div", { class: "dlg-body grid-form" }, els);
    var countIn = body.querySelector('[name="count"]');
    function person(i) {
      return h("div", { class: "person" }, h("div", { class: "fld" }, h("label", { for: "p-n" + i }, "Persona " + i + " · nome e cognome"), h("input", { id: "p-n" + i, name: "p_name", required: true, maxlength: 120, autocomplete: "off" })),
        h("div", { class: "fld" }, h("label", { for: "p-a" + i }, "Età"), h("select", { id: "p-a" + i, name: "p_age" }, opts(LABEL.age).map(function (o) { return h("option", { value: o[0] }, o[1]); }))));
    }
    function syncPeople() {
      var n = Math.min(30, Math.max(1, Math.round(num(countIn.value)) || 1));
      while (people.children.length < n - 1) people.append(person(people.children.length + 2));
      while (people.children.length > n - 1) people.lastChild.remove();
      peopleBox.hidden = n < 2;
    }
    var actions = [adding ? h("button", { class: "btn tert", value: "import", formnovalidate: true }, icon("file"), "Importa da Excel") : null,
      h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, adding ? "Aggiungi" : "Salva")];
    var p = dialog(adding ? "Nuovo invitato" : "Modifica invitato", body, actions, async function (form) {
      var d = readForm(form, fields);
      if (!adding) return api.update("guests", x.id, d);
      var n = Math.round(num(countIn.value)) || 1;
      if (n > 30) throw new Error("Al massimo 30 persone alla volta.");
      d.wedding_id = w.id;
      if (n > 1 && !d.household) d.household = d.name;
      var names = form.querySelectorAll('[name="p_name"]'), ages = form.querySelectorAll('[name="p_age"]'), rows = [d];
      for (var i = 0; i < n - 1; i++) rows.push(Object.assign({}, d, { name: names[i].value.trim(), age_band: ages[i].value }));
      return api.insert("guests", rows.length > 1 ? rows : d);
    });
    wireAllergies(body);
    if (adding) { countIn.addEventListener("input", syncPeople); syncPeople(); }
    var r = await p;
    if (r.value === "import") go("m/" + w.id + "/invitati/importa");
    else if (r.value === "ok") { toast(adding ? "Invitati aggiunti." : "Salvato."); render(); }
  }


  /* ---- trascinamento degli invitati: mouse, penna e dito (sul telefono si tiene premuto un attimo) ---- */
  // source: l'elemento da trascinare; label: testo della "etichetta" che segue il puntatore; onDrop(target) riceve l'elemento [data-drop] sotto il puntatore
  function dragGuest(source, label, onDrop, onTap) {
    var st = null;
    function find(x, y) { var el = document.elementFromPoint(x, y); return el && el.closest("[data-drop]"); }
    function begin(e) {
      st.on = true; st.ghost = h("div", { class: "drag-ghost" }, label); document.body.append(st.ghost); document.body.classList.add("dragging"); source.classList.add("is-src");
      move(e);
    }
    function move(e) {
      st.ghost.style.transform = "translate(" + (e.clientX + 12) + "px," + (e.clientY + 12) + "px)";
      var t = find(e.clientX, e.clientY);
      if (t !== st.over) { if (st.over) st.over.classList.remove("drop-on"); st.over = t; if (t) t.classList.add("drop-on"); }
    }
    function end() {
      if (st && st.on) { st.ghost.remove(); document.body.classList.remove("dragging"); source.classList.remove("is-src"); if (st.over) st.over.classList.remove("drop-on"); }
      clearTimeout(st && st.timer); window.removeEventListener("touchmove", block, { passive: false }); st = null;
    }
    function block(e) { if (st && st.on) e.preventDefault(); }
    source.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      st = { x: e.clientX, y: e.clientY, on: false, over: null, touch: e.pointerType === "touch" };
      if (st.touch) {
        window.addEventListener("touchmove", block, { passive: false });
        var ev = { clientX: e.clientX, clientY: e.clientY };
        st.timer = setTimeout(function () { if (st && !st.on) { if (navigator.vibrate) navigator.vibrate(15); begin(ev); } }, 280);
      }
      try { source.setPointerCapture(e.pointerId); } catch (err) {}
    });
    source.addEventListener("pointermove", function (e) {
      if (!st) return;
      if (!st.on) {
        var far = Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 6;
        if (st.touch) { if (far) end(); return; } // sul telefono un movimento prima del tempo è uno scorrimento
        if (far) begin(e); else return;
      }
      move(e);
    });
    source.addEventListener("pointerup", function (e) {
      if (!st) return;
      var was = st.on, over = st.over; end();
      if (was) { if (over) onDrop(over); } else if (onTap) onTap();
    });
    source.addEventListener("pointercancel", end);
    source.addEventListener("click", function (e) { e.preventDefault(); }); // il tocco lo gestisce pointerup
    source.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && onTap) { e.preventDefault(); onTap(); } });
  }
  // Nuclei: chi condivide il campo «Nucleo familiare» viaggia insieme (una partecipazione per nucleo)
  function householdsOf(list) {
    var out = [], by = {};
    list.forEach(function (x) {
      var k = (x.household || "").trim().toLowerCase();
      if (!k) { out.push({ key: "#" + x.id, name: x.name, people: [x] }); return; }
      if (!by[k]) { by[k] = { key: k, name: x.household.trim(), people: [] }; out.push(by[k]); }
      by[k].people.push(x);
    });
    return out;
  }

  async function guestsView(w, sub) {
    if (sub === "importa") return importView(w);
    var res = await Promise.all([api.list("guests", w.id), api.list("seating_tables", w.id)]);
    var guests = res[0], tables = res[1], tab = sub === "elenco" || sub === "tavoli" ? sub : "";
    state.hc[w.id] = headcount(guests);
    var byId = {}; tables.forEach(function (t) { byId[t.id] = t; });
    var invited = guests.filter(function (x) { return !x.couple_side; }); // gli sposi sono in lista ma non sono invitati
    var g = guestCounts(invited), menus = {}, allergies = {};
    guests.forEach(function (x) {
      if (x.rsvp === "no") return;
      menus[x.menu] = (menus[x.menu] || 0) + 1;
      (x.allergies || []).forEach(function (a) { allergies[a] = (allergies[a] || 0) + 1; });
    });
    var coming = guests.filter(function (x) { return x.rsvp !== "no"; }), waiting = coming.filter(function (x) { return !x.table_id; }), seated = guests.filter(function (x) { return x.table_id; });
    var seatsTotal = tables.reduce(function (a, t) { return a + t.seats; }, 0);
    var at = function (t, n) { return guests.filter(function (x) { return x.table_id === t.id && x.seat_number === n; })[0]; };
    var byGid = {}; guests.forEach(function (x) { byGid[x.id] = x; });
    // Posa uno o più invitati: su un posto (dal posto scelto in avanti) o su un tavolo (primi posti liberi)
    async function seatPeople(ids, t, startSeat) {
      var people = ids.map(function (id) { return byGid[id]; }).filter(Boolean);
      if (!canEdit(w) || !people.length) return;
      // un solo invitato sopra un posto occupato: scambio (o l'altro torna da sistemare)
      if (people.length === 1 && startSeat) {
        var x = people[0], occ = at(t, startSeat);
        if (occ && occ.id === x.id) return;
        await attempt(async function () {
          var from = x.table_id ? { table_id: x.table_id, seat_number: x.seat_number } : null;
          if (occ) await api.update("guests", occ.id, { table_id: null, seat_number: null });
          await api.update("guests", x.id, { table_id: t.id, seat_number: startSeat });
          if (occ && from) await api.update("guests", occ.id, from);
        }, occ ? (x.table_id ? x.name + " e " + occ.name + " si sono scambiati il posto." : occ.name + " torna tra gli invitati da sistemare.") : x.name + " siede a " + t.name + ".");
        render(); return;
      }
      var free = [];
      for (var n = 1; n <= t.seats; n++) {
        var o = at(t, n);
        if (!o || ids.indexOf(o.id) >= 0) free.push(n);
      }
      if (startSeat) free = free.filter(function (n) { return n >= startSeat; }).concat(free.filter(function (n) { return n < startSeat; }));
      if (free.length < people.length) { toast("A " + t.name + " restano " + plural(free.length, "posto libero", "posti liberi") + ": il nucleo è di " + people.length + " persone.", true); return; }
      await attempt(async function () {
        for (var i = 0; i < people.length; i++) if (people[i].table_id) await api.update("guests", people[i].id, { table_id: null, seat_number: null });
        for (var j = 0; j < people.length; j++) await api.update("guests", people[j].id, { table_id: t.id, seat_number: free[j] });
      }, people.length > 1 ? plural(people.length, "persona", "persone") + " a " + t.name + "." : people[0].name + " siede a " + t.name + ".");
      render();
    }
    async function unseat(ids) {
      var people = ids.map(function (id) { return byGid[id]; }).filter(function (x) { return x && x.table_id; });
      if (!people.length) return;
      await attempt(async function () { for (var i = 0; i < people.length; i++) await api.update("guests", people[i].id, { table_id: null, seat_number: null }); },
        people.length > 1 ? "Il nucleo torna tra gli invitati da sistemare." : people[0].name + " torna tra gli invitati da sistemare.");
      render();
    }
    var tById = {}; tables.forEach(function (t) { tById[t.id] = t; });
    function dropTo(ids) {
      return function (target) {
        var d = target.dataset;
        if (d.drop === "lista") return unseat(ids);
        var t = tById[d.table]; if (!t) return;
        seatPeople(ids, t, d.drop === "posto" ? Number(d.seat) : null);
      };
    }
    var R = rights(w), TXT_T = "Invitati illimitati, tavoli e sala in pianta senza limiti, stampa ed esportazione del tableau e il PDF per catering e location.";
    var guestsFull = R.guests != null && invited.length >= R.guests, tablesFull = R.tables != null && tables.filter(function (t) { return t.kind !== "sposi"; }).length >= R.tables;
    var addGuest = function () { return btn("Aggiungi invitato", function () {
      if (guestsFull) return unlock(w, "invitati", "Avete più di " + R.guests + " invitati", "Sbloccate il tableau completo a 19 €: " + TXT_T.charAt(0).toLowerCase() + TXT_T.slice(1));
      guestDialog(w, null); }, "primary", "plus"); };
    var newTable = function () {
      if (tablesFull) return unlock(w, "tavoli", "L'anteprima arriva a " + R.tables + " tavoli", TXT_T);
      tableDialog(null, function (d) { var pos = freeSpot(tables); d.pos_x = pos[0]; d.pos_y = pos[1]; d.wedding_id = w.id; return api.insert("seating_tables", d); }).then(function (d) { if (d) { toast("Tavolo aggiunto alla sala."); render(); } });
    };
    var addTable = btn("Aggiungi tavolo", newTable, "soft", "table");
    function csv() {
      if (!R.print) return unlock(w, "esporta", "Esportare il tableau", TXT_T);
      var rows = [["Nome", "Età", "Gruppo", "Nucleo", "Risposta", "Menù", "Intolleranze e allergie", "Tavolo", "Posto", "Note"]].concat(guests.map(function (x) { return [x.name, LABEL.age[x.age_band] || "", groupLabel(w, x.guest_group), x.household, LABEL.rsvp[x.rsvp], LABEL.menu[x.menu] || x.menu, allergyText(x), byId[x.table_id] ? byId[x.table_id].name : "", x.seat_number || "", x.notes]; }));
      download("invitati-" + w.title.replace(/\W+/g, "-").toLowerCase() + ".csv", rows);
    }
    async function printMenu() {
      if (!R.print) return unlock(w, "stampa", "Stampare il tableau", TXT_T);
      var r = await dialog("Stampa ed esporta", h("div", { class: "dlg-body" }, h("p", { class: "dlg-text" }, "Scegliete cosa preparare. Dalla finestra di stampa potete anche salvarlo come PDF.")), [
        h("button", { class: "btn soft", value: "csv" }, "File CSV (Excel)"),
        h("button", { class: "btn soft", value: "cat", disabled: !tables.length }, "Scheda per catering e location"),
        h("button", { class: "btn primary", value: "tab", disabled: !seated.length }, "Tableau per gli ospiti")]);
      if (r.value === "csv") csv(); else if (r.value === "cat") printCatering(w, guests, tables); else if (r.value === "tab") printTableau(w, guests, tables);
    }
    var pct = invited.length ? (g.si / invited.length * 100).toFixed(1).replace(".", ",") + "% del totale" : null;
    var stats = kpis([
      kpi("Totale invitati", String(invited.length), (w.guests_expected ? "obiettivo " + w.guests_expected + " · è una stima" : "persone registrate") + (guests.length > invited.length ? " · più gli sposi" : "")),
      kpi("Vengono", String(g.si), pct, "", "olive"), kpi("In attesa", String(g.in_attesa), "risposta pendente"), kpi("Non vengono", String(g.no), "declinato", "", "terra"),
      kpi("Ai tavoli", seated.length + " su " + coming.length, "chi viene o non ha ancora risposto", "solid"),
      kpi("Posti liberi", String(seatsTotal - seated.length), "su " + seatsTotal + " totali" + (waiting.length > seatsTotal - seated.length ? " · ne mancano " + (waiting.length - (seatsTotal - seated.length)) : ""))], "six");
    // per il catering: menù e allergie di chi viene o non ha ancora risposto
    var hcAll = headcount(guests);
    var invLine = guests.length ? h("p", { class: "small" }, h("b", null, plural(hcAll.nucleiTutti, "partecipazione", "partecipazioni") + " da preparare"), " · una per nucleo familiare, " + plural(invited.length, "persona invitata", "persone invitate") + ". Chi non ha un nucleo conta come partecipazione a sé.") : null;
    var menuLine = Object.keys(menus).length ? h("p", { class: "muted small" }, "Menù di chi viene o è in attesa: " + Object.keys(menus).map(function (k) { return (LABEL.menu[k] || k).toLowerCase() + " " + menus[k]; }).join(" · ") + "." +
      (Object.keys(allergies).length ? " Allergie: " + Object.keys(allergies).map(function (k) { return allergyLabel(k).toLowerCase() + " " + allergies[k]; }).join(" · ") + "." : "")) : null;
    var tabs = subTabs("m/" + w.id + "/invitati", [["", "La sala"], ["elenco", "Elenco invitati · " + invited.length], ["tavoli", "Tavolo per tavolo · " + tables.length]], tab);

    /* ---- la sala: si trascinano i tavoli, si tocca un posto per assegnarlo (struttura invariata) ---- */
    var legend = h("p", { class: "legend-line" }, GROUPS.map(function (k) { return h("span", { class: "leg" }, h("span", { class: "swatch gt-" + k, "aria-hidden": "true" }), groupLabel(w, k)); }),
      h("span", { class: "leg" }, h("span", { class: "swatch free", "aria-hidden": "true" }), "Posto libero"));
    var zoom = Number(store.get("nio-zoom")) || 0;
    var wrap = h("div", { class: "hall-wrap", role: "region", "aria-label": "Pianta della sala" });
    var hall = h("div", { class: "hall", style: "width:" + HALL_W + "px;height:" + HALL_H + "px" });
    tables.forEach(function (t) {
      var geo = tableGeometry(t), filled = guests.filter(function (x) { return x.table_id === t.id; }).length;
      var el = h("div", { class: "table-el" + (t.kind === "sposi" ? " sposi" : ""), "data-drop": "tavolo", "data-table": t.id, style: "left:" + (t.pos_x / 100 * HALL_W) + "px;top:" + (t.pos_y / 100 * HALL_H) + "px" });
      var core = h("button", { type: "button", class: "table-core " + (t.shape === "rotondo" ? "round" : "rect") + (t.kind === "sposi" ? " sposi" : "") + (filled >= t.seats ? " full" : ""), style: "width:" + geo.w + "px;height:" + geo.h + "px",
        "aria-label": t.name + ", " + filled + " su " + t.seats + " posti. Trascina per spostare, invio per modificare." },
        t.kind === "sposi" && !/sposi/i.test(t.name) ? h("small", null, "Sposi") : null, h("b", null, t.name), h("span", null, filled + "/" + t.seats));
      el.append(core);
      geo.seats.forEach(function (s, i) {
        var n = i + 1, x = at(t, n);
        var sb = h("button", { type: "button", class: "seat " + (x ? "gt-" + x.guest_group : "free") + (geo.small ? " sm" : ""), style: "left:" + s.x + "px;top:" + s.y + "px", title: x ? x.name + (canEdit(w) ? " · trascina per spostare" : "") : null,
          "data-drop": "posto", "data-table": t.id, "data-seat": String(n),
          "aria-label": "Posto " + n + ": " + (x ? x.name : "libero"), onclick: x && canEdit(w) ? null : function () { seatDialog(w, t, n, guests, tables); } }, String(n));
        if (x && canEdit(w)) dragGuest(sb, x.name, dropTo([x.id]), function () { seatDialog(w, t, n, guests, tables); });
        el.append(sb);
        if (x && !geo.small) el.append(h("span", { class: "seat-name a-" + s.align, style: "left:" + (s.x + s.lx) + "px;top:" + (s.y + s.ly) + "px" }, shortName(x)));
      });
      // trascinamento con mouse o dito; un tocco senza movimento apre la modifica del tavolo
      var start = null;
      core.addEventListener("pointerdown", function (e) { start = { x: e.clientX, y: e.clientY, left: t.pos_x / 100 * HALL_W, top: t.pos_y / 100 * HALL_H, moved: false, z: currentZoom() }; core.setPointerCapture(e.pointerId); });
      core.addEventListener("pointermove", function (e) {
        if (!start) return;
        var dx = (e.clientX - start.x) / start.z, dy = (e.clientY - start.y) / start.z;
        if (Math.abs(dx) + Math.abs(dy) > 4) start.moved = true;
        if (start.moved) { el.style.left = Math.max(0, Math.min(HALL_W, start.left + dx)) + "px"; el.style.top = Math.max(0, Math.min(HALL_H, start.top + dy)) + "px"; }
      });
      core.addEventListener("pointerup", async function () {
        if (!start) return;
        var s0 = start; start = null;
        if (!s0.moved) { editTable(t); return; }
        var px = Math.round(parseFloat(el.style.left) / HALL_W * 1000) / 10, py = Math.round(parseFloat(el.style.top) / HALL_H * 1000) / 10;
        t.pos_x = px; t.pos_y = py;
        await attempt(function () { return api.update("seating_tables", t.id, { pos_x: px, pos_y: py }); });
      });
      core.addEventListener("keydown", async function (e) {
        var step = e.shiftKey ? 5 : 1, k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
        if (!k) return;
        e.preventDefault();
        t.pos_x = Math.max(0, Math.min(100, t.pos_x + k[0])); t.pos_y = Math.max(0, Math.min(100, t.pos_y + k[1]));
        el.style.left = (t.pos_x / 100 * HALL_W) + "px"; el.style.top = (t.pos_y / 100 * HALL_H) + "px";
        clearTimeout(core._save); core._save = setTimeout(function () { attempt(function () { return api.update("seating_tables", t.id, { pos_x: t.pos_x, pos_y: t.pos_y }); }); }, 500);
      });
      hall.append(el);
    });
    if (!tables.length) hall.append(h("p", { class: "hall-empty" }, "La sala è vuota. Aggiungete il primo tavolo: lo potrete trascinare dove volete."));
    var sizer = h("div", { class: "hall-sizer" }, hall);
    wrap.append(sizer);
    function currentZoom() { return Number(wrap.dataset.z) || 1; }
    function applyZoom(z) {
      var fit = Math.max(0.2, Math.min(1, (wrap.clientWidth - 8) / HALL_W));
      var v = z || fit;
      wrap.dataset.z = v;
      hall.style.transform = "scale(" + v + ")";
      sizer.style.width = HALL_W * v + "px"; sizer.style.height = HALL_H * v + "px";
      zl.textContent = Math.round(v * 100) + "%";
    }
    var zl = h("span", { class: "zoom-level", "aria-live": "polite" });
    var zoomBar = h("div", { class: "zoom" },
      mini("−", function () { zoom = Math.max(0.2, (zoom || currentZoom()) - 0.15); store.set("nio-zoom", zoom); applyZoom(zoom); }), zl,
      mini("+", function () { zoom = Math.min(1.4, (zoom || currentZoom()) + 0.15); store.set("nio-zoom", zoom); applyZoom(zoom); }),
      mini("Adatta", function () { zoom = 0; store.set("nio-zoom", ""); applyZoom(0); }));
    requestAnimationFrame(function () { applyZoom(zoom); });
    window.onresize = function () { if (!zoom && document.body.contains(wrap)) applyZoom(0); };
    function editTable(t) { tableDialog(t, function (d) { return api.update("seating_tables", t.id, d); }).then(function (d) { if (d) { toast("Tavolo aggiornato."); render(); } }); }

    var chip = function (x) {
      var b = h("button", { type: "button", class: "guest-chip gt-b-" + x.guest_group }, x.name, x.rsvp === "in_attesa" ? h("span", { class: "q", "aria-label": "in attesa di risposta" }, "?") : null);
      if (canEdit(w)) dragGuest(b, x.name, dropTo([x.id]), function () { placeGuestDialog(w, x, tables, guests); });
      return b;
    };
    var openHH = state.openHH || (state.openHH = {});
    var waitingPanel = h("aside", { class: "panel waiting", "data-drop": "lista", "aria-labelledby": "ds-h" }, h("header", { class: "panel-head" }, h("div", null, h("h2", { id: "ds-h" }, "Da sistemare ", count(waiting.length, "bord")),
        h("p", { class: "sub" }, canEdit(w) ? "Trascinate un nome o un intero nucleo su un tavolo o su un posto. Riportate qui un ospite per togliergli il posto. Toccando un nome scegliete il posto da un elenco." : "Ospiti confermati o in attesa senza posto assegnato."))),
      waiting.length ? GROUPS.map(function (k) {
        var rows = waiting.filter(function (x) { return x.guest_group === k; });
        if (!rows.length) return null;
        var hh = householdsOf(rows);
        return h("div", { class: "wait-group" }, h("p", { class: "lbl" }, h("span", { class: "swatch gt-" + k, "aria-hidden": "true" }), groupLabel(w, k) + " · " + plural(rows.length, "persona", "persone") + " · " + plural(hh.length, "nucleo", "nuclei")),
          h("div", { class: "chips-btn" }, hh.map(function (f) {
            if (f.people.length === 1) return chip(f.people[0]);
            var key = w.id + f.key, det = h("details", { class: "hh", open: !!openHH[key] });
            det.addEventListener("toggle", function () { openHH[key] = det.open; });
            var handle = h("span", { class: "hh-drag", role: "button", tabindex: "0", title: canEdit(w) ? "Trascina tutto il nucleo" : null, "aria-label": "Trascina " + f.name + ", " + f.people.length + " persone" }, icon("users"));
            if (canEdit(w)) dragGuest(handle, f.name + " · " + f.people.length, dropTo(f.people.map(function (x) { return x.id; })), null);
            det.append(h("summary", null, handle, h("b", null, f.name), h("span", { class: "hh-n" }, String(f.people.length))), h("div", { class: "chips-btn" }, f.people.map(chip)));
            return det;
          })));
      }) : h("p", { class: "muted" }, guests.length ? "Tutti hanno un posto." : "Aggiungete gli invitati: chi viene comparirà qui finché non ha un posto."));

    var sala = h("section", { class: "sala", "aria-labelledby": "sala-h" },
      h("div", { class: "sala-main" }, h("div", { class: "sala-tools" }, h("h2", { id: "sala-h", class: "serif" }, "La sala"), btn("Aggiungi tavolo", newTable, tables.length ? "soft sm" : "primary", "plus"), tables.length ? zoomBar : null), legend,
        h("div", { class: "hall-frame" }, wrap,
          !R.print ? h("div", { class: "alert info" }, icon("lock"), h("div", null, h("p", null, h("b", null, "Anteprima del tableau"), " · fino a " + R.tables + " tavoli, senza stampa né esportazione. " + (guests.length > R.guests - 10 ? "Il piano Gratis arriva a " + R.guests + " invitati." : "")),
            canEdit(w) ? h("div", { class: "btn-row" }, unlockBtn(w, "tavoli", "Il tableau completo", TXT_T, "primary sm")) : null)) : null,
          h("p", { class: "hall-note" }, icon("info"), tables.length ? "Trascinate i tavoli per disporre la sala. Toccate un posto per scegliere chi ci siede: i posti di chi è in attesa sono provvisori finché non conferma." : "Disegnate la sala con «Aggiungi tavolo»: tavoli da 6 a 12 posti, imperiali da 40 a 100, oppure il tavolo degli sposi."))),
      waitingPanel);

    /* ---- elenco invitati: ricerca, filtri e pagine, raggruppato per gruppo ---- */
    var q = (store.get("nio-q") || "").toLowerCase(), gf = store.get("nio-group") || "", rf = store.get("nio-rsvp") || "";
    var shown = guests.filter(function (x) { return (!rf || x.rsvp === rf) && (!gf || x.guest_group === gf) && (!q || (x.name + " " + x.household).toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { return (a.couple_side ? 0 : 1) - (b.couple_side ? 0 : 1) || GROUPS.indexOf(a.guest_group) - GROUPS.indexOf(b.guest_group) || (a.household + a.name).localeCompare(b.household + b.name); });
    var pg = pager(shown.length, 15, "nio-gp", "invitati");
    var resetPage = function () { store.set("nio-gp", "1"); };
    var tools = h("div", { class: "tools" },
      h("label", { class: "search" }, icon("search"), h("span", { class: "sr" }, "Cerca"), h("input", { type: "search", placeholder: "Cerca per nome o nucleo…", value: store.get("nio-q") || "",
        oninput: function (e) { store.set("nio-q", e.target.value); resetPage(); clearTimeout(window.__nioQ); window.__nioQ = setTimeout(function () { render().then(function () { var i = document.querySelector(".tools input[type=search]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); } })),
      h("label", null, h("span", { class: "sr" }, "Gruppo"), h("select", { onchange: function (e) { store.set("nio-group", e.target.value); resetPage(); render(); } }, h("option", { value: "" }, "Tutti i gruppi"), GROUPS.map(function (k) { return h("option", { value: k, selected: gf === k }, groupLabel(w, k)); }))),
      h("label", null, h("span", { class: "sr" }, "Risposta"), h("select", { onchange: function (e) { store.set("nio-rsvp", e.target.value); resetPage(); render(); } }, h("option", { value: "" }, "Tutte le risposte"), opts(LABEL.rsvp).map(function (o) { return h("option", { value: o[0], selected: rf === o[0] }, o[1]); }))));
    var rows = [], lastGroup = null, lastHH = null, page = shown.slice(pg.from, pg.to), shutHH = state.shutHH || (state.shutHH = {});
    var hhSize = {}; guests.forEach(function (y) { var k = (y.household || "").trim().toLowerCase(); if (k) hhSize[y.guest_group + "|" + k] = (hhSize[y.guest_group + "|" + k] || 0) + 1; });
    page.forEach(function (x) {
      if (x.couple_side && lastGroup !== "__sposi") {
        lastGroup = "__sposi";
        rows.push(h("tr", { class: "group-row" }, h("th", { colspan: "6", scope: "rowgroup" }, h("span", { class: "dot bord", "aria-hidden": "true" }), "Gli sposi", count(guests.length - invited.length))));
      } else if (!x.couple_side && x.guest_group !== lastGroup) {
        lastGroup = x.guest_group; lastHH = null;
        rows.push(h("tr", { class: "group-row" }, h("th", { colspan: "6", scope: "rowgroup" }, h("span", { class: "dot gt-" + x.guest_group, "aria-hidden": "true" }), groupLabel(w, x.guest_group), count(invited.filter(function (y) { return y.guest_group === x.guest_group; }).length))));
      }
      var hk = (x.household || "").trim().toLowerCase(), hkey = w.id + x.guest_group + "|" + hk, size = hk ? hhSize[x.guest_group + "|" + hk] : 0;
      if (size > 1 && hk !== lastHH) {
        var shut = !!shutHH[hkey];
        rows.push(h("tr", { class: "hh-row" }, h("th", { colspan: "6", scope: "rowgroup" }, h("button", { type: "button", class: "hh-toggle", "aria-expanded": String(!shut), onclick: function () { shutHH[hkey] = !shut; render(); } },
          h("span", { class: "hh-caret", "aria-hidden": "true" }, shut ? "▸" : "▾"), h("b", null, x.household.trim()), h("span", { class: "muted" }, " · " + plural(size, "persona", "persone") + " · 1 partecipazione")))));
      }
      lastHH = hk || null;
      if (size > 1 && shutHH[hkey]) return;
      var t = byId[x.table_id];
      var sub2 = [x.age_band !== "adulto" ? (LABEL.age[x.age_band] || "").toLowerCase() : null, x.notes].filter(Boolean).join(" · "), al = allergyText(x);
      rows.push(h("tr", null, h("th", { scope: "row" }, h("b", null, x.name), sub2 ? h("small", null, sub2) : null), h("td", null, x.household || "—"),
        h("td", null, (LABEL.menu[x.menu] || x.menu).toLowerCase(), al ? h("small", { class: "allergy" }, al) : null),
        h("td", null, t ? t.name + ", posto " + x.seat_number : x.rsvp === "no" ? "—" : h("button", { class: "linkish", type: "button", onclick: function () { placeGuestDialog(w, x, tables, guests); } }, "Assegna")),
        h("td", null, h("label", { class: "rsvp-pick " + x.rsvp }, h("span", { class: "sr" }, "Risposta di " + x.name), h("select", { onchange: async function (e) {
          var v = e.target.value, patch = { rsvp: v };
          if (v === "no" && x.table_id) patch = { rsvp: v, table_id: null, seat_number: null };
          await attempt(function () { return api.update("guests", x.id, patch); }, v === "no" && x.table_id ? "Risposta aggiornata: il suo posto al tavolo è di nuovo libero." : "Risposta aggiornata."); render();
        } }, opts(LABEL.rsvp).map(function (o) { return h("option", { value: o[0], selected: x.rsvp === o[0] }, o[1]); })))),
        h("td", null, h("span", { class: "row-actions" },
          mini("Modifica", function () { guestDialog(w, x); }),
          x.couple_side ? null : mini("Elimina", async function () { if (!await confirmBox("Eliminare l'invitato?", x.name + " verrà tolto dalla lista e dal suo tavolo.", "Elimina")) return; await attempt(function () { return api.remove("guests", x.id); }, "Eliminato."); render(); }, "danger")))));
    });
    var elenco = h("section", { class: "panel flush", "aria-labelledby": "el-h" }, h("header", { class: "panel-head pad" }, h("div", null, h("h2", { id: "el-h", class: "serif" }, "Elenco invitati"), invLine, menuLine)), h("div", { class: "pad-x" }, tools),
      guests.length ? (shown.length ? h("div", { class: "tscroll" }, h("table", { class: "tbl guests" }, h("caption", { class: "sr" }, "Invitati"),
        h("thead", null, h("tr", null, ["Nominativo", "Nucleo", "Menù", "Tavolo", "Risposta", "Azioni"].map(function (x) { return h("th", { scope: "col" }, x); }))), h("tbody", null, rows))) : h("p", { class: "muted pad" }, "Nessun invitato con questi filtri."))
        : empty("La lista comincia da voi", "Nessun invitato registrato. Aggiungete una persona o importate un file Excel; il numero previsto resta una stima separata.", h("div", { class: "btn-row" }, addGuest(), linkBtn("#/m/" + w.id + "/invitati/importa", "Importa da Excel", "ghost", "file")), "users"),
      pg.el ? h("div", { class: "pad-x" }, pg.el) : null);

    /* ---- tavolo per tavolo: lo stesso contenuto della pianta, leggibile anche da telefono ---- */
    var cards = tables.length ? h("section", { class: "per-tavolo", "aria-labelledby": "pt-h" }, h("h2", { id: "pt-h", class: "serif" }, "Tavolo per tavolo"),
      h("div", { class: "table-cards" }, tables.map(function (t) {
        var list = [], filled = guests.filter(function (x) { return x.table_id === t.id; }).length;
        for (var n = 1; n <= t.seats; n++) (function (n) {
          var x = at(t, n);
          list.push(h("li", null, h("button", { type: "button", class: "seat-row", onclick: function () { seatDialog(w, t, n, guests, tables); } },
            h("span", { class: "seat-no " + (x ? "gt-" + x.guest_group : "free") }, String(n)),
            x ? h("span", null, x.name, h("small", null, groupLabel(w, x.guest_group))) : h("span", { class: "muted" }, "Posto libero"))));
        })(n);
        return h("article", { class: "table-card" + (t.kind === "sposi" ? " sposi" : "") },
          h("header", null, h("div", null, h("h3", null, t.name), h("p", { class: "muted small" }, TABLE_TYPES.filter(function (y) { return y[0] === tableType(t); })[0][1].split(" · ")[0] + " · " + filled + " su " + t.seats + " posti")),
            filled >= t.seats ? badge("Completo", "ok") : badge((t.seats - filled) + (t.seats - filled === 1 ? " libero" : " liberi"), "wait")),
          h("ol", { class: "seat-list" }, list),
          h("p", { class: "row-actions" }, mini("Modifica", function () { editTable(t); }),
            mini("Elimina", async function () {
              if (!await confirmBox("Eliminare " + t.name + "?", filled ? "Le " + filled + " persone sedute torneranno tra quelle da sistemare." : "Il tavolo verrà tolto dalla sala.", "Elimina")) return;
              await attempt(function () { return api.remove("seating_tables", t.id); }, "Tavolo eliminato."); render();
            }, "danger")));
      }))) : empty("Ancora nessun tavolo", "Aggiungete i tavoli dalla sala: qui li vedrete uno per uno, posto per posto.", btn("Aggiungi tavolo", newTable, "primary", "plus"), "table");

    var head = pageHead("Invitati e tavoli", g.si + " vengono · " + g.in_attesa + " in attesa · " + g.no + " non vengono" + (w.guests_expected ? " · obiettivo " + w.guests_expected : ""),
      [guests.length ? btn("Stampa ed esporta", printMenu, "ghost", R.print ? "printer" : "lock") : null, addTable, addGuest()]);
    return [head, stats, tabs, tab === "elenco" ? elenco : tab === "tavoli" ? cards : sala];
  }

  /* ------------------------------------------------------------ importazione degli invitati */
  var CSV_HEAD = ["Nome", "Cognome", "Numero bambini", "Bambini sotto i 3 anni", "Menù", "Intolleranze/allergie"];
  var MENU_IN = { standard: "standard", vegano: "vegano", vegana: "vegano", vegetariano: "vegetariano", vegetariana: "vegetariano", "no carne": "no_carne", "senza carne": "no_carne", "no pesce": "no_pesce", "senza pesce": "no_pesce" };
  var ALLERGY_IN = [["glutine", /glutin|celiac/], ["lattosio", /latt/], ["uova", /uov/], ["frutta_guscio", /guscio|noc|mandorl|pistacch|frutta secca/], ["arachidi", /arachid/], ["soia", /soia/],
    ["pesce", /^pesc/], ["crostacei", /crostace|gamber|aragost/], ["molluschi", /mollusch|cozz|vongol|polp|calamar/], ["sedano", /sedano/], ["senape", /senape/], ["sesamo", /sesamo/], ["solfiti", /solfit|solforos/], ["lupini", /lupin/]];
  var norm = function (v) { return String(v || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); };
  // CSV di Excel: separatore ; o , e celle tra virgolette
  function parseCsv(text) {
    text = text.replace(/^﻿/, "");
    var first = text.split(/\r?\n/)[0] || "", sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  function readImport(rows) {
    if (!rows.length) return { rows: [], errs: ["Il file è vuoto."] };
    var head = rows[0].map(norm), out = [], errs = [];
    var col = function (re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; };
    var cN = col(/^nome/), cC = col(/^cognome/), cB = col(/^(numero )?bambini$/), cU = col(/sotto|3 anni/), cM = col(/^menu/), cA = col(/intoller|allerg/);
    if (cN < 0) return { rows: [], errs: ["Manca la colonna «Nome» nella prima riga: usate il modello scaricato da questa pagina."] };
    rows.slice(1, 501).forEach(function (r, i) {
      var line = i + 2, get = function (c) { return c >= 0 ? String(r[c] || "").trim() : ""; };
      var name = (get(cN) + " " + get(cC)).trim().replace(/\s+/g, " ").slice(0, 100);
      if (!name) { errs.push("Riga " + line + ": manca il nome, la salto."); return; }
      var kids = Math.max(0, Math.min(15, parseInt(get(cB), 10) || 0)), u = norm(get(cU));
      var small = /^s[iì]$/.test(u) ? kids : Math.min(kids, Math.max(0, parseInt(u, 10) || 0));
      var menu = MENU_IN[norm(get(cM))] || "standard";
      if (get(cM) && !MENU_IN[norm(get(cM))]) errs.push("Riga " + line + ": menù «" + get(cM) + "» non riconosciuto, uso standard.");
      var al = [], other = [];
      get(cA).split(/[,;\/+]| e /).forEach(function (a) {
        a = norm(a); if (!a || /^(no|nessun[ao]?|-)$/.test(a)) return;
        var hit = ALLERGY_IN.filter(function (x) { return x[1].test(a); })[0];
        if (hit) { if (al.indexOf(hit[0]) < 0) al.push(hit[0]); } else other.push(a);
      });
      if (other.length) al.push("altro");
      out.push({ name: name, kids: kids, small: small, menu: menu, allergies: al, note: other.join(", ").slice(0, 200) });
    });
    if (rows.length > 501) errs.push("Il file ha più di 500 righe: importo le prime 500.");
    return { rows: out, errs: errs };
  }
  // Una riga del foglio diventa l'adulto più i suoi bambini, nello stesso nucleo
  function importRows(w, rows, group) {
    var out = [];
    rows.forEach(function (r) {
      var base = { wedding_id: w.id, guest_group: group, rsvp: "in_attesa", menu: r.menu, allergies: r.allergies, allergies_note: r.note, household: r.kids ? r.name : "" };
      out.push(Object.assign({ name: r.name, age_band: "adulto" }, base));
      for (var i = 1; i <= r.kids; i++) out.push(Object.assign({}, base, { name: "Bambino " + i + " · " + r.name, age_band: i <= r.small ? "under3" : "bambino" }));
    });
    return out;
  }
  function importView(w) {
    var group = h("select", { id: "imp-g" }, GROUPS.map(function (k) { return h("option", { value: k }, groupLabel(w, k)); }));
    var out = h("div", { class: "imp-out", "aria-live": "polite" });
    var bad = function (t) { return h("div", { class: "alert bad", role: "alert" }, icon("alert"), h("div", null, h("b", null, t))); };
    function show(res) {
      if (!res.rows.length) return out.replaceChildren(bad(res.errs[0] || "Nessuna riga da importare."));
      var people = importRows(w, res.rows, group.value), kids = people.filter(function (x) { return x.age_band !== "adulto"; }).length;
      var small = people.filter(function (x) { return x.age_band === "under3"; }).length;
      out.replaceChildren(
        h("p", { class: "imp-sum" }, h("b", null, plural(people.length, "invitato", "invitati")), " da " + plural(res.rows.length, "riga", "righe") + ": " + plural(people.length - kids, "adulto", "adulti") + ", " + plural(kids, "bambino", "bambini") + (small ? " (" + small + " sotto i 3 anni)" : "") + ". Risposta: in attesa."),
        res.errs.length ? h("ul", { class: "imp-errs" }, res.errs.slice(0, 20).map(function (e) { return h("li", null, e); })) : null,
        h("div", { class: "tscroll" }, h("table", { class: "tbl" }, h("caption", { class: "sr" }, "Anteprima"),
          h("thead", null, h("tr", null, ["Nome", "Bambini", "Menù", "Intolleranze e allergie"].map(function (x) { return h("th", { scope: "col" }, x); }))),
          h("tbody", null, res.rows.slice(0, 50).map(function (r) {
            return h("tr", null, h("th", { scope: "row" }, r.name), h("td", null, r.kids ? r.kids + (r.small ? " (" + r.small + " sotto i 3 anni)" : "") : "—"), h("td", null, LABEL.menu[r.menu].toLowerCase()), h("td", null, allergyText({ allergies: r.allergies, allergies_note: r.note }) || "—"));
          })))),
        res.rows.length > 50 ? h("p", { class: "muted small" }, "Anteprima delle prime 50 righe.") : null,
        btn("Importa " + plural(people.length, "invitato", "invitati"), async function (e) {
          var b = e.currentTarget; b.disabled = true;
          var rows = importRows(w, res.rows, group.value);
          try { await attempt(async function () { for (var i = 0; i < rows.length; i += 200) await api.insert("guests", rows.slice(i, i + 200)); }, plural(rows.length, "invitato importato", "invitati importati") + "."); }
          catch (err) { b.disabled = false; return; }
          go("m/" + w.id + "/invitati/elenco");
        }, "primary", "check"));
    }
    var last = null;
    group.addEventListener("change", function () { if (last) show(last); });
    var file = h("input", { type: "file", id: "imp-f", accept: ".csv,text/csv", onchange: async function () {
      var f = file.files[0]; last = null;
      if (!f) return out.replaceChildren();
      if (/\.xls[xm]?$/i.test(f.name)) return out.replaceChildren(bad("È un file Excel: in Excel scegliete File › Salva con nome › CSV, poi caricate quel file."));
      if (f.size > 1048576) return out.replaceChildren(bad("Il file è troppo grande: al massimo 1 MB."));
      var buf = await f.arrayBuffer(), text = new TextDecoder("utf-8").decode(buf);
      // Excel su Windows salva il CSV senza UTF-8: le lettere accentate si recuperano così
      if (text.indexOf("\uFFFD") >= 0) text = new TextDecoder("windows-1252").decode(buf);
      show(last = readImport(parseCsv(text)));
    } });
    return [pageHead("Importa gli invitati", "Dal foglio Excel alla lista in tre passi. Potrete poi correggere ogni persona dall'elenco.", linkBtn("#/m/" + w.id + "/invitati/elenco", "Torna all'elenco", "ghost", "back")),
      h("ol", { class: "imp-steps" },
        h("li", { class: "panel" }, h("h2", null, "Scaricate il modello"), h("p", null, "Un file CSV con le colonne " + CSV_HEAD.map(function (c) { return "«" + c + "»"; }).join(", ") + ". Una riga per ogni adulto: i suoi bambini si indicano con il numero."),
          btn("Scarica il modello CSV", function () { download("modello-invitati.csv", [CSV_HEAD]); }, "soft", "file")),
        h("li", { class: "panel" }, h("h2", null, "Compilatelo con Excel"), h("p", null, "Menù: standard, vegano, vegetariano, no carne o no pesce. Allergie separate da virgole, per esempio «glutine, lattosio»: quelle fuori elenco finiscono in «Altro». Bambini sotto i 3 anni: quanti sono."),
          h("p", { class: "muted small" }, "Salvate in formato CSV: File › Salva con nome › CSV (delimitato dal separatore di elenco).")),
        h("li", { class: "panel" }, h("h2", null, "Caricate il file"), h("div", { class: "grid-form" }, h("div", { class: "fld" }, h("label", { for: "imp-f" }, "File CSV compilato"), file),
          h("div", { class: "fld" }, h("label", { for: "imp-g" }, "Gruppo degli invitati importati"), group)), out))];
  }

  /* ------------------------------------------------------------ programma del giorno */
  function timelineFields(w) {
    return F.timeline_items.map(function (f) { return f.name === "party" ? Object.assign({}, f, { options: [["comune", "In comune"], ["a", partyLabel(w, "a")], ["b", partyLabel(w, "b")]] }) : f; });
  }
  // Due programmi da stampare o salvare in PDF: ciascuno con i propri momenti e quelli in comune
  function printPrograms(w, items) {
    var sheet = h("div", { class: "print-programs" }, ["a", "b"].map(function (who) {
      var list = items.filter(function (x) { return x.party === who || x.party === "comune"; });
      return h("section", null, h("h1", null, "Programma di " + partyLabel(w, who)), h("p", null, w.title + (w.wedding_date ? " · " + fmtDate(w.wedding_date, true) : "")),
        h("table", null, h("thead", null, h("tr", null, ["Ora", "Momento", "Dove", "Chi coordina"].map(function (c) { return h("th", null, c); }))),
          h("tbody", null, list.map(function (x) { return h("tr", null, h("td", null, String(x.start_time).slice(0, 5)), h("td", null, x.title), h("td", null, x.place || "—"), h("td", null, x.owner || "—")); }))));
    }));
    printSheet(sheet);
  }
  // Stampa (o "Salva come PDF") di un foglio preparato apposta: la dashboard sparisce, resta il foglio.
  function printSheet(sheet) {
    sheet.classList.add("print-sheet");
    document.body.append(sheet); document.body.classList.add("printing");
    var done = function () { sheet.remove(); document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(function () { if (!matchMedia("print").matches) done(); }, 1000);
  }
  /* ---- stampe dei tavoli: il tableau per gli ospiti e la scheda per catering e location ---- */
  function tableOrder(tables) {
    return tables.slice().sort(function (a, b) { return (a.kind === "sposi" ? 0 : 1) - (b.kind === "sposi" ? 0 : 1) || a.name.localeCompare(b.name, "it", { numeric: true }); });
  }
  function seatedAt(guests, t) { return guests.filter(function (x) { return x.table_id === t.id && x.rsvp !== "no"; }).sort(function (a, b) { return (a.seat_number || 0) - (b.seat_number || 0); }); }
  function sheetHead(w, title) { return [h("h1", null, title), h("p", { class: "ps-sub" }, w.title + (w.wedding_date ? " · " + fmtDate(w.wedding_date, true) : "") + (w.city ? " · " + w.city : ""))]; }
  function printTableau(w, guests, tables) {
    var list = tableOrder(tables).filter(function (t) { return seatedAt(guests, t).length; });
    var alpha = guests.filter(function (x) { return x.table_id && x.rsvp !== "no"; }).sort(function (a, b) { return a.name.localeCompare(b.name, "it"); });
    var byId = {}; tables.forEach(function (t) { byId[t.id] = t; });
    printSheet(h("div", { class: "ps-tableau" },
      h("section", null, sheetHead(w, "Tableau"), h("div", { class: "ps-tables" }, list.map(function (t) {
        return h("article", { class: "ps-table" }, h("h2", null, t.name), h("ul", null, seatedAt(guests, t).map(function (x) { return h("li", null, x.name); })));
      }))),
      h("section", null, sheetHead(w, "Cercate il vostro nome"), h("ul", { class: "ps-alpha" }, alpha.map(function (x) { return h("li", null, h("span", null, x.name), h("b", null, byId[x.table_id].name)); })))));
  }
  function hallPlan(guests, tables) {
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    var el = function (tag, attrs, text) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text != null) e.textContent = text; return e; };
    svg.setAttribute("viewBox", "0 0 " + HALL_W + " " + HALL_H); svg.setAttribute("class", "ps-plan"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Pianta della sala");
    svg.append(el("rect", { x: 1, y: 1, width: HALL_W - 2, height: HALL_H - 2, fill: "none", stroke: "#999", "stroke-width": 2 }));
    tables.forEach(function (t) {
      var g = tableGeometry(t), cx = t.pos_x / 100 * HALL_W, cy = t.pos_y / 100 * HALL_H, n = seatedAt(guests, t).length;
      svg.append(t.shape === "rotondo" && t.kind !== "sposi" ? el("circle", { cx: cx, cy: cy, r: g.w / 2, fill: "#fff", stroke: "#333", "stroke-width": 3 })
        : el("rect", { x: cx - g.w / 2, y: cy - g.h / 2, width: g.w, height: g.h, rx: 6, fill: "#fff", stroke: "#333", "stroke-width": 3 }));
      svg.append(el("text", { x: cx, y: cy - 4, "text-anchor": "middle", "font-size": 22, "font-weight": 700 }, t.name));
      svg.append(el("text", { x: cx, y: cy + 22, "text-anchor": "middle", "font-size": 18 }, n + "/" + t.seats));
    });
    return svg;
  }
  function printCatering(w, guests, tables) {
    var coming = guests.filter(function (x) { return x.rsvp !== "no"; }), ages = { adulto: 0, bambino: 0, under3: 0 }, menus = {}, allergies = {};
    coming.forEach(function (x) {
      ages[x.age_band] = (ages[x.age_band] || 0) + 1; menus[x.menu] = (menus[x.menu] || 0) + 1;
      (x.allergies || []).forEach(function (a) { if (a !== "altro") allergies[a] = (allergies[a] || 0) + 1; });
    });
    var unseated = coming.filter(function (x) { return !x.table_id; }), waiting = coming.filter(function (x) { return x.rsvp === "in_attesa"; }).length;
    var kv = function (rows) { return h("table", { class: "ps-kv" }, h("tbody", null, rows.map(function (r) { return h("tr", null, h("th", null, r[0]), h("td", null, String(r[1]))); }))); };
    var guestRows = function (list) {
      return h("table", null, h("thead", null, h("tr", null, ["Posto", "Nome", "Età", "Menù", "Allergie e intolleranze"].map(function (c) { return h("th", null, c); }))),
        h("tbody", null, list.map(function (x) { return h("tr", null, h("td", null, x.seat_number || "—"), h("td", null, x.name + (x.rsvp === "in_attesa" ? " (in attesa)" : "")), h("td", null, LABEL.age[x.age_band] || ""), h("td", null, LABEL.menu[x.menu] || x.menu || ""), h("td", { class: allergyText(x) ? "ps-al" : null }, allergyText(x) || "—")); })));
    };
    printSheet(h("div", { class: "ps-catering" },
      h("section", null, sheetHead(w, "Scheda per catering e location"),
        h("p", { class: "ps-sub" }, "Persone attese: " + coming.length + (waiting ? " (di cui " + waiting + " ancora in attesa di risposta)" : "") + ". Aggiornata al " + fmtDate(todayIso(), true) + "."),
        h("div", { class: "ps-cols" },
          h("div", null, h("h2", null, "Persone"), kv([["Adulti", ages.adulto], ["Bambini", ages.bambino], ["Bambini sotto i 3 anni", ages.under3], ["Seggiolini (sotto i 3 anni)", ages.under3], ["Tavoli", tables.length]])),
          h("div", null, h("h2", null, "Menù"), kv(Object.keys(menus).map(function (k) { return [LABEL.menu[k] || k, menus[k]]; }))),
          h("div", null, h("h2", null, "Allergie e intolleranze"), Object.keys(allergies).length ? kv(Object.keys(allergies).map(function (k) { return [allergyLabel(k), allergies[k]]; })) : h("p", null, "Nessuna segnalata."))),
        h("h2", null, "Pianta della sala"), hallPlan(guests, tables)),
      tableOrder(tables).map(function (t) {
        var list = seatedAt(guests, t);
        return list.length ? h("section", { class: "ps-keep" }, h("h2", null, t.name + " · " + list.length + " su " + t.seats + " posti"), guestRows(list)) : null;
      }),
      unseated.length ? h("section", { class: "ps-keep" }, h("h2", null, "Senza posto assegnato · " + unseated.length), guestRows(unseated)) : null));
  }
  async function timelineView(w) {
    if (!rights(w).timeline) return [pageHead("Programma del giorno", "Orari, luoghi e responsabili della giornata."),
      lockPreview(w, "programma", "Il programma del giorno è nel Completo", "Orari, luoghi e chi coordina ogni momento, con due programmi separati da stampare per fornitori e famiglie.", sampleTimeline())];
    var items = await api.list("timeline_items", w.id), ro = !canEdit(w), pf = store.get("nio-party") || "";
    var fields = timelineFields(w);
    var add = ro ? null : btn("Aggiungi momento", function () { editDialog("Nuovo momento", fields, { party: "comune" }, "Aggiungi", function (d) { d.wedding_id = w.id; return api.insert("timeline_items", d); }, "Aggiunto."); }, "primary", "plus");
    var shown = pf ? items.filter(function (x) { return x.party === pf || x.party === "comune"; }) : items;
    var seg = h("div", { class: "seg", role: "group", "aria-label": "Di chi è il programma" }, [["", "Tutti i momenti"], ["a", "Programma di " + partyLabel(w, "a")], ["b", "Programma di " + partyLabel(w, "b")]].map(function (o) {
      return h("button", { type: "button", class: pf === o[0] ? "on" : null, "aria-pressed": String(pf === o[0]), onclick: function () { store.set("nio-party", o[0]); render(); } }, o[1]);
    }));
    return [pageHead("Programma del giorno", "Tutti i momenti della giornata: orari, luoghi, responsabili, e per chi è ciascun momento.", null, chipInfo(weddingMeta(w))),
      panel(plural(items.length, "momento pianificato", "momenti pianificati"), "Ogni momento è per " + partyLabel(w, "a") + ", per " + partyLabel(w, "b") + " o in comune. L'esportazione crea due programmi separati.",
        h("div", { class: "btn-row" }, items.length ? btn("Esporta i due programmi", function () { printPrograms(w, items); }, "soft", "printer") : null, add),
        items.length ? [seg, h("ol", { class: "rows timeline" }, shown.map(function (x) {
          return h("li", { class: "row tl" }, h("b", { class: "time" }, String(x.start_time).slice(0, 5)), h("div", { class: "row-main" }, h("b", null, x.title), h("span", { class: "party party-" + x.party }, partyLabel(w, x.party))),
            h("div", { class: "tl-col" }, h("small", null, "Dove"), h("span", null, x.place || "—")), h("div", { class: "tl-col" }, h("small", null, "Chi coordina"), h("span", null, x.owner || "—")),
            ro ? null : h("div", { class: "row-side" }, mini("Modifica", function () { editDialog("Modifica momento", fields, x, "Salva", function (d) { return api.update("timeline_items", x.id, d); }, "Salvato."); }, "pill"),
              mini("Elimina", async function () { if (!await confirmBox("Eliminare il momento?", "«" + x.title + "» verrà tolto dal programma.", "Elimina")) return; await attempt(function () { return api.remove("timeline_items", x.id); }, "Eliminato."); render(); }, "pill danger")));
        }))] : empty("Il programma è ancora vuoto", ro ? "La planner non ha ancora preparato il programma." : "Aggiungete i momenti principali: preparazione, arrivo, rito, foto, aperitivo, cena.", null, "calendar"))];
  }

  /* ------------------------------------------------------------ note riservate (solo planner) */
  async function notesView(w) {
    var notes = await api.list("internal_notes", w.id);
    var add = btn("Aggiungi nota", function () { editDialog("Nuova nota riservata", F.internal_notes, null, "Salva", function (d) { d.wedding_id = w.id; return api.insert("internal_notes", d); }, "Nota salvata."); }, "primary", "plus");
    return [pageHead("Note riservate", "Solo planner · Non condivise con la coppia", null, chipInfo(weddingMeta(w))),
      panel(plural(notes.length, "nota riservata", "note riservate"), "Solo planner · Non condivise con la coppia", add,
        notes.length ? h("ul", { class: "rows" }, notes.map(function (x) {
          return h("li", { class: "row note-row" }, h("div", { class: "row-main" }, h("b", null, x.body), h("small", null, fmtDate(x.created_at))),
            h("div", { class: "row-side" }, h("span", { class: "row-actions" },
              mini("Modifica", function () { editDialog("Modifica nota", F.internal_notes, x, "Salva", function (d) { return api.update("internal_notes", x.id, d); }, "Nota aggiornata."); }),
              mini("Elimina", async function () { if (!await confirmBox("Eliminare la nota?", "La nota verrà eliminata.", "Elimina")) return; await attempt(function () { return api.remove("internal_notes", x.id); }, "Eliminata."); render(); }, "danger"))));
        })) : h("p", { class: "muted" }, "Nessuna nota. Le note riservate restano nello spazio professionale."))];
  }

  /* ------------------------------------------------------------ collaboratori */
  async function peopleView(w) {
    var res = await Promise.all([api.listMembers(w.id), api.listInvites(w.id)]);
    var members = res[0], invites = res[1].filter(function (i) { return !i.accepted_at; });
    var me = state.me, planner = isPlannerHere(w);
    var link = location.origin + location.pathname;
    var invite = btn("Invita qualcuno", function () {
      editDialog("Invita in questo matrimonio", [
        { name: "email", label: "Email della persona", type: "email", required: true, wide: true, help: "L'invito vale per questa email: la persona deve registrarsi o accedere con lo stesso indirizzo. Non è un invito agli ospiti." },
        { name: "member_role", label: "Ruolo", type: "select", options: [["sposi", "Partner della coppia"], ["planner", "Wedding planner"]] }
      ], { member_role: "sposi" }, "Crea l'invito", function (d) { return api.createInvite(w.id, d.email, d.member_role, me); }, "Invito creato.");
    }, "bord");
    var msg = "Ciao! Ti ho invitato a organizzare «" + w.title + "» su Nozze in Ordine. Apri " + link + "#/registrati e crea l'account con questa stessa email (se ne hai già uno, accedi): troverai l'invito appena entri.";
    return [pageHead("Collaboratori", "Chi può accedere alla dashboard e ai dati del matrimonio.", null, chipInfo(weddingMeta(w))),
      panel("Membri", "Persone che possono accedere a questa dashboard.", badge(plural(members.length, "membro", "membri"), ""), h("ul", { class: "rows" }, members.map(function (m) {
        var self = m.user_id === me.id;
        return rowItem({ icon: m.member_role === "planner" ? "briefcase" : "users", tone: m.member_role === "planner" ? "bord" : "", title: (m.full_name || m.email) + (self ? " (tu)" : ""), meta: m.email,
          side: [badge(LABEL.member[m.member_role], "plain"), (self || planner) ? mini(self ? "Esci" : "Togli", async function () {
            if (!await confirmBox(self ? "Uscire da questo matrimonio?" : "Togliere questa persona?", self ? "Non vedrai più i suoi dati, finché qualcuno non ti invita di nuovo." : (m.full_name || m.email) + " non vedrà più questo matrimonio.", self ? "Esci" : "Togli")) return;
            await attempt(function () { return api.removeMember(w.id, m.user_id); }, "Fatto.");
            if (self) { await loadBase(); go(""); } else render();
          }, "pill danger") : null] });
      }))),
      panel("Inviti in attesa", "Persone che devono ancora accettare l'accesso.", badge(invites.length + " in attesa", ""),
        invites.length ? h("ul", { class: "rows" }, invites.map(function (i) {
          return rowItem({ icon: "mail", title: i.email, meta: "Scade il " + fmtDate(i.expires_at) + " · " + LABEL.member[i.member_role], side: mini("Annulla", async function () { await attempt(function () { return api.deleteInvite(i.id); }, "Invito annullato."); render(); }, "pill danger") });
        })) : h("p", { class: "box" }, "Nessun invito in attesa.")),
      panel("Invita qualcuno", "Condividi l'accesso alla dashboard.", invite, h("div", { class: "box" }, h("p", null, msg),
        btn("Copia il messaggio", async function () { try { await navigator.clipboard.writeText(msg); toast("Messaggio copiato."); } catch (e) { toast("Copia non riuscita: seleziona il testo a mano.", true); } }, "soft")))];
  }

  /* ------------------------------------------------------------ dati del matrimonio */
  async function settingsView(w) {
    var pri = h("fieldset", { class: "fld wide" }, h("legend", null, "Le vostre priorità · facoltativo"), h("div", { class: "choices three" }, Object.keys(LABEL.priority).map(function (k) {
      return h("label", { class: "choice-card" }, h("input", { type: "checkbox", name: "priorities", value: k, checked: (w.priorities || []).indexOf(k) >= 0 }), h("span", null, LABEL.priority[k]));
    })));
    var ro = !canEdit(w);
    var form = h("form", { class: "grid-form" }, h("fieldset", { class: "plain wide grid-form", disabled: ro }, F.wedding.map(function (f) { return field(f, w[f.name] == null ? "" : w[f.name]); }), pri),
      ro ? null : h("div", { class: "form-end wide" }, h("button", { class: "btn primary", type: "submit" }, "Salva le modifiche"), h("small", null, "I campi facoltativi possono essere lasciati vuoti.")));
    var errBox = h("div");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      var d = readForm(form, F.wedding); d.stage = d.stage || null;
      d.priorities = Array.prototype.filter.call(form.querySelectorAll('input[name="priorities"]'), function (x) { return x.checked; }).map(function (x) { return x.value; });
      var restore = [];
      if (d.wedding_date !== w.wedding_date && w.wedding_date && d.wedding_date) {
        var review = await dateReview(w, d.wedding_date);
        if (!review) return;
        restore = review;
      }
      var b = form.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "Salvataggio in corso…";
      try {
        await api.updateWedding(w.id, d);
        // le attività tolte dalla revisione tornano alla loro data di prima
        for (var i = 0; i < restore.length; i++) await api.update("tasks", restore[i].id, { due_date: restore[i].due_date });
      } catch (err) { errBox.replaceChildren(saveError(err)); b.disabled = false; b.textContent = "Salva le modifiche"; errBox.scrollIntoView({ block: "nearest" }); return; }
      toast(!w.wedding_date && d.wedding_date ? "Dati salvati: le scadenze sono pronte in «Da fare»." : "Dati salvati.");
      await loadBase(); render();
    });
    var canDelete = !ro && (state.me.role === "admin" || w.created_by === state.me.id);
    return [pageHead("Dati del matrimonio", "Nome, data, luogo e budget. I campi facoltativi possono essere lasciati vuoti.", null, chipInfo(weddingMeta(w))), errBox,
      h("section", { class: "panel" }, form),
      canDelete ? h("section", { class: "panel danger-zone" }, h("div", { class: "dz-head" }, h("span", { class: "ic-circle terra-solid" }, icon("trash")), h("div", null, h("h2", { class: "serif" }, "Eliminare il matrimonio"),
          h("p", null, "Si cancellano per sempre budget, fornitori, invitati, scadenze e programma, per tutti i membri."))),
        h("div", { class: "dz-foot" }, h("small", null, "Questa azione è permanente e non può essere annullata."), btn("Elimina il matrimonio", async function () {
          if (!await confirmBox("Eliminare «" + w.title + "»?", "Tutti i dati di questo matrimonio verranno cancellati per sempre, per tutti i membri. Non si può annullare.", "Elimina per sempre")) return;
          await attempt(function () { return api.deleteWedding(w.id); }, "Matrimonio eliminato."); await loadBase(); go("");
        }, "danger"))) : null];
  }
  // Prima di cambiare la data: si vedono le scadenze automatiche che si sposterebbero e si sceglie quali aggiornare.
  async function dateReview(w, newDate) {
    var tasks = await api.list("tasks", w.id);
    var auto = tasks.filter(function (t) { return !t.done && t.offset_months != null; });
    if (!auto.length) return [];
    var doneN = tasks.filter(function (t) { return t.done; }).length;
    var body = h("div", { class: "dlg-body" },
      h("div", { class: "date-pair" }, h("div", null, h("small", null, "Data attuale"), h("b", null, fmtDate(w.wedding_date, true))), icon("arrow"), h("div", null, h("small", null, "Nuova data"), h("b", null, fmtDate(newDate, true)))),
      h("p", { class: "muted small" }, "Cosa non cambia: le " + doneN + " attività completate restano intatte; le attività inserite a mano non vengono ricalcolate. La data attuale resta valida fino alla conferma."),
      h("p", { class: "wiz-q" }, "Rivedi le scadenze proposte"),
      h("div", { class: "review-list" }, auto.map(function (t) {
        return h("label", { class: "check boxed review" }, h("input", { type: "checkbox", name: "t", value: t.id, checked: true }),
          h("span", null, h("b", null, t.title), h("small", null, "Automatica · Da completare")), h("span", { class: "rv-dates" }, h("small", null, t.due_date ? fmtDate(t.due_date) : "—"), h("b", null, fmtDate(shiftIso(newDate, t.offset_months, t.offset_days)))));
      })));
    var r = await dialog("Cambia la data del matrimonio", body, [h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla e torna ai dati"), h("button", { class: "btn primary", value: "ok" }, "Conferma data e scadenze")]);
    if (r.value !== "ok") return null;
    var keep = Array.prototype.filter.call(r.form.querySelectorAll('input[name="t"]'), function (x) { return x.checked; }).map(function (x) { return x.value; });
    return auto.filter(function (t) { return keep.indexOf(t.id) < 0; }).map(function (t) { return { id: t.id, due_date: t.due_date }; });
  }

  /* ------------------------------------------------------------ promemoria */
  // Scadenze e pagamenti vicini, sui matrimoni di cui sono membro.
  function computeAlerts(all) {
    var me = state.me, days = me.notify_days == null ? 3 : Number(me.notify_days);
    if (!days && !all) return [];
    var mine = {}; state.weddings.forEach(function (w) { if (w.my_role) mine[w.id] = w; });
    var out = [];
    (state.alertTasks || []).forEach(function (t) {
      if (t.done || !t.due_date || !mine[t.wedding_id]) return;
      var n = daysTo(t.due_date);
      if (n <= (all ? 365 : days)) out.push({ id: "t" + t.id, kind: "scadenza", n: n, due: t.due_date, title: t.title, wedding: mine[t.wedding_id], href: "#/m/" + t.wedding_id + "/scadenze" });
    });
    (state.alertPays || []).forEach(function (b) {
      if (!b.due_date || !mine[b.wedding_id] || !rights(mine[b.wedding_id]).payments) return;
      var left = cost(b) - num(b.paid), n = daysTo(b.due_date);
      if (left > 0 && n <= (all ? 365 : days) && n >= -30) out.push({ id: "p" + b.id, kind: "pagamento", n: n, due: b.due_date, title: "Pagamento: " + b.category + " (" + eur(left) + ")", wedding: mine[b.wedding_id], href: "#/m/" + b.wedding_id + "/budget" });
    });
    return out.sort(function (a, b) { return a.n - b.n; });
  }
  var canNotify = function () { return "Notification" in window; };
  function swReg() { return ("serviceWorker" in navigator && api.mode === "live") ? navigator.serviceWorker.getRegistration() : Promise.resolve(null); }
  // Una notifica di sistema per ogni scadenza di oggi, domani o in ritardo, al massimo una volta al giorno.
  async function notifyDevice(list) {
    if (!canNotify() || Notification.permission !== "granted") return;
    var today = todayIso(), reg = await swReg().catch(function () { return null; });
    var fresh = list.filter(function (a) { return a.n <= 1 && store.local("nio-n-" + a.id) !== today; }).slice(0, 4);
    fresh.forEach(function (a) {
      var body = a.wedding.title + " · " + (a.n < 0 ? "in ritardo di " + plural(-a.n, "giorno", "giorni") : a.n === 0 ? "oggi" : "domani");
      var opt = { body: body, tag: a.id, icon: "../apple-touch-icon.png", data: { url: location.pathname + a.href } };
      try { if (reg) reg.showNotification(a.title, opt); else new Notification(a.title, opt); } catch (e) {}
      store.setLocal("nio-n-" + a.id, today);
    });
  }
  var installPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installPrompt = e; });
  function addToHome() {
    if (installPrompt) { installPrompt.prompt(); installPrompt = null; return; }
    dialog("Aggiungi alla schermata Home", h("div", { class: "dlg-body" }, h("p", null, "Su iPhone: apri questa pagina in Safari, tocca Condividi e poi «Aggiungi alla schermata Home»."),
      h("p", null, "Su Android: apri il menu del browser (⋮) e scegli «Installa app» o «Aggiungi a schermata Home».")), [h("button", { class: "btn primary", value: "ok" }, "Ho capito")]);
  }
  function deviceBox(compact) {
    if (!canNotify()) return h("p", { class: "muted small" }, "Questo browser non mostra notifiche. Su iPhone servono iOS 16.4 e l'app aggiunta alla schermata Home.");
    if (Notification.permission === "granted") return h("p", { class: "good small" }, "Stato: attive su questo dispositivo.");
    if (Notification.permission === "denied") return h("p", { class: "muted small" }, "Stato: bloccate per questo sito. Si riattivano dalle impostazioni del browser.");
    return h("div", { class: compact ? "" : "box" }, h("p", { class: "small" }, "Richiesta browser non ancora attivata: la notifica parte solo dopo la tua conferma."),
      btn("Attiva le notifiche su questo dispositivo", async function () {
        var p = await Notification.requestPermission();
        if (p === "granted") { toast("Notifiche attive."); notifyDevice(computeAlerts()); }
        render();
      }, "soft sm"));
  }
  function alertRow(a, planner) {
    var late = a.n < 0;
    return rowItem({ icon: a.kind === "pagamento" ? "wallet" : "calendar", tone: planner ? "terra-solid" : "", title: a.title,
      meta: (planner ? a.wedding.title + " · " : "") + (late ? plural(-a.n, "giorno", "giorni") + " fa" : "Scadenza: " + fmtDate(a.due, true)),
      side: [badge(late ? "In ritardo" : a.n === 0 ? "Oggi" : a.n === 1 ? "Domani" : "Tra " + a.n + " giorni", late ? "late" : "next"), planner ? linkBtn(a.href, "Apri attività", "primary sm") : null] });
  }
  function alertsView() {
    var me = state.me, planner = me.role !== "coppia", days = Number(me.notify_days);
    var list = computeAlerts(planner);
    var notifPanel = panel("Notifiche sul telefono e sul computer", "Ricevi un avviso quando una scadenza è vicina o è in ritardo.", h("a", { class: "pill-link", href: "#/profilo" }, "Quanti giorni prima avvisare", h("b", null, " " + (days || "mai"))),
      h("div", { class: "stack-sm" }, deviceBox(), h("p", { class: "small" }, "Aggiungi l'app alla schermata Home per aprire Nozze in Ordine in un tocco."), btn("Aggiungi alla Home", addToHome, "soft sm")));
    if (!planner) {
      var late = list.filter(function (a) { return a.n < 0; }), soon = list.filter(function (a) { return a.n >= 0; });
      return [pageHead("Promemoria", "Scadenze, ritardi e prossimi pagamenti in un solo sguardo.", null, state.weddings[0] ? chipInfo(weddingMeta(state.weddings[0])) : null), notifPanel,
        late.length ? panel("In ritardo", plural(late.length, "attività scaduta", "attività scadute") + ".", badge(late.length + " in ritardo", "late"), h("ul", { class: "rows" }, late.map(function (a) { return alertRow(a); }))) : null,
        soon.length ? panel("In arrivo", "Nei prossimi " + plural(days, "giorno", "giorni") + ".", badge(String(soon.length), "next"), h("ul", { class: "rows" }, soon.map(function (a) { return alertRow(a); }))) : null,
        !list.length ? empty(days ? "Niente in scadenza" : "I promemoria sono spenti", days ? "Nessuna scadenza nei prossimi " + plural(days, "giorno", "giorni") + " e nessun ritardo." : "Si riaccendono dal profilo.", null, "bell") : null];
    }
    var f = store.get("nio-pf") || "late";
    var lateAll = list.filter(function (a) { return a.n < 0; });
    var shown = f === "late" ? lateAll : f === "7" ? list.filter(function (a) { return a.n >= 0 && a.n <= 7; }) : list;
    var withLate = {}; lateAll.forEach(function (a) { withLate[a.wedding.id] = (withLate[a.wedding.id] || 0) + 1; });
    var pg = pager(shown.length, 10, "nio-pp-" + f, "promemoria");
    var filt = function (k, label, ic) { return h("button", { type: "button", class: "filter" + (f === k ? " on" : ""), "aria-pressed": String(f === k), onclick: function () { store.set("nio-pf", k); render(); } }, h("span", { class: "ic-circle soft" }, icon(ic)), label); };
    return [pageHead("Promemoria", "Le scadenze dei tuoi matrimoni, con una prossima azione chiara.", null, chipInfo("Dati al " + fmtDate(todayIso(), true))),
      kpis([kpi("Matrimoni in vista", String(state.weddings.filter(function (w) { return w.my_role; }).length), plural(state.weddings.length, "matrimonio in gestione", "matrimoni in gestione")),
        kpi("Promemoria totali", String(lateAll.length), plural(lateAll.length, "attività in ritardo da aprire", "attività in ritardo da aprire")),
        kpi("Matrimoni con ritardi", String(Object.keys(withLate).length), plural(Object.keys(withLate).length, "matrimonio", "matrimoni") + " con almeno 1 attività in ritardo")], "three"),
      h("div", { class: "split" },
        panel("Promemoria globali", Object.keys(withLate).map(function (id) { return withLate[id] + " " + (wedding(id) || {}).title; }).join(", ") || "Nessun ritardo", badge((pg.from + 1) + "–" + pg.to + " di " + shown.length, ""),
          h("div", null, shown.length ? h("ul", { class: "rows" }, shown.slice(pg.from, pg.to).map(function (a) { return alertRow(a, true); })) : h("p", { class: "muted" }, "Niente da mostrare con questo filtro."), pg.el)),
        h("div", { class: "stack" }, panel("Notifiche", "Preferenze per il dispositivo corrente e per i promemoria.", null, h("div", { class: "stack-sm" }, h("p", { class: "lbl" }, "Notifiche su questo dispositivo"), deviceBox(true),
            h("p", { class: "lbl" }, "Quando avvisare"), h("p", { class: "between" }, h("span", null, { 0: "Mai", 1: "Il giorno prima", 3: "3 giorni prima", 7: "Una settimana prima", 14: "Due settimane prima" }[days] || days + " giorni prima"), more("#/profilo", "Cambia"))), "compact"),
          panel("Filtri", "Ordina e filtra la vista globale dei promemoria.", null, h("div", { class: "filters" }, filt("all", "Tutti i matrimoni", "search"), filt("late", "In ritardo", "calendar"), filt("7", "Prossimi 7 giorni", "clock")), "compact")))];
  }

  /* ------------------------------------------------------------ profilo */
  async function profileView() {
    var me = state.me, role = me.role, ws = state.weddings;
    var fields = [{ name: "full_name", label: "Nome e cognome", required: true, max: 120, autocomplete: "name" }, { name: "phone", label: "Telefono", type: "tel", max: 40, autocomplete: "tel", placeholder: "Non impostato" }];
    if (role === "planner") fields.push({ name: "business_name", label: "Nome dello studio o dell'attività", max: 120, autocomplete: "organization" }, { name: "city", label: "Zona in cui lavori", max: 80, placeholder: "Es. Napoli e provincia" },
      { name: "weddings_per_year", label: "Matrimoni seguiti in un anno", type: "select", options: [["", "Non indicato"]].concat(opts(LABEL.perYear)) }, { name: "work_mode", label: "Come lavori", type: "select", options: [["", "Non indicato"]].concat(opts(LABEL.workMode)) });
    else fields.push({ name: "city", label: "Città", max: 80, placeholder: "Non impostata" });
    var errBox = h("div");
    var f = h("form", { class: "grid-form" }, h("div", { class: "fld wide ro" }, h("span", { class: "lbl" }, "Email di accesso"), h("p", null, me.email)), fields.map(function (x) { return field(x, me[x.name] == null ? "" : me[x.name]); }),
      h("div", { class: "fld ro" }, h("span", { class: "lbl" }, "Ruolo"), h("p", null, LABEL.role[role])),
      h("div", { class: "form-end wide" }, h("button", { class: "btn primary", type: "submit" }, "Salva i dati")));
    f.addEventListener("submit", async function (e) {
      e.preventDefault(); if (!f.checkValidity()) return f.reportValidity();
      var d = readForm(f, fields);
      if ("weddings_per_year" in d) { d.weddings_per_year = d.weddings_per_year || null; d.work_mode = d.work_mode || null; }
      try { await api.updateMyProfile(me.id, d); } catch (err) { errBox.replaceChildren(saveError(err)); return; }
      Object.assign(state.me, d); toast("Dati salvati."); render();
    });
    var nf = h("form", { class: "stack-sm" }, field({ name: "notify_days", label: "Avvisami delle scadenze", type: "select", options: [["0", "Mai"], ["1", "Il giorno prima"], ["3", "3 giorni prima"], ["7", "Una settimana prima"], ["14", "Due settimane prima"]] }, String(me.notify_days == null ? 3 : me.notify_days)),
      h("div", null, h("button", { class: "btn soft sm", type: "submit" }, "Salva")));
    nf.addEventListener("submit", async function (e) {
      e.preventDefault(); var v = Number(nf.elements.notify_days.value);
      await attempt(function () { return api.updateMyProfile(me.id, { notify_days: v }); }, "Preferenza salvata."); state.me.notify_days = v; render();
    });
    var pw = api.mode === "live" ? h("form", { class: "stack-sm" }, passwordField("password", "Nuova password", "new-password", "Almeno 8 caratteri."), h("div", null, h("button", { class: "btn soft sm", type: "submit" }, "Cambia password"))) : h("p", { class: "muted small" }, "Nella demo la password non si cambia.");
    if (pw.tagName === "FORM") pw.addEventListener("submit", async function (e) {
      e.preventDefault(); var p = pw.elements.password.value;
      if (p.length < 8) return toast("La password deve avere almeno 8 caratteri.", true);
      await attempt(function () { return api.updatePassword(p); }, "Password cambiata."); pw.reset();
    });
    var alertsN = computeAlerts(role !== "coppia").filter(function (a) { return a.n < 0; }).length;
    var roleCard;
    if (role === "coppia") {
      roleCard = panel("Il vostro matrimonio", "Dettagli dell'evento e accesso collaboratori.", ws[0] ? more("#/m/" + ws[0].id + "/impostazioni", "Vedi dettagli") : null,
        ws.length ? h("ul", { class: "plain-list" }, h("li", null, h("span", { class: "ic-circle soft" }, icon("users")), h("div", null, h("b", null, ws[0].title), h("small", null, weddingMeta(ws[0])))),
          h("li", null, h("span", { class: "ic-circle soft" }, icon("userplus")), h("div", null, h("a", { href: "#/m/" + ws[0].id + "/persone" }, h("b", null, "Invita il partner o la wedding planner")), h("small", null, "Usa la sezione Collaboratori per aggiungere accessi distinti dagli invitati.")))) : linkBtn("#/avvio", "Configura il vostro spazio", "primary"));
    } else if (role === "planner") {
      var active = ws.filter(function (w) { return w.my_role && (daysTo(w.wedding_date) == null || daysTo(w.wedding_date) >= 0); });
      roleCard = panel("La tua attività", null, more("#/eventi", "Vedi tutti"), h("div", null, h("dl", { class: "kv" }, h("div", null, h("dt", null, "Matrimoni in corso"), h("dd", null, String(active.length))),
        h("div", null, h("dt", null, "Nei prossimi 90 giorni"), h("dd", null, String(active.filter(function (w) { var n = daysTo(w.wedding_date); return n != null && n <= 90; }).length))),
        h("div", null, h("dt", null, "Promemoria in ritardo"), h("dd", null, String(alertsN)))), more("#/eventi", "Vai a tutti i tuoi matrimoni")));
    } else {
      roleCard = panel("Amministrazione", "Accessi secondo i permessi assegnati.", null, h("ul", { class: "link-list" }, [["admin", "Riepilogo"], ["admin/utenti", "Utenti e ruoli"], ["admin/lista", "Lista d'attesa"], ["eventi", "Tutti i matrimoni"]].map(function (x) { return h("li", null, h("a", { href: "#/" + x[0] }, x[1], icon("arrow"))); })));
    }
    return [pageHead("Il mio profilo", "Dati personali, promemoria e sicurezza in un solo sguardo.", null, chipInfo(role === "admin" ? "Accesso amministrativo" : role === "planner" ? "Account globale" : ws[0] ? weddingMeta(ws[0]) : "Account", role === "coppia" && ws[0] ? "calendar" : "user")), errBox,
      h("div", { class: "split profile" },
        h("div", { class: "stack" }, panel(role === "coppia" ? "Dati personali" : "I tuoi dati", "Modifica i dati associati al tuo account.", null, f), role === "admin" ? null : roleCard),
        h("div", { class: "stack" }, role === "admin" ? roleCard : null, role === "planner" ? planPanel() : role === "coppia" && ws[0] && ws[0].plan !== "planner" ? panel("Il vostro piano", "Piano " + (PLAN[ws[0].plan] || "—") + ". Nessun abbonamento: si paga una volta sola.", null, linkBtn("#/m/" + ws[0].id + "/piano", ws[0].plan === "completo" ? "Vedi il piano" : "Vedi cosa potete sbloccare", "soft sm"), "compact") : null,
          panel("Promemoria", "Ricevi avvisi prima delle scadenze.", role === "coppia" ? null : more("#/avvisi", "Vedi tutti"), h("div", { class: "stack-sm" }, nf, h("p", { class: "lbl" }, "Notifiche su questo dispositivo"), deviceBox(true)), "compact"),
          panel("Accesso e sicurezza", "Gestisci account e accessi.", btn("Esci", async function () { await attempt(api.signOut); }, "soft sm"), h("div", { class: "stack-sm" }, pw,
            h("p", { class: "small" }, h("b", null, "Account creato"), h("br"), me.created_at ? fmtDate(me.created_at, true) : "—"),
            h("p", { class: "small" }, h("b", null, "Cancellazione account"), h("br"), "Per cancellare l'account scrivi a info@nozzeinordine.com.")), "compact")))];
  }

  /* ------------------------------------------------------------ planner: i miei matrimoni */
  async function eventsView() {
    var ws = state.weddings, admin = state.me.role === "admin";
    // la planner passa dall'avvio guidato (secondo passo); l'amministrazione crea con il modulo semplice
    var create = admin ? function () {
      formDialog("Nuovo matrimonio", F.wedding, { ceremony: "da_decidere" }, "Crea", async function (d) { d.stage = d.stage || null; d.__id = await api.createWedding(d); })
        .then(async function (d) { if (d) { await loadBase(); toast("Matrimonio creato."); go("m/" + d.__id + "/panoramica"); } });
    } : function () { state.wiz = null; wizState().step = 2; go("avvio"); };
    var add = btn(ws.length ? "Nuovo matrimonio" : "Crea un matrimonio", create, "primary", "plus");
    if (!ws.length) {
      return [pageHead("I miei matrimoni", "Qui troverai gli eventi che crei e quelli a cui vieni invitata a collaborare.", add),
        h("p", null, badge("0 matrimoni", "")),
        h("section", { class: "panel hero-empty" }, empty("Il prossimo matrimonio inizia da qui", "Non hai ancora eventi nel tuo spazio. Scegli se crearne uno nuovo o entrare in uno già esistente.", null, "calplus")),
        h("div", { class: "split even" },
          panel("Un evento da organizzare da zero", "Per una coppia che non usa ancora Nozze in Ordine.", null, h("div", { class: "stack-sm" }, h("p", { class: "muted" }, "Aggiungi i nomi della coppia. Data, città e budget possono essere definiti in seguito."), btn("Crea il primo matrimonio", function () { state.wiz = null; wizState().step = 2; go("avvio"); }, "primary"))),
          panel("La coppia ha già uno spazio?", "Accetta il suo invito, senza creare doppioni.", null, h("div", { class: "stack-sm" }, h("p", { class: "muted" }, "Apri il collegamento ricevuto e accedi con l'email invitata: l'invito compare in alto. Se è scaduto, chiedine uno nuovo al mittente."),
            state.invites.length ? btn("Accetta un invito", function () { acceptInvite(state.invites[0]); }, "ghost") : h("p", { class: "small" }, "Nessun invito ricevuto per " + state.me.email + ".")))),
        h("p", { class: "muted small" }, "Ogni matrimonio mantiene dati e collaboratori separati. Le note riservate restano nello spazio professionale.")];
    }
    var tasks = await api.list("tasks", null);
    var stat = ws.map(function (w) {
      var tt = tasks.filter(function (t) { return t.wedding_id === w.id; });
      var late = tt.filter(function (t) { return !t.done && t.due_date && t.due_date < todayIso(); }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; });
      return { w: w, all: tt.length, done: tt.filter(function (t) { return t.done; }).length, late: late };
    });
    var sum = function (k) { return stat.reduce(function (a, s) { return a + (k === "late" ? s.late.length : s[k]); }, 0); };
    var cards = stat.map(function (s) {
      var w = s.w, n = daysTo(w.wedding_date), top = s.late[0];
      return h("article", { class: "panel event" },
        h("header", { class: "event-head" }, h("div", null, h("h2", { class: "serif bord" }, w.title), h("p", { class: "muted" }, (w.wedding_date ? fmtDate(w.wedding_date, true) : "Data da scegliere") + (w.city ? " · " + w.city : ""))),
          badge(plural(w.members_count, "collaboratore", "collaboratori"), "")),
        h("p", { class: "kpi-l" }, "Giorni mancanti"), h("p", { class: "kpi-v" }, n == null ? "—" : n < 0 ? "Celebrato" : String(n)), n != null && n >= 0 ? h("p", { class: "muted" }, "giorni") : null,
        h("p", { class: "bar-l" }, h("span", null, "Attività completate"), h("span", null, s.done + " / " + s.all)), bar([[s.done, "bord"]], s.all || 1, s.done + " attività completate su " + s.all),
        h("p", { class: "bar-l" }, h("span", null, "Priorità in ritardo"), h("span", null, String(s.late.length))), bar([[s.late.length, "terra"]], Math.max(s.all, 1) / 4, s.late.length + " attività in ritardo"),
        top ? [h("p", { class: "small" }, w.title + " · " + top.title), h("p", { class: "muted small" }, "In ritardo di " + plural(-daysTo(top.due_date), "giorno", "giorni"))] : h("p", { class: "muted small" }, "Nessuna attività in ritardo."),
        linkBtn("#/m/" + w.id + "/panoramica", "Apri matrimonio", "ghost block"));
    });
    return [pageHead(admin ? "Tutti i matrimoni" : "I miei matrimoni", plural(ws.length, "matrimonio", "matrimoni") + " · dati al " + fmtDate(todayIso(), true), add),
      kpis([kpi("Matrimoni attivi", String(ws.filter(function (w) { var n = daysTo(w.wedding_date); return n == null || n >= 0; }).length), plural(ws.length, "matrimonio in gestione", "matrimoni in gestione")),
        kpi("Attività completate", sum("done") + " / " + sum("all"), stat.map(function (s) { return s.done + "/" + s.all + " per " + s.w.title; }).join(" · ")),
        kpi("Priorità in ritardo", String(sum("late")), stat.map(function (s) { return s.w.title + " " + s.late.length; }).join(" · "), "", sum("late") ? "terra" : "")], "three"),
      h("div", { class: "events" }, cards), await plannerPayChart(ws)];
  }
  // Somma dei pagamenti di tutti i matrimoni seguiti, mese per mese (ogni voce dice di quale matrimonio è)
  async function plannerPayChart(ws) {
    var active = ws.filter(function (w) { var n = daysTo(w.wedding_date); return n == null || n >= 0; });
    if (!active.length) return null;
    var lists = await Promise.all(active.map(function (w) { return api.list("budget_items", w.id).catch(function () { return []; }); }));
    var items = [], until = null;
    lists.forEach(function (bud, i) { items = items.concat(budgetPayItems(bud, active[i].title)); if (active[i].wedding_date && (!until || active[i].wedding_date > until)) until = active[i].wedding_date; });
    return payChart(items, { title: "Pagamenti dei tuoi matrimoni, mese per mese", sub: "Quanto devono pagare le tue coppie ai fornitori in ogni mese, tutti gli eventi insieme. Tocca una colonna per le voci.", until: until,
      undated: items.filter(function (x) { return !x.date; }).length });
  }

  /* ------------------------------------------------------------ amministrazione */
  async function adminView(sub) {
    var res = await Promise.all([api.listProfiles(), api.listWaitlist(), api.listPlanRequests(), api.listUnlockClicks().catch(function () { return []; })]);
    var profiles = res[0], wait = res[1], ws = state.weddings;
    var count2 = function (r) { return profiles.filter(function (p) { return p.role === r; }).length; };
    var tabs = h("nav", { class: "seg pills", "aria-label": "Sezioni di amministrazione" }, [["", "Riepilogo"], ["utenti", "Utenti e ruoli"], ["piani", "Piani"], ["lista", "Lista d'attesa"]].map(function (t) {
      return h("a", { href: "#/admin" + (t[0] ? "/" + t[0] : ""), class: (sub || "") === t[0] ? "on" : null, "aria-current": (sub || "") === t[0] ? "page" : null }, t[1]);
    }));
    var roleLine = count2("coppia") + " coppie · " + count2("planner") + " planner · " + count2("admin") + " amministratori";
    if (sub === "utenti") {
      var admins = profiles.filter(function (p) { return p.role === "admin"; }).sort(function (a, b) { return (a.created_at || "") < (b.created_at || "") ? -1 : 1; });
      var editRole = async function (p) {
        var r = await dialog("Modifica ruolo", h("div", { class: "dlg-body" }, h("p", null, "Utente: ", h("b", null, p.full_name || p.email), " · " + p.email),
          field({ name: "role", label: "Nuovo ruolo", type: "select", options: opts(LABEL.role) }, p.role),
          h("p", { class: "muted small" }, "Il cambio vale subito. Il ruolo di amministratore si assegna solo da qui, mai durante la registrazione.")),
          [h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, "Applica il ruolo")],
          async function (form) { var v = form.elements.role.value; if (v !== p.role) await api.setRole(p.id, v); });
        if (r.value === "ok") { toast("Ruolo aggiornato."); render(); }
      };
      return [pageHead("Utenti e ruoli", "Gestisci ruoli, accessi e privilegi per ogni utente.", null, chipInfo("Amministrazione", "lock")), tabs,
        kpis([kpi("Utenti totali", String(profiles.length), roleLine), kpi("Ruoli", "3", "Coppia · Wedding planner · Amministratore"),
          kpi("Admin registrato il", admins[0] && admins[0].created_at ? fmtDate(admins[0].created_at, true) : "—", admins[0] ? "Admin · " + admins[0].email : null)], "three"),
        panel("Elenco utenti", null, badge(plural(profiles.length, "utente", "utenti"), ""), h("div", { class: "tscroll" }, h("table", { class: "tbl" }, h("caption", { class: "sr" }, "Utenti"),
          h("thead", null, h("tr", null, ["Utente", "Email", "Ruolo", "Registrato", "Azione"].map(function (x) { return h("th", { scope: "col" }, x); }))),
          h("tbody", null, profiles.map(function (p) {
            return h("tr", null, h("th", { scope: "row" }, p.full_name || "—"), h("td", null, p.email), h("td", null, badge(LABEL.role[p.role], p.role === "admin" ? "solid-bord" : "plain")),
              h("td", null, p.created_at ? fmtDate(p.created_at) : h("span", { class: "warn" }, "Non disponibile")),
              h("td", null, p.id === state.me.id ? h("span", { class: "muted small" }, "Il tuo account") : btn("Modifica ruolo", function () { editRole(p); }, "primary sm")));
          })))), h("p", { class: "muted small pad-t" }, "Ogni cambio di ruolo chiede una conferma. Non puoi togliere a te stesso il ruolo di amministratore."))];
    }
    if (sub === "piani") {
      var reqs = res[2], byU = {}, byW = {};
      profiles.forEach(function (p) { byU[p.id] = p; }); ws.forEach(function (w) { byW[w.id] = w; });
      var pick = async function (title, who, options, cur, save) {
        var r = await dialog(title, h("div", { class: "dlg-body" }, h("p", null, who),
          field({ name: "plan", label: "Piano", type: "select", options: options }, cur),
          h("p", { class: "muted small" }, "Il cambio vale subito. Assegna un piano a pagamento solo dopo aver ricevuto il pagamento.")),
          [h("button", { class: "btn ghost", value: "no", formnovalidate: true }, "Annulla"), h("button", { class: "btn primary", value: "ok" }, "Applica il piano")],
          async function (form) { await save(form.elements.plan.value); });
        if (r.value === "ok") { toast("Piano aggiornato."); await loadBase(); render(); }
      };
      var W_OPTS = [["gratis", "Gratis"], ["tableau", "Pass Tableau"], ["completo", "Completo"], ["planner", "Planner (creato da una planner)"]];
      var P_OPTS = [["prova", "Prova gratuita (riparte da 7 giorni)"], ["planner", "Planner"], ["team", "Team"], ["studio", "Studio"], ["libero", "Senza limiti"]];
      var editW = function (w) { return pick("Piano del matrimonio", "Matrimonio: " + w.title, W_OPTS, w.plan, function (v) { return api.setWeddingPlan(w.id, v); }); };
      var editP = function (p) { return pick("Piano della planner", "Planner: " + (p.full_name || p.email), P_OPTS, p.plan, function (v) { return api.setProfilePlan(p.id, v, v === "prova" ? 7 : null); }); };
      var grant = async function (x) {
        await attempt(async function () {
          if (x.plan === "completo" || x.plan === "tableau") { if (!x.wedding_id) throw new Error("La richiesta non indica un matrimonio."); await api.setWeddingPlan(x.wedding_id, x.plan); }
          else await api.setProfilePlan(x.user_id, x.plan, null);
          await api.setPlanRequestStatus(x.id, "attivata");
        }, "Piano attivato.");
        await loadBase(); render();
      };
      var close = async function (x) { await attempt(function () { return api.setPlanRequestStatus(x.id, "chiusa"); }, "Richiesta chiusa."); render(); };
      var open = reqs.filter(function (x) { return x.stato === "nuova"; }), planners = profiles.filter(function (p) { return p.role === "planner"; });
      var table = function (cap, heads, rows) { return h("div", { class: "tscroll" }, h("table", { class: "tbl" }, h("caption", { class: "sr" }, cap),
        h("thead", null, h("tr", null, heads.map(function (x) { return h("th", { scope: "col" }, x); }))), h("tbody", null, rows))); };
      return [pageHead("Piani", "Richieste di passaggio e piano di ogni matrimonio e di ogni planner.", null, chipInfo("Amministrazione", "lock")), tabs,
        panel("Richieste da gestire", "Attiva il piano dopo aver ricevuto il pagamento.", badge(plural(open.length, "richiesta", "richieste"), ""), open.length ? table("Richieste", ["Utente", "Email", "Piano chiesto", "Matrimonio", "Data", "Azione"], open.map(function (x) {
          var u = byU[x.user_id] || {}, w = byW[x.wedding_id];
          return h("tr", null, h("th", { scope: "row" }, u.full_name || "—"), h("td", null, u.email || "—"), h("td", null, badge(PLAN[x.plan] || x.plan, "plain")), h("td", null, w ? w.title : "—"), h("td", null, fmtDate(x.created_at)),
            h("td", null, h("div", { class: "btn-row" }, btn("Attiva", function () { grant(x); }, "primary sm"), btn("Chiudi", function () { close(x); }, "soft sm"))));
        })) : empty("Nessuna richiesta", "Quando qualcuno chiede un piano lo trovi qui.", null, "table")),
        (function () {
          // Clic su "Sblocca" durante la fase gratuita: il dato che dice se la linea prezzi C funziona
          var clicks = res[3], by = {}, wsC = {};
          clicks.forEach(function (c) { by[c.feature] = (by[c.feature] || 0) + 1; if (c.wedding_id) wsC[c.wedding_id] = 1; });
          return panel("Clic su «Sblocca»", "Quante volte chi è nella fase gratuita ha provato una funzione a pagamento, e da quanti matrimoni.", badge(plural(clicks.length, "clic", "clic"), ""),
            clicks.length ? h("ul", { class: "plain-list" }, Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (k) { return h("li", null, h("b", null, k), h("span", { class: "muted" }, plural(by[k], "clic", "clic"))); }),
              h("li", null, h("b", null, "Matrimoni diversi"), h("span", { class: "muted" }, String(Object.keys(wsC).length))))
              : empty("Ancora nessun clic", "Compariranno qui quando una coppia tocca «Sblocca».", null, "lock"));
        })(),
        panel("Matrimoni", null, badge(plural(ws.length, "matrimonio", "matrimoni"), ""), ws.length ? table("Matrimoni", ["Matrimonio", "Data", "Piano", "Azione"], ws.map(function (w) {
          return h("tr", null, h("th", { scope: "row" }, w.title), h("td", null, w.wedding_date ? fmtDate(w.wedding_date) : "—"), h("td", null, badge(PLAN[w.plan] || "—", w.plan === "gratis" ? "plain" : "solid-bord")),
            h("td", null, btn("Cambia piano", function () { editW(w); }, "soft sm")));
        })) : empty("Nessun matrimonio", null, null, "table")),
        panel("Wedding planner", null, badge(plural(planners.length, "planner", "planner"), ""), planners.length ? table("Wedding planner", ["Planner", "Email", "Piano", "Fine prova", "Azione"], planners.map(function (p) {
          return h("tr", null, h("th", { scope: "row" }, p.full_name || "—"), h("td", null, p.email), h("td", null, badge(PLAN[p.plan] || "—", p.plan === "prova" ? "plain" : "solid-bord")),
            h("td", null, p.plan === "prova" && p.trial_ends_at ? fmtDate(p.trial_ends_at) : "—"), h("td", null, btn("Cambia piano", function () { editP(p); }, "soft sm")));
        })) : empty("Nessuna planner registrata", null, null, "table"))];
    }
    if (sub === "lista") return waitlistView(wait, tabs);
    var latest = wait.slice().sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }).slice(0, 3);
    return [pageHead("Riepilogo", "Utenti, ruoli, lista d'attesa e accessi amministrativi.", null, chipInfo("Accesso amministrativo · dati aggregati", "lock")), tabs,
      kpis([kpi("Utenti totali", String(profiles.length), roleLine), kpi("Matrimoni", String(ws.length), "Conteggio aggregato senza dettagli evento"),
        kpi("Lista d'attesa", String(wait.length), wait.filter(function (x) { return x.profilo === "planner"; }).length + " planner · " + wait.filter(function (x) { return x.profilo === "coppia"; }).length + " coppie · " + wait.filter(function (x) { return x.stato === "nuova"; }).length + " nuove"),
        kpi("Accesso amministrativo", String(count2("admin")), "Privilegi separati da eventi e ruoli pubblici")], "four"),
      h("div", { class: "split" },
        panel("Utenti e ruoli", "Conteggio per ruolo.", more("#/admin/utenti", "Vedi dettagli"), h("ul", { class: "plain-list" }, [["coppia", "users", "Coppie"], ["planner", "briefcase", "Planner"], ["admin", "user", "Amministratori"]].map(function (r) {
          return h("li", null, h("span", { class: "ic-circle soft" }, icon(r[1])), h("b", null, r[2]), h("span", { class: "muted" }, plural(count2(r[0]), "utente", "utenti")));
        }))),
        panel("Lista d'attesa", null, more("#/admin/lista", "Vedi tutti"), h("div", null, latest.length ? h("ul", { class: "plain-list" }, latest.map(function (x) {
          var d = x.dati || {};
          return h("li", null, h("span", { class: "ic-circle soft" }, icon(x.profilo === "planner" ? "briefcase" : "users")), h("div", null, h("b", null, x.email), h("small", null, [LABEL.role[x.profilo], fmtDate(x.created_at), d.zona].filter(Boolean).join(" · "))));
        })) : h("p", { class: "muted" }, "Nessuna iscrizione."), h("p", { class: "muted small" }, "Richieste dai moduli del sito: nessun pagamento.")), "compact"))];
  }

  /* ------------------------------------------------------------ lista d'attesa: richieste dai moduli del sito */
  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var WL = {
    zona: { abruzzo: "Abruzzo", basilicata: "Basilicata", calabria: "Calabria", campania: "Campania", "emilia-romagna": "Emilia-Romagna", "friuli-venezia-giulia": "Friuli Venezia Giulia", lazio: "Lazio", liguria: "Liguria", lombardia: "Lombardia", marche: "Marche", molise: "Molise", piemonte: "Piemonte", puglia: "Puglia", sardegna: "Sardegna", sicilia: "Sicilia", toscana: "Toscana", "trentino-alto-adige": "Trentino-Alto Adige", umbria: "Umbria", "valle-d-aosta": "Valle d'Aosta", veneto: "Veneto", estero: "All'estero",
      // valori delle iscrizioni arrivate quando il modulo chiedeva la provincia campana
      caserta: "Caserta", napoli: "Napoli", salerno: "Salerno", avellino: "Avellino", benevento: "Benevento", altra: "Altra regione" },
    planner: { si: "ha una planner", cerchiamo: "cerca una planner", no: "senza planner" },
    prezzo49: { si: "Sì a 49 €", forse: "Forse a 49 €", no: "No a 49 €" },
    pilota: { si: "vuole la prova pilota", info: "vuole saperne di più", aggiornamenti: "solo aggiornamenti" }
  };
  function wlWhen(d) {
    if (!d.anno) return null;
    if (d.anno === "nd") return "Data da decidere";
    return (d.mese && d.mese !== "nd" ? MONTHS[+d.mese - 1] + " " : "") + (d.anno === "2029" ? "2029 o dopo" : d.anno);
  }
  function wlSummary(x) {
    var d = x.dati || {}, list = function (v) { return Array.isArray(v) ? v.join(", ") : v; };
    if (x.profilo === "planner") return [d.studio, WL.zona[d.zona] || d.zona, d.eventi ? d.eventi + " l'anno" : null, d.in_corso != null ? d.in_corso + " in corso" : null, WL.pilota[d.pilota], d.chiamata ? "vuole una chiamata" : null, d.telefono ? "tel. " + d.telefono : null, d.web].filter(Boolean).join(" · ");
    if (d.modulo) return [d.nome, wlWhen(d), WL.zona[d.zona], d.invitati ? d.invitati.replace("fino-", "fino a ") + " invitati" : null, WL.planner[d.planner], WL.prezzo49[d.prezzo49], d.prova ? "vuole provarlo tra i primi" : null, d.pesi ? "pesa: " + list(d.pesi) : null].filter(Boolean).join(" · ");
    return [WL.zona[d.zona] || d.zona, d.prezzo ? "prezzo " + d.prezzo : null].filter(Boolean).join(" · "); // iscrizioni dal modulo precedente
  }
  function waitlistView(wait, tabs) {
    var f = store.get("nio-wl") || "", n = function (fn) { return wait.filter(fn).length; };
    var couples = wait.filter(function (x) { return x.profilo === "coppia"; }), planners = wait.filter(function (x) { return x.profilo === "planner"; });
    var ongoing = planners.reduce(function (t, x) { return t + (Number((x.dati || {}).in_corso) || 0); }, 0);
    var priced = couples.filter(function (x) { return (x.dati || {}).prezzo49; });
    var yes = n(function (x) { return (x.dati || {}).prezzo49 === "si"; }), maybe = n(function (x) { return (x.dati || {}).prezzo49 === "forse"; });
    var months = {};
    couples.forEach(function (x) { var d = x.dati || {}; if (!d.anno) return; var k = d.anno === "nd" ? "zz" : d.anno + "-" + (d.mese && d.mese !== "nd" ? d.mese : "99"); months[k] = (months[k] || 0) + 1; });
    var monthRows = Object.keys(months).sort().map(function (k) {
      var y = k.slice(0, 4), m = k.slice(5);
      return [k === "zz" ? "Data da decidere" : (m === "99" ? "" : MONTHS[+m - 1] + " ") + (y === "2029" ? "2029 o dopo" : y) + (m === "99" ? ", mese da decidere" : ""), months[k]];
    });
    var maxM = Math.max.apply(null, monthRows.map(function (r) { return r[1]; }).concat(1));
    var shown = wait.filter(function (x) { return !f || x.profilo === f || x.stato === f; });
    var pg = pager(shown.length, 20, "nio-wlp-" + f, "richieste");
    var seg = h("div", { class: "seg", role: "group", "aria-label": "Filtra le richieste" }, [["", "Tutte · " + wait.length], ["coppia", "Coppie · " + couples.length], ["planner", "Planner · " + planners.length], ["nuova", "Nuove · " + n(function (x) { return x.stato === "nuova"; })]].map(function (o) {
      return h("button", { type: "button", class: f === o[0] ? "on" : null, "aria-pressed": String(f === o[0]), onclick: function () { store.set("nio-wl", o[0]); render(); } }, o[1]);
    }));
    var exp = btn("Esporta CSV", function () {
      var head = ["Data", "Profilo", "Stato", "Email", "Nomi o studio", "Zona", "Mese", "Anno", "Invitati", "Budget", "Planner", "Già prenotato", "Strumenti", "Difficoltà", "A 49 €", "Tra i primi a provarlo", "Team", "Matrimoni l'anno", "In corso", "Spesa software", "Pilota", "Chiamata", "Telefono", "Sito o Instagram", "Note"];
      download("lista-attesa.csv", [head].concat(wait.map(function (x) {
        var d = x.dati || {}, j = function (v) { return Array.isArray(v) ? v.join(", ") : v; };
        return [fmtDate(x.created_at), x.profilo, LABEL.wl[x.stato] || x.stato, x.email, d.nome || d.studio, d.zona, d.mese, d.anno, d.invitati, d.budget, d.planner, j(d.prenotato), d.strumenti, j(d.pesi || d.perdite), d.prezzo49 || d.prezzo, d.prova ? "sì" : "", d.team, d.eventi, d.in_corso, d.spesa, d.pilota, d.chiamata ? "sì" : "", d.telefono, d.web, d.note];
      })));
    }, "primary");
    var setStato = function (x) {
      return h("label", { class: "status-pill" }, h("span", { class: "sr" }, "Stato della richiesta di " + x.email),
        h("select", { onchange: async function (e) { await attempt(function () { return api.setWaitlistStatus(x.id, e.target.value); }, "Stato aggiornato."); x.stato = e.target.value; } },
          opts(LABEL.wl).map(function (o) { return h("option", { value: o[0], selected: (x.stato || "nuova") === o[0] }, o[1]); })));
    };
    return [pageHead("Lista d'attesa", plural(wait.length, "richiesta", "richieste") + " dai moduli del sito", wait.length ? exp : null), tabs,
      kpis([kpi("Richieste", String(wait.length), couples.length + " coppie · " + planners.length + " planner"),
        kpi("Da gestire", String(n(function (x) { return x.stato === "nuova"; })), "Richieste ancora nello stato «Nuova»", "", n(function (x) { return x.stato === "nuova"; }) ? "terra" : ""),
        kpi("Matrimoni in corso", String(ongoing), "Dichiarati da " + plural(planners.filter(function (x) { return (x.dati || {}).in_corso != null; }).length, "planner", "planner")),
        kpi("Pagherebbero 49 €", String(yes), maybe + " forse · su " + plural(priced.length, "coppia che ha risposto", "coppie che hanno risposto"))], "four"),
      h("div", { class: "split" },
        panel("Matrimoni per mese", "Dalle risposte delle coppie.", null, monthRows.length ? h("ul", { class: "plain-list wl-months" }, monthRows.map(function (r) {
          return h("li", null, h("b", null, r[0]), bar([[r[1], "cer"]], maxM, r[1] + " su " + maxM), h("span", { class: "muted" }, plural(r[1], "coppia", "coppie")));
        })) : h("p", { class: "muted" }, "Ancora nessuna data dalle coppie."), "compact"),
        panel("Prova pilota", "Dalle risposte delle planner.", null, h("ul", { class: "plain-list" },
          [["Vogliono farne parte", n(function (x) { return (x.dati || {}).pilota === "si"; })], ["Vogliono saperne di più", n(function (x) { return (x.dati || {}).pilota === "info"; })], ["Chiedono una chiamata", n(function (x) { return x.profilo === "planner" && (x.dati || {}).chiamata; })], ["Già nella prova pilota", n(function (x) { return x.stato === "pilota"; })]].map(function (r) {
            return h("li", null, h("b", null, r[0]), h("span", { class: "muted" }, String(r[1])));
          })), "compact")),
      panel("Richieste", null, null, [
        h("div", { class: "note-box" }, h("b", null, "Accesso a dati personali"), h("p", null, "Email, telefoni e note servono solo per rispondere a chi ha scritto. L'esportazione contiene tutto: conservala con cura.")),
        seg,
        shown.length ? h("div", { class: "tscroll" }, h("table", { class: "tbl" }, h("caption", { class: "sr" }, "Richieste"),
          h("thead", null, h("tr", null, ["Data", "Profilo", "Email", "Dettagli", "Note", "Stato"].map(function (x) { return h("th", { scope: "col" }, x); }))),
          h("tbody", null, shown.slice(pg.from, pg.to).map(function (x) {
            var d = x.dati || {};
            return h("tr", null, h("td", null, fmtDate(x.created_at)), h("td", null, LABEL.role[x.profilo] || x.profilo), h("th", { scope: "row" }, x.email),
              h("td", null, wlSummary(x) || "—"), h("td", { class: "muted" }, d.note || "—"), h("td", null, setStato(x)));
          })))) : empty("Nessuna richiesta", f ? "Nessuna richiesta con questo filtro." : null, null, "table"), pg.el])];
  }

  /* ------------------------------------------------------------ pagine di recupero */
  function inviteExpired() {
    return h("div", { class: "recover" }, h("header", { class: "wiz-top" }, brand("ceramica"), h("p", null, "Accesso tramite invito")),
      h("div", { class: "recover-in" }, h("div", null, h("span", { class: "empty-ic" }, icon("mail")), badge("Invito non più valido", "late"), h("h1", null, "Questo invito è scaduto"),
          h("p", null, "Il collegamento non permette più di entrare. Non è stato aggiunto alcun accesso e non devi creare un nuovo matrimonio."),
          h("p", { class: "muted small" }, "Per proteggere lo spazio, qui non mostriamo i dati del matrimonio o della coppia.")),
        h("div", { class: "stack" }, panel("Chiedi un nuovo invito", "Contatta la persona che ti ha invitato.", null, h("p", null, "Chiedile di inviarti un nuovo collegamento allo stesso indirizzo. Il nuovo invito dovrà arrivare dal mittente: non ne inviamo uno in automatico.")),
          panel("Stai usando un'altra email?", null, null, h("div", { class: "stack-sm" }, h("p", null, "Esci e accedi con l'indirizzo che ha ricevuto l'invito. Se vuoi usare un'altra email, chiedi al mittente di invitare quell'indirizzo."),
            btn("Accedi con un'altra email", async function () { await attempt(api.signOut); }, "ghost"))),
          linkBtn("#/", "Torna al mio spazio", "ghost"))));
  }
  function noAccess() {
    var me = state.me;
    return [h("header", { class: "page-head" }, h("div", { class: "ph-text" }, h("h1", null, "Questo spazio non è accessibile"), h("p", { class: "sub" }, "Il tuo account non ha i permessi per aprire questa pagina."))),
      h("section", { class: "panel" }, h("div", { class: "stack-sm" }, h("span", { class: "empty-ic" }, icon("lock")), badge("403 · Accesso non consentito", "late"), h("h2", { class: "serif big" }, "Chiedi a chi gestisce il matrimonio"),
        h("p", null, "Puoi chiedere l'accesso alla persona che ti ha condiviso il collegamento: i dati restano riservati finché non ricevi un invito valido."),
        h("div", { class: "btn-row" }, linkBtn("#/", me.role === "coppia" ? "Torna al tuo spazio" : "Torna a I miei matrimoni", "primary")),
        h("p", { class: "muted small" }, "Non sono mostrati nomi, budget o altri dati dello spazio protetto."))),
      h("div", { class: "split even" }, panel("Avevi già un invito?", null, null, h("div", { class: "stack-sm" }, h("p", null, "Verifica di aver effettuato l'accesso con l'email invitata. Un account diverso può non avere gli stessi permessi."), btn("Cambia account", async function () { await attempt(api.signOut); }, "ghost"))),
        panel("I tuoi eventi restano separati", null, null, h("p", null, "Puoi tornare all'elenco dei matrimoni a cui hai accesso. Questa pagina non modifica le tue autorizzazioni.")))];
  }

  /* ------------------------------------------------------------ caricamento e disegno */
  async function refreshAlerts() {
    var mineIds = state.weddings.filter(function (w) { return w.my_role; }).map(function (w) { return w.id; });
    if (mineIds.length) {
      var a = await Promise.all([api.list("tasks", null), api.list("budget_items", null), api.list("guests", null)]);
      mineIds.forEach(function (id) { state.hc[id] = headcount(a[2].filter(function (g) { return g.wedding_id === id; })); });
      state.alertTasks = a[0].filter(function (t) { return mineIds.indexOf(t.wedding_id) >= 0; });
      state.alertPays = a[1].filter(function (b) { return mineIds.indexOf(b.wedding_id) >= 0; });
    } else { state.alertTasks = []; state.alertPays = []; }
  }
  async function loadBase() {
    state.me = await api.me();
    if (!state.me) return;
    var r = await Promise.all([api.listWeddings(state.me), api.pendingInvites().catch(function () { return []; })]);
    state.weddings = r[0]; state.invites = r[1] || [];
    await refreshAlerts();
    notifyDevice(computeAlerts());
  }
  // Si configura lo spazio la prima volta: la coppia senza matrimonio, la planner senza dati di attività e senza eventi.
  function needsSetup(me) {
    if (me.role === "coppia") return !state.weddings.length && !state.invites.length;
    if (me.role === "planner") return !state.weddings.length && !me.weddings_per_year;
    return false;
  }

  var renderId = 0;
  async function render() {
    var my = ++renderId;
    if (!state.navOpen) document.body.classList.remove("nav-open");
    var p = route();
    try {
      var session = await api.session();
      if (!session) {
        state.me = null;
        var screen = api.mode === "demo" ? demoChooser() : p[0] === "nuova-password" ? newPasswordScreen() : authScreen(p[0] === "registrati" ? "registrati" : p[0] === "password" ? "password" : "accedi");
        if (my === renderId) { root.replaceChildren(screen); document.title = (screen.querySelector("h1") || {}).textContent + " · Nozze in Ordine"; }
        return;
      }
      if (p[0] === "nuova-password") { root.replaceChildren(newPasswordScreen()); return; }
      if (!state.me) await loadBase();
      if (!state.me) throw new Error("Profilo non trovato. Esci e accedi di nuovo.");
      var me = state.me, content;
      if (p[0] === "avvio" && me.role !== "admin") { if (my === renderId) { root.replaceChildren(wizard()); document.title = "Configura il tuo spazio · Nozze in Ordine"; } return; }
      if (p[0] === "invito-scaduto") { if (my === renderId) root.replaceChildren(inviteExpired()); return; }
      if (p[0] === "m") {
        var w = wedding(p[1]);
        if (!w) content = noAccess();
        else {
          var sec = p[2] || "panoramica";
          if (sec === "tavoli") sec = "invitati";
          var view = { panoramica: overview, scadenze: tasksView, budget: budgetView, fornitori: vendorsView, invitati: guestsView, scaletta: timelineView, note: notesView, persone: peopleView, impostazioni: settingsView, piano: planView }[sec] || overview;
          if ((sec === "note" || sec === "persone") && !isPlannerHere(w)) view = overview;
          if (!root.querySelector(".shell")) root.replaceChildren(shell(h("p", { class: "loading" }, "Carico…")));
          content = await view(w, p[3]);
          if (view === overview && (w.plan === "gratis" || w.plan === "tableau") && Array.isArray(content)) content.splice(1, 0, gratisBanner(w));
          if (!canEdit(w) && view !== guestsView && view !== overview && Array.isArray(content)) content.splice(1, 0, h("div", { class: "alert info ro-note" }, icon("eye"),
            h("div", null, h("b", null, "Sola lettura"), h("p", null, "Questo matrimonio è seguito da una wedding planner: potete consultare tutto e modificare invitati e tavoli."))));
        }
      } else if (p[0] === "eventi" && me.role !== "coppia") content = await eventsView();
      else if (p[0] === "admin" && me.role === "admin") content = await adminView(p[1]);
      else if (p[0] === "profilo") content = await profileView();
      else if (p[0] === "avvisi") content = alertsView();
      else {
        // pagina iniziale secondo il ruolo
        if (needsSetup(me)) return go("avvio");
        if (me.role === "admin") return go("admin");
        if (me.role === "planner") return go("eventi");
        if (state.weddings.length) return go("m/" + state.weddings[0].id + "/panoramica");
        content = [pageHead("Il vostro spazio", "Avete ricevuto un invito: accettatelo qui sopra per entrare nel matrimonio esistente, oppure create il vostro."), linkBtn("#/avvio", "Configura il vostro spazio", "primary")];
      }
      if (my !== renderId) return;
      var y = window.scrollY, same = root.dataset.r === location.hash;
      root.replaceChildren(shell(content));
      if (!same) root.querySelector(".main").classList.add("enter"); // entrata solo cambiando pagina, non dopo un salvataggio
      root.dataset.r = location.hash;
      if (same) window.scrollTo(0, y); else window.scrollTo(0, 0);
      document.title = (document.querySelector(".page-head h1") || {}).textContent + " · Nozze in Ordine";
    } catch (e) {
      if (my !== renderId) return;
      var box = h("div", { class: "panel" }, h("h1", null, "Qualcosa non ha funzionato"), h("p", null, e.message || String(e)), btn("Riprova", function () { state.me = null; render(); }, "primary"));
      root.replaceChildren(state.me ? shell(box) : box);
    }
  }

  api.onAuthChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { location.hash = "#/nuova-password"; return; }
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      state.me = null; state.weddings = []; state.invites = []; state.wiz = null;
      if (event === "SIGNED_OUT") location.hash = "#/accedi";
      setTimeout(render, 0);
    }
  });
  if (api.mode === "live" && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  render();
})();
