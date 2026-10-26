/* Nozze in Ordine: interfaccia della dashboard (coppie, wedding planner, amministrazione).
   Struttura e testi seguono i mockup Figma "Dashboard". Parla solo con window.NIO_API (api.js dal vivo, mock-api.js nella demo).
   Tutto il testo che arriva dai dati passa da textContent: niente innerHTML con contenuti degli utenti. */
(function () {
  "use strict";
  var api = window.NIO_API;
  var root = document.getElementById("app");
  var state = { me: null, weddings: [], invites: [], navOpen: false, wiz: null };
  var PHASES = ["12+ mesi prima", "9-11 mesi prima", "6-8 mesi prima", "3-5 mesi prima", "1-2 mesi prima", "Settimana del sì"];
  var MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var MESI_L = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var LABEL = {
    role: { admin: "Amministratore", coppia: "Coppia", planner: "Wedding planner" },
    member: { sposi: "Coppia", planner: "Wedding planner" },
    ceremony: { civile: "Civile", religioso: "Religioso", simbolico: "Simbolico", da_decidere: "Da decidere" },
    vendor: { da_scegliere: "Da scegliere", in_trattativa: "In trattativa", confermato: "Confermato", scartato: "Scartato" },
    rsvp: { in_attesa: "In attesa", si: "Viene", no: "Non viene" },
    menu: { standard: "Standard", vegetariano: "Vegetariano", vegano: "Vegano", bambini: "Bambini", altro: "Altro" },
    assignee: { sposi: "Sposi", planner: "Planner" },
    priority: { spese: "Tenere sotto controllo le spese", fornitori: "Trovare i fornitori", invitati: "Organizzare gli invitati" },
    stage: { inizio: "Siamo all'inizio", qualcosa: "Qualcosa è già deciso", dettagli: "Mancano i dettagli" },
    perYear: { "1-5": "Da 1 a 5", "6-10": "Da 6 a 10", "11-20": "Da 11 a 20", "20+": "Più di 20" },
    workMode: { autonomia: "Lavoro in autonomia", team: "Lavoro con un team" },
    wl: { nuova: "Nuova", contattata: "Contattata", pilota: "In pilota", scartata: "Scartata" }
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
  var CATS = ["Location e ricevimento", "Catering", "Fotografo e video", "Abiti e accessori", "Fiori e allestimenti", "Musica e intrattenimento", "Partecipazioni e stampa", "Bomboniere", "Trasporti", "Rito e documenti", "Viaggio di nozze", "Altre spese"];
  // Quanto costa una voce: l'importo del contratto se c'è, altrimenti la stima.
  function cost(b) { return Number(b.contracted) > 0 ? Number(b.contracted) : Number(b.planned) || 0; }
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
      if (f.type === "checkbox") out[f.name] = el.checked;
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
      { name: "description", label: "Dettaglio", max: 200, placeholder: "Es. Villa con giardino" },
      { name: "planned", label: "Costo stimato (€)", type: "number", min: 0, step: "0.01", help: "Quanto pensate di spendere per questa voce." },
      { name: "contracted", label: "Importo del contratto, se firmato (€)", type: "number", min: 0, step: "0.01", help: "Quando c'è, prende il posto della stima." },
      { name: "paid", label: "Già pagato (€)", type: "number", min: 0, step: "0.01" },
      { name: "due_date", label: "Prossimo pagamento", type: "date" }
    ],
    tables: [
      { name: "name", label: "Nome del tavolo", required: true, max: 60, placeholder: "Es. Capri", wide: true },
      { name: "seats", label: "Posti", type: "select", options: [["8", "8 posti"], ["9", "9 posti"], ["10", "10 posti"], ["11", "11 posti"], ["12", "12 posti"]] },
      { name: "shape", label: "Forma", type: "select", options: [["rotondo", "Rotondo"], ["rettangolare", "Rettangolare"]] }
    ],
    vendors: [
      { name: "category", label: "Categoria", required: true, max: 80, list: ["Location", "Catering", "Fotografo", "Video", "Musica", "Fiori", "Abiti", "Trucco e capelli", "Partecipazioni", "Trasporti", "Altro"] },
      { name: "name", label: "Nome del fornitore", required: true, max: 120 },
      { name: "contact", label: "Contatto (telefono o email)", max: 200 },
      { name: "status", label: "Stato", type: "select", options: opts(LABEL.vendor) },
      { name: "notes", label: "Note", type: "textarea", max: 2000, wide: true }
    ],
    quotes: [
      { name: "label", label: "Nome del preventivo", required: true, max: 120, placeholder: "Es. Menù A" },
      { name: "amount", label: "Importo (€)", type: "number", min: 0, step: "0.01" },
      { name: "per_person", label: "Importo a persona", type: "checkbox" },
      { name: "includes", label: "Cosa comprende", max: 500 },
      { name: "expires_on", label: "Valido fino al", type: "date" },
      { name: "chosen", label: "È il preventivo scelto", type: "checkbox" }
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
      { name: "title", label: "Momento", required: true, max: 120, placeholder: "Es. Cerimonia" },
      { name: "place", label: "Dove", max: 120 },
      { name: "owner", label: "Chi coordina", max: 120, placeholder: "Es. Fotografo" }
    ],
    internal_notes: [{ name: "body", label: "Nota", type: "textarea", required: true, max: 4000, wide: true }]
  };
  function guestFields(w) {
    return [
      { name: "name", label: "Nome e cognome", required: true, max: 120 },
      { name: "guest_group", label: "Gruppo", type: "select", options: GROUPS.map(function (g) { return [g, groupLabel(w, g)]; }) },
      { name: "household", label: "Nucleo familiare", max: 120, placeholder: "Es. Famiglia Russo" },
      { name: "rsvp", label: "Risposta", type: "select", options: opts(LABEL.rsvp) },
      { name: "menu", label: "Menù", type: "select", options: opts(LABEL.menu) },
      { name: "notes", label: "Note", max: 500, placeholder: "Es. arriva dopo la cerimonia" }
    ];
  }

  /* ------------------------------------------------------------ routing */
  function route() { return (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean); }
  function go(path) { if (location.hash !== "#/" + path) location.hash = "#/" + path; else render(); }
  var current = function () { var p = route(); return p[0] === "m" ? p[1] : null; };
  var wedding = function (id) { return state.weddings.filter(function (w) { return w.id === id; })[0]; };
  var isPlannerHere = function (w) { return state.me.role === "admin" || (w && w.my_role === "planner"); };
  window.addEventListener("hashchange", function () { state.navOpen = false; render(); });

  /* ------------------------------------------------------------ pezzi comuni */
  function brand(tone) { return h("a", { class: "brand" + (tone ? " " + tone : ""), href: "#/", "aria-label": "Nozze in Ordine, torna all'inizio" }, h("span", { class: "mono", "aria-hidden": "true" }, "N"), h("span", null, "Nozze in Ordine")); }
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
  function eyebrow() { return api.mode === "demo" ? h("p", { class: "eyebrow" }, "Anteprima · Dati di esempio") : null; }
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
  function weddingSections(w) {
    var items = [["panoramica", "Panoramica", "home"], ["scadenze", "Da fare", "todo"], ["budget", "Budget e pagamenti", "wallet"], ["fornitori", "Fornitori e preventivi", "briefcase"],
      ["invitati", "Invitati e tavoli", "users"], ["scaletta", "Programma del giorno", "calendar"], ["persone", "Collaboratori", "userplus"], ["impostazioni", "Dati del matrimonio", "file"]];
    if (isPlannerHere(w)) items.push(["note", "Note riservate", "note"]);
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
      if (open) { var a = sd && sd.querySelector("a, button, select"); if (a) a.focus(); } else toggle.focus();
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
      h("header", { class: "topbar" }, brand(tone), h("div", { class: "top-actions" }, toggle, bellLink("bell"))),
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
    return h("div", { class: "auth" }, h("div", { class: "auth-card" }, brand(tone || "ceramica"), card),
      h("figure", { class: "auth-pic" }, h("figcaption", null, "Chiostro di Santa Chiara, Napoli · foto Sailko, CC BY 3.0")));
  }
  function authScreen(kind) {
    var msg = h("p", { class: "form-msg", role: "status", "aria-live": "polite" });
    var say = function (t, bad) { msg.textContent = t; msg.className = "form-msg" + (bad ? " bad" : " good"); };
    var busy = function (f, on) { Array.prototype.forEach.call(f.querySelectorAll("button[type=submit]"), function (b) { b.disabled = on; }); };
    var card;
    if (kind === "registrati") {
      var roleOpt = function (v, t, checked) { return h("label", { class: "choice-card" }, h("input", { type: "radio", name: "role", value: v, checked: checked }), h("span", null, t)); };
      var f = h("form", { class: "auth-form", novalidate: true },
        h("fieldset", null, h("legend", null, "Chi sei?"), h("div", { class: "choices two" }, roleOpt("coppia", "Organizziamo il nostro matrimonio", true), roleOpt("planner", "Organizzo matrimoni per lavoro"))),
        field({ name: "full_name", label: "Nome e cognome", required: true, max: 120, autocomplete: "name", placeholder: "Ad esempio: Anna Russo" }),
        field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email", placeholder: "nome@esempio.it" }),
        passwordField("password", "Password", "new-password", "Almeno 8 caratteri."),
        h("label", { class: "check" }, h("input", { type: "checkbox", name: "privacy", required: true }), h("span", null, "Ho letto l'", h("a", { href: "../privacy.html", target: "_blank", rel: "noopener" }, "informativa privacy"), ".")),
        h("button", { class: "btn primary block", type: "submit" }, "Crea l'account"), msg);
      f.addEventListener("submit", async function (e) {
        e.preventDefault();
        var d = { full_name: f.elements.full_name.value.trim(), email: f.elements.email.value.trim(), password: f.elements.password.value, role: f.elements.role.value };
        if (!d.full_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return say("Controlla nome ed email: l'indirizzo sembra incompleto.", true);
        if (d.password.length < 8) return say("La password deve avere almeno 8 caratteri.", true);
        if (!f.elements.privacy.checked) return say("Spunta la casella dell'informativa privacy.", true);
        busy(f, true);
        try { var r = await api.signUp(d); say(r.needsConfirmation ? "Fatto. Ti abbiamo mandato un'email: apri il link per confermare l'indirizzo, poi accedi. Al primo accesso configuri il tuo spazio." : "Account creato.", false); }
        catch (err) { say(err.message, true); }
        busy(f, false);
      });
      card = [h("h1", null, "Crea il tuo spazio"), h("p", { class: "sub" }, "Dopo l'accesso configuri il tuo spazio: il vostro matrimonio o la tua attività di planner."), f,
        h("p", { class: "alt-link" }, "Hai già un account? ", h("a", { href: "#/accedi" }, "Accedi"))];
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
        h("p", { class: "alt-row" }, h("span", null, "Non hai un account?"), h("a", { href: "#/registrati" }, "Registrati"))];
    }
    card.push(h("p", { class: "alt-link demo-link" }, "Vuoi solo guardare? ", h("a", { href: "demo.html" }, "Apri la demo con dati di esempio")));
    return authLayout(card);
  }

  function demoChooser() {
    var pick = function (role) { return async function () { await api.demoSignIn(role); }; };
    var card = function (title, sub, tag, demo, focus, foot, role, primary) {
      return h("article", { class: "demo-card" + (primary ? " on" : "") }, h("header", null, h("div", null, h("h2", null, title), h("p", null, sub)), badge(tag, primary ? "solid" : "")),
        h("div", { class: "demo-facts" }, h("div", null, h("b", null, "Demo"), h("span", null, demo)), h("div", null, h("b", null, "Focus"), h("span", null, focus))),
        h("footer", null, h("span", null, foot), h("button", { class: "btn " + (primary ? "primary" : "ghost"), type: "button", onclick: pick(role) }, "Apri demo " + (role === "coppia" ? "coppia" : role === "planner" ? "planner" : "amministrazione"), icon("arrow"))));
    };
    return h("div", { class: "chooser" }, h("header", { class: "chooser-top" }, brand("ceramica"), badge("Anteprima · Dati di esempio", "")),
      h("div", { class: "chooser-in" }, h("div", { class: "chooser-text" }, h("h1", null, "Scegli la demo"), h("p", null, "Esplora il prodotto con dati di esempio, dal punto di vista di una coppia o di un wedding planner."), h("a", { href: "index.html" }, "Torna all'accesso")),
        h("div", { class: "chooser-cards" }, h("p", { class: "eyebrow" }, "Seleziona il punto di vista"), h("p", { class: "sub" }, "Scegli l'esperienza che vuoi esplorare."),
          card("Organizziamo il nostro matrimonio", "La vista ideale per chi pianifica la propria cerimonia e il ricevimento.", "Coppia", "Anna e Marco · matrimonio a Caserta", "priorità, budget, invitati e tavoli", "Anna e Marco · Caserta", "coppia", true),
          card("Organizzo matrimoni per lavoro", "La vista ideale per wedding planner che seguono più eventi.", "Planner", "Beatrice · tre matrimoni in corso", "clienti, fornitori, preventivi e coordinamento", "Beatrice · Wedding planner", "planner"),
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
          input("city", "Area di lavoro", { ph: "Es. Campania", help: "Regione o città principali." }), input("weddings_per_year", "Matrimoni seguiti in un anno", { select: opts(LABEL.perYear), help: "Una fascia indicativa, modificabile in seguito." })),
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
    var toggle = h("button", { type: "button", class: "ic-circle tgl " + (t.done ? "ok" : late ? "terra" : ""), "aria-pressed": String(!!t.done), "aria-label": (t.done ? "Riapri: " : "Segna come completata: ") + t.title,
      onclick: async function () { await attempt(function () { return api.update("tasks", t.id, { done: !t.done }); }, t.done ? "Attività riaperta." : "Attività completata."); await refreshAlerts(); render(); } }, icon(t.done ? "check" : "calendar"));
    var meta = opts.meta || [t.due_date ? (opts.rel ? whenText(t.due_date) : fmtDate(t.due_date)) : "senza scadenza", opts.wedding ? opts.wedding : LABEL.assignee[t.assignee]].join(" · ");
    return rowItem({ lead: opts.noToggle ? h("span", { class: "ic-circle " + (late ? "terra" : "") }, icon("calendar")) : toggle, title: t.title, meta: meta, cls: t.done ? "done" : null,
      side: [badge(st[0], st[1]), opts.actions ? h("span", { class: "row-actions" },
        mini("Modifica", function () { editDialog("Modifica attività", F.tasks, Object.assign({}, t, { phase: String(t.phase) }), "Salva", function (d) { d.phase = Number(d.phase); return api.update("tasks", t.id, d); }, "Salvato."); }),
        mini("Elimina", async function () { if (!await confirmBox("Eliminare l'attività?", "«" + t.title + "» verrà tolta dalla lista.", "Elimina")) return; await attempt(function () { return api.remove("tasks", t.id); }, "Eliminata."); render(); }, "danger")) : null] });
  }
  function lateSummary(open, tasks, href) {
    var late = open.filter(function (x) { return x.due_date && x.due_date < todayIso(); });
    if (!late.length) return null;
    return rowItem({ icon: "clock", tone: "terra-solid", title: late.length === 1 ? "1 attività è in ritardo" : late.length + " attività sono in ritardo", meta: (tasks.length - open.length) + " completate su " + tasks.length + " · " + late.length + " in ritardo", side: h("a", { class: "badge late", href: href }, late.length + " in ritardo") });
  }
  function payList(bud, rel) {
    var pays = bud.filter(function (b) { return b.due_date && cost(b) > num(b.paid); }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; }).slice(0, 4);
    return pays.length ? h("ul", { class: "plain-list" }, pays.map(function (b) {
      return h("li", null, h("span", { class: "ic-circle soft" }, icon(payIcon(b.category))), h("div", null, h("b", null, b.category), h("small", null, eur(cost(b) - num(b.paid)) + " · " + (rel ? whenText(b.due_date) : fmtDate(b.due_date)))));
    })) : h("p", { class: "muted" }, "Nessun pagamento con una data. Aggiungila nelle voci del budget.");
  }

  async function overview(w) {
    var planner = isPlannerHere(w);
    var res = await Promise.all([api.list("budget_items", w.id), api.list("guests", w.id), api.list("tasks", w.id), api.list("vendors", w.id), planner ? api.list("internal_notes", w.id) : Promise.resolve([])]);
    var bud = res[0], guests = res[1], tasks = res[2], vendors = res[3], notes = res[4];
    var t = budgetTotals(bud), n = daysTo(w.wedding_date), g = guestCounts(guests), cap = num(w.budget_total);
    var open = tasks.filter(function (x) { return !x.done; }), nx = nextTask(tasks);
    // Il primo giorno: niente invitati e niente spese, la pagina indica da dove cominciare
    if (!guests.length && !bud.length && !vendors.length) return firstDay(w, tasks);
    var focus = open.filter(function (x) { return x.due_date; }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; }).slice(0, planner ? 6 : 3);
    var tasksPanel = panel("Cosa devo fare adesso?", "Le attività più importanti da completare subito.", more("#/m/" + w.id + "/scadenze", "Vedi tutte"),
      h("ul", { class: "rows" }, lateSummary(open, tasks, "#/m/" + w.id + "/scadenze"), focus.map(function (x) { return taskRow(x, w, nx && nx.id, { rel: true }); }),
        !focus.length ? h("li", { class: "muted" }, open.length ? "Le attività aperte non hanno una data." : "Tutto fatto. Complimenti.") : null));
    var payPanel = panel("Prossimi pagamenti", null, more("#/m/" + w.id + "/budget", "Vedi tutti"), payList(bud, planner), "compact");
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
        panel("Organizzate insieme", null, null, h("div", null, h("p", { class: "muted" }, "Invitate il partner o una planner a collaborare. Questi accessi sono separati dalla lista degli ospiti."),
          linkBtn("#/m/" + w.id + "/persone", "Invita un collaboratore", "ghost"))))];
  }

  /* ------------------------------------------------------------ da fare */
  async function tasksView(w) {
    var tasks = await api.list("tasks", w.id);
    var filter = store.get("nio-tf") || "open";
    var open = tasks.filter(function (t) { return !t.done; }), doneN = tasks.length - open.length;
    var late = open.filter(function (t) { return t.due_date && t.due_date < todayIso(); }), nx = nextTask(tasks);
    var addBtn = more("#", "Aggiungi attività"); addBtn.onclick = function (e) {
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
        shown.length ? h("ul", { class: "rows" }, shown.slice(pg.from, pg.to).map(function (t) { return taskRow(t, w, nx && nx.id, { actions: true }); }))
          : h("p", { class: "muted pad" }, filter === "open" ? "Niente da fare: tutto completato." : "Nessuna attività."), pg.el])];
  }

  /* ------------------------------------------------------------ budget */
  async function budgetView(w) {
    var items = await api.list("budget_items", w.id), t = budgetTotals(items), cap = num(w.budget_total);
    var addFn = function () { editDialog("Nuova voce di spesa", F.budget_items, { category: CATS[0] }, "Aggiungi", function (d) { d.wedding_id = w.id; return api.insert("budget_items", d); }, "Voce aggiunta."); };
    var left = t.total - t.paid;
    var head = pageHead("Budget e pagamenti", "Quanto spenderete in tutto, quanto avete già pagato e come si divide la spesa.", null, chipInfo(weddingMeta(w)));
    var k = kpis([kpi("Costo previsto", eur(t.total), "Somma di " + plural(items.length, "voce", "voci")), kpi("Già pagato", eur(t.paid), "Acconti e pagamenti registrati"), kpi("Da pagare", eur(left), "Importi ancora da versare"),
      kpi("Budget massimo", cap ? eur(cap) : "Da definire", cap ? (t.total > cap ? "Sopra il tetto di " + eur(t.total - cap) : "Margine disponibile " + eur(cap - t.total)) : h("a", { href: "#/m/" + w.id + "/impostazioni" }, "Imposta il tetto di spesa"), "", cap && t.total > cap ? "terra" : "")], "four");
    if (!items.length) {
      return [head, k, panel("Tutte le voci", null, btn("Aggiungi voce", addFn, "primary sm", "plus"), empty("Ancora nessuna voce di spesa", "Potete partire dalle voci tipiche di un matrimonio, viaggio di nozze compreso, e poi scrivere le cifre.",
        btn("Parti dalle voci tipiche", async function () {
          await attempt(async function () { for (var i = 0; i < CATS.length; i++) await api.insert("budget_items", { wedding_id: w.id, category: CATS[i] }); }, "Voci aggiunte: ora scrivete i costi.");
          render();
        }, "ghost"), "wallet"))];
    }
    var sorted = items.slice().sort(function (a, b) { return cost(b) - cost(a); });
    var table = h("div", { class: "tscroll" }, h("table", { class: "tbl" },
      h("caption", { class: "sr" }, "Voci di spesa"),
      h("thead", null, h("tr", null, ["Voce", "Costo", "Già pagato", "Da pagare", "Prossimo pagamento", "Azioni"].map(function (x, i) { return h("th", { scope: "col", class: i >= 1 && i <= 3 ? "n" : null }, x); }))),
      h("tbody", null, sorted.map(function (b) {
        var c = cost(b), pct = t.total ? Math.round(c / t.total * 100) : 0;
        return h("tr", null, h("th", { scope: "row" }, h("b", null, b.category), h("small", null, [b.description, num(b.contracted) > 0 ? "contratto" : c ? "stima" : "costo da scrivere", pct ? pct + "% del totale" : null].filter(Boolean).join(" · "))),
          h("td", { class: "n" }, eur(c)), h("td", { class: "n" }, eur(b.paid)), h("td", { class: "n" }, eur(Math.max(0, c - num(b.paid)))), h("td", null, b.due_date ? fmtDate(b.due_date) : "—"),
          h("td", null, h("span", { class: "row-actions" },
            mini("Modifica", function () { editDialog("Modifica voce", F.budget_items, b, "Salva", function (d) { return api.update("budget_items", b.id, d); }, "Salvato."); }),
            mini("Elimina", async function () { if (!await confirmBox("Eliminare la voce?", "«" + b.category + "» verrà tolta dal budget.", "Elimina la spesa")) return; await attempt(function () { return api.remove("budget_items", b.id); }, "Eliminata."); render(); }, "danger"))));
      })),
      h("tfoot", null, h("tr", null, h("th", { scope: "row" }, "Totale"), h("td", { class: "n" }, eur(t.total)), h("td", { class: "n" }, eur(t.paid)), h("td", { class: "n" }, eur(left)), h("td", null, "—"), h("td", null)))));
    return [head, k, h("section", { class: "panel" }, h("div", { class: "panel-head" }, h("div", null, btn("Aggiungi voce", addFn, "primary sm", "plus"), h("h2", { class: "serif" }, "Tutte le voci"))), table,
      h("p", { class: "muted small pad-t" }, "Totale previsto " + eur(t.total) + " · Pagato " + eur(t.paid) + " · Da pagare " + eur(left) + (cap ? " · " + (t.total > cap ? "Sopra il budget di " + eur(t.total - cap) : "Margine sul budget " + eur(cap - t.total)) : "") + ". Una stima viene sostituita dall'importo firmato solo quando confermi il contratto."))];
  }

  /* ------------------------------------------------------------ fornitori e preventivi */
  async function vendorsView(w) {
    var res = await Promise.all([api.list("vendors", w.id), api.list("quotes", w.id)]);
    var vendors = res[0], quotes = res[1], guestsN = num(w.guests_expected);
    var add = btn("Aggiungi fornitore", function () { editDialog("Nuovo fornitore", F.vendors, { status: "da_scegliere" }, "Aggiungi", function (d) { d.wedding_id = w.id; return api.insert("vendors", d); }, "Fornitore aggiunto."); }, "primary", "plus");
    var list = vendors.map(function (v) {
      var qs = quotes.filter(function (q) { return q.vendor_id === v.id; });
      var total = function (q) { return q.per_person ? num(q.amount) * guestsN : num(q.amount); };
      var statusSel = h("label", { class: "status-pill" }, h("span", { class: "sr" }, "Stato di " + v.name),
        h("select", { onchange: async function (e) { await attempt(function () { return api.update("vendors", v.id, { status: e.target.value }); }, "Stato aggiornato."); } },
          opts(LABEL.vendor).map(function (o) { return h("option", { value: o[0], selected: v.status === o[0] }, o[1]); })));
      return h("article", { class: "panel vendor" },
        h("header", { class: "vendor-head" }, h("div", null, h("p", { class: "small" }, v.category), h("h2", { class: "serif" }, v.name), v.contact ? h("p", null, v.contact) : null, v.notes ? h("p", { class: "muted" }, v.notes) : null),
          h("div", { class: "vendor-side" }, statusSel, h("span", { class: "row-actions" },
            mini("Modifica", function () { editDialog("Modifica fornitore", F.vendors, v, "Salva", function (d) { return api.update("vendors", v.id, d); }, "Salvato."); }),
            mini("Elimina", async function () { if (!await confirmBox("Eliminare il fornitore?", "Verranno eliminati anche i suoi preventivi.", "Elimina")) return; await attempt(function () { return api.remove("vendors", v.id); }, "Eliminato."); render(); }, "danger")))),
        qs.map(function (q) {
          return h("div", { class: "quote" + (q.chosen ? " pick" : "") },
            h("div", { class: "quote-main" }, h("p", { class: "quote-l" }, q.label, q.chosen ? badge("Scelto", "ok") : null),
              h("p", { class: "quote-v" }, eur(q.amount), q.per_person ? h("small", null, " a persona") : null),
              q.includes ? h("p", null, q.includes) : null,
              q.expires_on ? h("p", { class: daysTo(q.expires_on) < 0 ? "warn" : "muted" }, (daysTo(q.expires_on) < 0 ? "Scaduto il " : "Valido fino al ") + fmtDate(q.expires_on)) : null),
            h("div", { class: "quote-side" }, q.per_person && guestsN ? [h("b", null, eur(total(q))), h("small", null, guestsN + " invitati")] : null),
            h("p", { class: "quote-actions" },
              q.chosen ? null : mini("Scegli", async function () {
                await attempt(async function () {
                  for (var i = 0; i < qs.length; i++) if (qs[i].chosen) await api.update("quotes", qs[i].id, { chosen: false });
                  await api.update("quotes", q.id, { chosen: true });
                }, "Preventivo scelto."); render();
              }, "strong"),
              h("span", { class: "row-actions" }, mini("Modifica", function () { editDialog("Modifica preventivo", F.quotes, q, "Salva", function (d) { return api.update("quotes", q.id, d); }, "Salvato."); }),
                mini("Elimina", async function () { if (!await confirmBox("Eliminare il preventivo?", "«" + q.label + "» verrà eliminato.", "Elimina")) return; await attempt(function () { return api.remove("quotes", q.id); }, "Eliminato."); render(); }, "danger"))));
        }),
        h("button", { class: "add-row", type: "button", onclick: function () {
          editDialog("Nuovo preventivo per " + v.name, F.quotes, null, "Aggiungi", function (d) { d.wedding_id = w.id; d.vendor_id = v.id; return api.insert("quotes", d); }, "Preventivo aggiunto.");
        } }, "+ Aggiungi un preventivo"));
    });
    return [pageHead("Fornitori e preventivi", "Confronta i preventivi, scegli un'opzione e aggiorna il budget quando il contratto è firmato." + (guestsN ? " I prezzi a persona sono calcolati su " + guestsN + " invitati previsti." : ""), add),
      vendors.length ? h("div", { class: "stack" }, list) : empty("Ancora nessun fornitore", "Aggiungete il primo e allegate i preventivi che ricevete.", add, "briefcase")];
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
  async function tableEditDialog(t, save) {
    return formDialog(t ? "Modifica " + t.name : "Nuovo tavolo", F.tables, t ? Object.assign({}, t, { seats: String(t.seats) }) : { seats: "10" }, t ? "Salva" : "Aggiungi", function (d) { d.seats = Number(d.seats); return save(d); });
  }

  async function guestsView(w) {
    var res = await Promise.all([api.list("guests", w.id), api.list("seating_tables", w.id)]);
    var guests = res[0], tables = res[1];
    var byId = {}; tables.forEach(function (t) { byId[t.id] = t; });
    var g = guestCounts(guests), menus = {};
    guests.forEach(function (x) { if (x.rsvp === "si") menus[x.menu] = (menus[x.menu] || 0) + 1; });
    var coming = guests.filter(function (x) { return x.rsvp !== "no"; }), waiting = coming.filter(function (x) { return !x.table_id; }), seated = guests.filter(function (x) { return x.table_id; });
    var seatsTotal = tables.reduce(function (a, t) { return a + t.seats; }, 0);
    var at = function (t, n) { return guests.filter(function (x) { return x.table_id === t.id && x.seat_number === n; })[0]; };
    var addGuest = btn("Aggiungi invitato", function () {
      editDialog("Nuovo invitato", guestFields(w), { guest_group: store.get("nio-group") || "amici_comuni", rsvp: "in_attesa", menu: "standard" }, "Aggiungi", function (d) { d.wedding_id = w.id; return api.insert("guests", d); }, "Invitato aggiunto.");
    }, "primary", "plus");
    var addTable = btn("Aggiungi tavolo", function () {
      tableEditDialog(null, function (d) { var pos = freeSpot(tables); d.pos_x = pos[0]; d.pos_y = pos[1]; d.wedding_id = w.id; return api.insert("seating_tables", d); }).then(function (d) { if (d) { toast("Tavolo aggiunto alla sala."); render(); } });
    }, "soft", "table");
    function csv() {
      var rows = [["Nome", "Gruppo", "Nucleo", "Risposta", "Menù", "Tavolo", "Posto", "Note"]].concat(guests.map(function (x) { return [x.name, groupLabel(w, x.guest_group), x.household, LABEL.rsvp[x.rsvp], LABEL.menu[x.menu], byId[x.table_id] ? byId[x.table_id].name : "", x.seat_number || "", x.notes]; }));
      download("invitati-" + w.title.replace(/\W+/g, "-").toLowerCase() + ".csv", rows);
    }
    var pct = guests.length ? (g.si / guests.length * 100).toFixed(1).replace(".", ",") + "% del totale" : null;
    var stats = kpis([
      kpi("Totale invitati", String(guests.length), w.guests_expected ? "obiettivo " + w.guests_expected + " · è una stima" : "persone registrate"),
      kpi("Vengono", String(g.si), pct, "", "olive"), kpi("In attesa", String(g.in_attesa), "risposta pendente"), kpi("Non vengono", String(g.no), "declinato", "", "terra"),
      kpi("Ai tavoli", seated.length + " su " + coming.length, "chi viene o non ha ancora risposto", "solid"),
      kpi("Posti liberi", String(seatsTotal - seated.length), "su " + seatsTotal + " totali" + (waiting.length > seatsTotal - seated.length ? " · ne mancano " + (waiting.length - (seatsTotal - seated.length)) : ""))], "six");
    var menuLine = Object.keys(menus).length ? h("p", { class: "muted small" }, "Menù confermati: " + Object.keys(menus).map(function (k) { return LABEL.menu[k].toLowerCase() + " " + menus[k]; }).join(" · ") + ".") : null;
    var jump = h("nav", { class: "seg jump", "aria-label": "Vai a" }, h("a", { href: "#sala", onclick: function (e) { e.preventDefault(); document.getElementById("sala").scrollIntoView({ behavior: "smooth" }); } }, "La sala"),
      h("a", { href: "#elenco", onclick: function (e) { e.preventDefault(); document.getElementById("elenco").scrollIntoView({ behavior: "smooth" }); } }, "Elenco invitati"),
      tables.length ? h("a", { href: "#per-tavolo", onclick: function (e) { e.preventDefault(); document.getElementById("per-tavolo").scrollIntoView({ behavior: "smooth" }); } }, "Tavolo per tavolo") : null);

    /* ---- la sala: si trascinano i tavoli, si tocca un posto per assegnarlo (struttura invariata) ---- */
    var legend = h("p", { class: "legend-line" }, GROUPS.map(function (k) { return h("span", { class: "leg" }, h("span", { class: "swatch gt-" + k, "aria-hidden": "true" }), groupLabel(w, k)); }),
      h("span", { class: "leg" }, h("span", { class: "swatch free", "aria-hidden": "true" }), "Posto libero"));
    var zoom = Number(store.get("nio-zoom")) || 0;
    var wrap = h("div", { class: "hall-wrap", role: "region", "aria-label": "Pianta della sala" });
    var hall = h("div", { class: "hall", style: "width:" + HALL_W + "px;height:" + HALL_H + "px" });
    tables.forEach(function (t) {
      var geo = tableGeometry(t), filled = guests.filter(function (x) { return x.table_id === t.id; }).length;
      var el = h("div", { class: "table-el", style: "left:" + (t.pos_x / 100 * HALL_W) + "px;top:" + (t.pos_y / 100 * HALL_H) + "px" });
      var core = h("button", { type: "button", class: "table-core " + (t.shape === "rettangolare" ? "rect" : "round") + (filled >= t.seats ? " full" : ""), style: "width:" + geo.w + "px;height:" + geo.h + "px",
        "aria-label": t.name + ", " + filled + " su " + t.seats + " posti. Trascina per spostare, invio per modificare." },
        h("b", null, t.name), h("span", null, filled + "/" + t.seats));
      el.append(core);
      geo.seats.forEach(function (s, i) {
        var n = i + 1, x = at(t, n);
        el.append(h("button", { type: "button", class: "seat " + (x ? "gt-" + x.guest_group : "free"), style: "left:" + s.x + "px;top:" + s.y + "px",
          "aria-label": "Posto " + n + ": " + (x ? x.name : "libero"), onclick: function () { seatDialog(w, t, n, guests, tables); } }, String(n)));
        if (x) el.append(h("span", { class: "seat-name a-" + s.align, style: "left:" + (s.x + s.lx) + "px;top:" + (s.y + s.ly) + "px" }, shortName(x)));
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
    function editTable(t) { tableEditDialog(t, function (d) { return api.update("seating_tables", t.id, d); }).then(function (d) { if (d) { toast("Tavolo aggiornato."); render(); } }); }

    var waitingPanel = h("aside", { class: "panel waiting", "aria-labelledby": "ds-h" }, h("header", { class: "panel-head" }, h("div", null, h("h2", { id: "ds-h" }, "Da sistemare ", count(waiting.length, "bord")), h("p", { class: "sub" }, "Ospiti confermati o in attesa senza posto assegnato. Toccate un nome per scegliere il posto."))),
      waiting.length ? GROUPS.map(function (k) {
        var rows = waiting.filter(function (x) { return x.guest_group === k; });
        return rows.length ? h("div", { class: "wait-group" }, h("p", { class: "lbl" }, h("span", { class: "swatch gt-" + k, "aria-hidden": "true" }), groupLabel(w, k) + " · " + rows.length),
          h("div", { class: "chips-btn" }, rows.map(function (x) { return h("button", { type: "button", class: "guest-chip", onclick: function () { placeGuestDialog(w, x, tables, guests); } }, x.name, x.rsvp === "in_attesa" ? h("span", { class: "q", "aria-label": "in attesa di risposta" }, "?") : null); }))) : null;
      }) : h("p", { class: "muted" }, guests.length ? "Tutti hanno un posto." : "Aggiungete gli invitati: chi viene comparirà qui finché non ha un posto."));

    var sala = h("section", { class: "sala", id: "sala", "aria-labelledby": "sala-h" },
      h("div", { class: "sala-main" }, h("div", { class: "sala-tools" }, h("h2", { id: "sala-h", class: "serif" }, "La sala"), tables.length ? zoomBar : null), legend,
        h("div", { class: "hall-frame" }, wrap,
          h("p", { class: "hall-note" }, icon("info"), tables.length ? "Trascinate i tavoli per disporre la sala. Toccate un posto per scegliere chi ci siede: i posti di chi è in attesa sono provvisori finché non conferma." : "Disegnate la sala: tavoli da 8 a 12 posti, con il loro nome."))),
      waitingPanel);

    /* ---- elenco invitati: ricerca, filtri e pagine, raggruppato per gruppo ---- */
    var q = (store.get("nio-q") || "").toLowerCase(), gf = store.get("nio-group") || "", rf = store.get("nio-rsvp") || "";
    var shown = guests.filter(function (x) { return (!rf || x.rsvp === rf) && (!gf || x.guest_group === gf) && (!q || (x.name + " " + x.household).toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { return GROUPS.indexOf(a.guest_group) - GROUPS.indexOf(b.guest_group) || (a.household + a.name).localeCompare(b.household + b.name); });
    var pg = pager(shown.length, 15, "nio-gp", "invitati");
    var resetPage = function () { store.set("nio-gp", "1"); };
    var tools = h("div", { class: "tools" },
      h("label", { class: "search" }, icon("search"), h("span", { class: "sr" }, "Cerca"), h("input", { type: "search", placeholder: "Cerca per nome o nucleo…", value: store.get("nio-q") || "",
        oninput: function (e) { store.set("nio-q", e.target.value); resetPage(); clearTimeout(window.__nioQ); window.__nioQ = setTimeout(function () { render().then(function () { var i = document.querySelector(".tools input[type=search]"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); } })),
      h("label", null, h("span", { class: "sr" }, "Gruppo"), h("select", { onchange: function (e) { store.set("nio-group", e.target.value); resetPage(); render(); } }, h("option", { value: "" }, "Tutti i gruppi"), GROUPS.map(function (k) { return h("option", { value: k, selected: gf === k }, groupLabel(w, k)); }))),
      h("label", null, h("span", { class: "sr" }, "Risposta"), h("select", { onchange: function (e) { store.set("nio-rsvp", e.target.value); resetPage(); render(); } }, h("option", { value: "" }, "Tutte le risposte"), opts(LABEL.rsvp).map(function (o) { return h("option", { value: o[0], selected: rf === o[0] }, o[1]); }))));
    var rows = [], lastGroup = null, page = shown.slice(pg.from, pg.to);
    page.forEach(function (x) {
      if (x.guest_group !== lastGroup) {
        lastGroup = x.guest_group;
        rows.push(h("tr", { class: "group-row" }, h("th", { colspan: "6", scope: "rowgroup" }, h("span", { class: "dot gt-" + x.guest_group, "aria-hidden": "true" }), groupLabel(w, x.guest_group), count(guests.filter(function (y) { return y.guest_group === x.guest_group; }).length))));
      }
      var t = byId[x.table_id];
      rows.push(h("tr", null, h("th", { scope: "row" }, h("b", null, x.name), x.notes ? h("small", null, x.notes) : null), h("td", null, x.household || "—"), h("td", null, LABEL.menu[x.menu].toLowerCase()),
        h("td", null, t ? t.name + ", posto " + x.seat_number : x.rsvp === "no" ? "—" : h("button", { class: "linkish", type: "button", onclick: function () { placeGuestDialog(w, x, tables, guests); } }, "Assegna")),
        h("td", null, h("label", { class: "rsvp-pick " + x.rsvp }, h("span", { class: "sr" }, "Risposta di " + x.name), h("select", { onchange: async function (e) {
          var v = e.target.value, patch = { rsvp: v };
          if (v === "no" && x.table_id) patch = { rsvp: v, table_id: null, seat_number: null };
          await attempt(function () { return api.update("guests", x.id, patch); }, v === "no" && x.table_id ? "Risposta aggiornata: il suo posto al tavolo è di nuovo libero." : "Risposta aggiornata."); render();
        } }, opts(LABEL.rsvp).map(function (o) { return h("option", { value: o[0], selected: x.rsvp === o[0] }, o[1]); })))),
        h("td", null, h("span", { class: "row-actions" },
          mini("Modifica", function () { editDialog("Modifica invitato", guestFields(w), x, "Salva", function (d) { return api.update("guests", x.id, d); }, "Salvato."); }),
          mini("Elimina", async function () { if (!await confirmBox("Eliminare l'invitato?", x.name + " verrà tolto dalla lista e dal suo tavolo.", "Elimina")) return; await attempt(function () { return api.remove("guests", x.id); }, "Eliminato."); render(); }, "danger")))));
    });
    var elenco = h("section", { class: "panel flush", id: "elenco", "aria-labelledby": "el-h" }, h("header", { class: "panel-head pad" }, h("div", null, h("h2", { id: "el-h", class: "serif" }, "Elenco invitati"), menuLine)), h("div", { class: "pad-x" }, tools),
      guests.length ? (shown.length ? h("div", { class: "tscroll" }, h("table", { class: "tbl guests" }, h("caption", { class: "sr" }, "Invitati"),
        h("thead", null, h("tr", null, ["Nominativo", "Nucleo", "Menù", "Tavolo", "Risposta", "Azioni"].map(function (x) { return h("th", { scope: "col" }, x); }))), h("tbody", null, rows))) : h("p", { class: "muted pad" }, "Nessun invitato con questi filtri."))
        : empty("La lista comincia da voi", "Nessun invitato registrato. Aggiungi una persona per iniziare; il numero previsto resta una stima separata.", addGuest, "users"),
      pg.el ? h("div", { class: "pad-x" }, pg.el) : null);

    /* ---- tavolo per tavolo: lo stesso contenuto della pianta, leggibile anche da telefono ---- */
    var cards = tables.length ? h("section", { class: "per-tavolo", id: "per-tavolo", "aria-labelledby": "pt-h" }, h("h2", { id: "pt-h", class: "serif" }, "Tavolo per tavolo"),
      h("div", { class: "table-cards" }, tables.map(function (t) {
        var list = [], filled = guests.filter(function (x) { return x.table_id === t.id; }).length;
        for (var n = 1; n <= t.seats; n++) (function (n) {
          var x = at(t, n);
          list.push(h("li", null, h("button", { type: "button", class: "seat-row", onclick: function () { seatDialog(w, t, n, guests, tables); } },
            h("span", { class: "seat-no " + (x ? "gt-" + x.guest_group : "free") }, String(n)),
            x ? h("span", null, x.name, h("small", null, groupLabel(w, x.guest_group))) : h("span", { class: "muted" }, "Posto libero"))));
        })(n);
        return h("article", { class: "table-card" },
          h("header", null, h("div", null, h("h3", null, t.name), h("p", { class: "muted small" }, (t.shape === "rettangolare" ? "Rettangolare" : "Rotondo") + " · " + filled + " su " + t.seats + " posti")),
            filled >= t.seats ? badge("Completo", "ok") : badge((t.seats - filled) + (t.seats - filled === 1 ? " libero" : " liberi"), "wait")),
          h("ol", { class: "seat-list" }, list),
          h("p", { class: "row-actions" }, mini("Modifica", function () { editTable(t); }),
            mini("Elimina", async function () {
              if (!await confirmBox("Eliminare " + t.name + "?", filled ? "Le " + filled + " persone sedute torneranno tra quelle da sistemare." : "Il tavolo verrà tolto dalla sala.", "Elimina")) return;
              await attempt(function () { return api.remove("seating_tables", t.id); }, "Tavolo eliminato."); render();
            }, "danger")));
      }))) : null;

    return [pageHead("Invitati e tavoli", g.si + " vengono · " + g.in_attesa + " in attesa · " + g.no + " non vengono" + (w.guests_expected ? " · obiettivo " + w.guests_expected : ""),
        [guests.length ? btn("Esporta CSV", csv, "ghost") : null, addTable, addGuest]),
      stats, jump, sala, elenco, cards];
  }

  /* ------------------------------------------------------------ programma del giorno */
  async function timelineView(w) {
    var items = await api.list("timeline_items", w.id);
    var add = btn("Aggiungi momento", function () { editDialog("Nuovo momento", F.timeline_items, null, "Aggiungi", function (d) { d.wedding_id = w.id; return api.insert("timeline_items", d); }, "Aggiunto."); }, "primary", "plus");
    return [pageHead("Programma del giorno", "Tutti i momenti della giornata in un unico sguardo: orari, luoghi, responsabili e azioni.", null, chipInfo(weddingMeta(w))),
      panel(plural(items.length, "momento pianificato", "momenti pianificati"), "Orari, luoghi e responsabili" + (w.wedding_date ? " per il " + fmtDate(w.wedding_date, true) : ""), h("div", { class: "btn-row" }, items.length ? btn("Stampa", function () { window.print(); }, "soft", "printer") : null, add),
        items.length ? h("ol", { class: "rows timeline" }, items.map(function (x) {
          return h("li", { class: "row tl" }, h("b", { class: "time" }, String(x.start_time).slice(0, 5)), h("div", { class: "row-main" }, h("b", null, x.title)),
            h("div", { class: "tl-col" }, h("small", null, "Dove"), h("span", null, x.place || "—")), h("div", { class: "tl-col" }, h("small", null, "Chi coordina"), h("span", null, x.owner || "—")),
            h("div", { class: "row-side" }, mini("Modifica", function () { editDialog("Modifica momento", F.timeline_items, x, "Salva", function (d) { return api.update("timeline_items", x.id, d); }, "Salvato."); }, "pill"),
              mini("Elimina", async function () { if (!await confirmBox("Eliminare il momento?", "«" + x.title + "» verrà tolto dal programma.", "Elimina")) return; await attempt(function () { return api.remove("timeline_items", x.id); }, "Eliminato."); render(); }, "pill danger")));
        })) : empty("Il programma è ancora vuoto", "Aggiungete i momenti principali: arrivo, rito, foto, aperitivo, cena.", null, "calendar"))];
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
    var msg = "Ciao! Ti ho invitato a organizzare «" + w.title + "» su Nozze in Ordine. Apri " + link + " e accedi con questa stessa email: troverai l'invito appena entri.";
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
    var form = h("form", { class: "grid-form" }, F.wedding.map(function (f) { return field(f, w[f.name] == null ? "" : w[f.name]); }), pri,
      h("div", { class: "form-end wide" }, h("button", { class: "btn primary", type: "submit" }, "Salva le modifiche"), h("small", null, "I campi facoltativi possono essere lasciati vuoti.")));
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
    var canDelete = state.me.role === "admin" || w.created_by === state.me.id;
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
      if (!b.due_date || !mine[b.wedding_id]) return;
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
        h("div", { class: "stack" }, role === "admin" ? roleCard : null,
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
      h("div", { class: "events" }, cards)];
  }

  /* ------------------------------------------------------------ amministrazione */
  async function adminView(sub) {
    var res = await Promise.all([api.listProfiles(), api.listWaitlist()]);
    var profiles = res[0], wait = res[1], ws = state.weddings;
    var count2 = function (r) { return profiles.filter(function (p) { return p.role === r; }).length; };
    var tabs = h("nav", { class: "seg pills", "aria-label": "Sezioni di amministrazione" }, [["", "Riepilogo"], ["utenti", "Utenti e ruoli"], ["lista", "Lista d'attesa"]].map(function (t) {
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
    zona: { caserta: "Caserta", napoli: "Napoli", salerno: "Salerno", avellino: "Avellino", benevento: "Benevento", altra: "Altra regione" },
    planner: { si: "ha una planner", cerchiamo: "cerca una planner", no: "senza planner" },
    prezzo49: { si: "Sì a 49 €", forse: "Forse a 49 €", no: "No a 49 €" },
    pilota: { si: "vuole il pilota", info: "vuole saperne di più", aggiornamenti: "solo aggiornamenti" }
  };
  function wlWhen(d) {
    if (!d.anno) return null;
    if (d.anno === "nd") return "Data da decidere";
    return (d.mese && d.mese !== "nd" ? MONTHS[+d.mese - 1] + " " : "") + (d.anno === "2029" ? "2029 o dopo" : d.anno);
  }
  function wlSummary(x) {
    var d = x.dati || {}, list = function (v) { return Array.isArray(v) ? v.join(", ") : v; };
    if (x.profilo === "planner") return [d.studio, WL.zona[d.zona] || d.zona, d.eventi ? d.eventi + " l'anno" : null, d.in_corso != null ? d.in_corso + " in corso" : null, WL.pilota[d.pilota], d.chiamata ? "vuole una chiamata" : null, d.telefono ? "tel. " + d.telefono : null, d.web].filter(Boolean).join(" · ");
    if (d.modulo) return [d.nome, wlWhen(d), WL.zona[d.zona], d.invitati ? d.invitati.replace("fino-", "fino a ") + " invitati" : null, WL.planner[d.planner], WL.prezzo49[d.prezzo49], d.prova ? "prova l'anteprima" : null, d.pesi ? "pesa: " + list(d.pesi) : null].filter(Boolean).join(" · ");
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
      var head = ["Data", "Profilo", "Stato", "Email", "Nomi o studio", "Zona", "Mese", "Anno", "Invitati", "Budget", "Planner", "Già prenotato", "Strumenti", "Difficoltà", "A 49 €", "Prova l'anteprima", "Team", "Matrimoni l'anno", "In corso", "Spesa software", "Pilota", "Chiamata", "Telefono", "Sito o Instagram", "Note"];
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
        panel("Programma pilota", "Dalle risposte delle planner.", null, h("ul", { class: "plain-list" },
          [["Vogliono farne parte", n(function (x) { return (x.dati || {}).pilota === "si"; })], ["Vogliono saperne di più", n(function (x) { return (x.dati || {}).pilota === "info"; })], ["Chiedono una chiamata", n(function (x) { return x.profilo === "planner" && (x.dati || {}).chiamata; })], ["Già in pilota", n(function (x) { return x.stato === "pilota"; })]].map(function (r) {
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
      var a = await Promise.all([api.list("tasks", null), api.list("budget_items", null)]);
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
          var view = { panoramica: overview, scadenze: tasksView, budget: budgetView, fornitori: vendorsView, invitati: guestsView, scaletta: timelineView, note: notesView, persone: peopleView, impostazioni: settingsView }[sec] || overview;
          if (sec === "note" && !isPlannerHere(w)) view = overview;
          if (!root.querySelector(".shell")) root.replaceChildren(shell(h("p", { class: "loading" }, "Carico…")));
          content = await view(w);
          if (p[2] === "tavoli") requestAnimationFrame(function () { var s = document.getElementById("sala"); if (s) s.scrollIntoView(); });
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
