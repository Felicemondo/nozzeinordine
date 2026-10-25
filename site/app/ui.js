/* Nozze in Ordine: interfaccia della dashboard (coppie, wedding planner, amministrazione).
   Parla solo con window.NIO_API (api.js dal vivo, mock-api.js nella demo).
   Tutto il testo che arriva dai dati passa da textContent: niente innerHTML con contenuti degli utenti. */
(function () {
  "use strict";
  var api = window.NIO_API;
  var root = document.getElementById("app");
  var state = { me: null, weddings: [], invites: [], navOpen: false };
  var PHASES = ["12+ mesi prima", "9-11 mesi prima", "6-8 mesi prima", "3-5 mesi prima", "1-2 mesi prima", "Settimana del sì"];
  var MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var LABEL = {
    role: { admin: "Amministratore", coppia: "Coppia", planner: "Wedding planner" },
    member: { sposi: "Sposi", planner: "Wedding planner" },
    ceremony: { civile: "Civile", religioso: "Religioso", simbolico: "Simbolico", da_decidere: "Da decidere" },
    vendor: { da_scegliere: "Da scegliere", in_trattativa: "In trattativa", confermato: "Confermato", scartato: "Scartato" },
    rsvp: { in_attesa: "In attesa", si: "Viene", no: "Non viene" },
    side: { sposa: "Sposa", sposo: "Sposo", entrambi: "Entrambi" },
    menu: { standard: "Standard", vegetariano: "Vegetariano", vegano: "Vegano", bambini: "Bambini", altro: "Altro" },
    assignee: { sposi: "Sposi", planner: "Planner" }
  };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var opts = function (map) { return Object.keys(map).map(function (k) { return [k, map[k]]; }); };

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
  function todayIso() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parseIso(s) { var p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fmtDate(s, long) {
    if (!s) return "—";
    var d = parseIso(s);
    return d.getDate() + " " + (long ? ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"][d.getMonth()] : MESI[d.getMonth()]) + " " + d.getFullYear();
  }
  function daysTo(s) { if (!s) return null; return Math.round((parseIso(s) - parseIso(todayIso())) / 86400000); }
  function whenText(s) {
    var n = daysTo(s);
    if (n == null) return "senza data";
    if (n === 0) return "oggi";
    if (n === 1) return "domani";
    if (n < 0) return n === -1 ? "ieri" : (-n) + " giorni fa";
    return n < 60 ? "tra " + n + " giorni" : fmtDate(s);
  }
  function chip(text, kind) { return h("span", { class: "chip " + (kind || "") }, text); }

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
    catch (e) { toast(e.message || String(e), true); throw e; }
  }

  function dialog(title, body, actions) {
    return new Promise(function (resolve) {
      var dlg = h("dialog", { class: "dlg", "aria-labelledby": "dlg-t" });
      var form = h("form", { method: "dialog", novalidate: false }, h("h2", { id: "dlg-t" }, title), body,
        h("div", { class: "dlg-actions" }, actions));
      dlg.append(form);
      document.body.append(dlg);
      // Chiusura gestita a mano: non tutti i browser emettono l'evento "close" in modo affidabile.
      var done = false;
      function finish(v) {
        if (done) return; done = true;
        if (dlg.open) dlg.close(v);
        resolve({ value: v, form: form }); dlg.remove();
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = e.submitter ? e.submitter.value : "ok";
        if (v === "ok" && !form.checkValidity()) { form.reportValidity(); return; }
        finish(v);
      });
      dlg.addEventListener("cancel", function (e) { e.preventDefault(); finish("no"); });
      dlg.addEventListener("close", function () { finish(dlg.returnValue || "no"); });
      dlg.showModal();
      var first = form.querySelector("input, select, textarea");
      if (first) first.focus();
    });
  }
  async function confirmBox(title, text, okLabel) {
    var r = await dialog(title, h("p", { class: "dlg-text" }, text), [
      h("button", { class: "btn danger", value: "ok" }, okLabel || "Conferma"),
      h("button", { class: "btn alt", value: "no" }, "Annulla")
    ]);
    return r.value === "ok";
  }
  function field(f, v) {
    var id = "f-" + f.name;
    var input;
    if (f.type === "select") {
      input = h("select", { id: id, name: f.name, required: f.required }, f.options.map(function (o) { return h("option", { value: o[0], selected: String(v) === String(o[0]) }, o[1]); }));
    } else if (f.type === "textarea") {
      input = h("textarea", { id: id, name: f.name, rows: 4, maxlength: f.max || 2000, required: f.required, placeholder: f.placeholder });
      input.value = v == null ? "" : v;
    } else if (f.type === "checkbox") {
      return h("label", { class: "check", for: id }, h("input", { type: "checkbox", id: id, name: f.name, checked: !!v }), h("span", null, f.label));
    } else {
      input = h("input", {
        // gli importi si scrivono anche con la virgola: campo di testo con tastiera numerica
        id: id, name: f.name, type: f.type === "number" ? "text" : (f.type || "text"), required: f.required, placeholder: f.placeholder,
        min: f.type === "number" ? null : f.min, maxlength: f.max, inputmode: f.type === "number" ? (f.step === "1" ? "numeric" : "decimal") : null,
        pattern: f.type === "number" ? (f.step === "1" ? "\\d*" : "\\d+([.,]\\d{1,2})?") : null, title: f.type === "number" ? (f.step === "1" ? "Solo numeri interi" : "Un importo, per esempio 1250 o 1250,50") : null,
        list: f.list ? id + "-l" : null,
        autocomplete: f.autocomplete || "off", value: v == null ? "" : (f.type === "time" ? String(v).slice(0, 5) : f.type === "number" ? String(num(v)).replace(".", ",") : String(v))
      });
    }
    return h("div", { class: "fld" + (f.wide ? " wide" : "") }, h("label", { for: id }, f.label + (f.required ? "" : " (facoltativo)")), input,
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
  async function formDialog(title, fields, values, okLabel) {
    values = values || {};
    var r = await dialog(title, h("div", { class: "grid-form" }, fields.map(function (f) { return field(f, values[f.name]); })), [
      h("button", { class: "btn", value: "ok" }, okLabel || "Salva"),
      h("button", { class: "btn alt", value: "no", formnovalidate: true }, "Annulla")
    ]);
    return r.value === "ok" ? readForm(r.form, fields) : null;
  }

  /* ------------------------------------------------------------ definizioni dei campi */
  var F = {
    wedding: [
      { name: "title", label: "Nome del matrimonio", required: true, max: 120, placeholder: "Es. Anna e Marco", wide: true },
      { name: "wedding_date", label: "Data del matrimonio", type: "date", help: "Le scadenze si calcolano su questa data." },
      { name: "city", label: "Città o zona", max: 80, placeholder: "Es. Caserta" },
      { name: "ceremony", label: "Rito", type: "select", options: opts(LABEL.ceremony) },
      { name: "budget_total", label: "Budget complessivo (€)", type: "number", min: 0, step: "1" },
      { name: "guests_expected", label: "Invitati previsti", type: "number", min: 0, step: "1" }
    ],
    budget_items: [
      { name: "category", label: "Voce", required: true, max: 80, list: ["Location e ricevimento", "Catering", "Fotografo e video", "Abiti", "Musica", "Fiori e allestimenti", "Partecipazioni", "Bomboniere", "Trasporti", "Viaggio di nozze", "Altre voci"] },
      { name: "description", label: "Dettaglio", max: 200 },
      { name: "planned", label: "Previsto (€)", type: "number", min: 0, step: "0.01" },
      { name: "contracted", label: "Firmato (€)", type: "number", min: 0, step: "0.01" },
      { name: "paid", label: "Già pagato (€)", type: "number", min: 0, step: "0.01" },
      { name: "due_date", label: "Prossimo pagamento", type: "date" }
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
    guests: [
      { name: "name", label: "Nome e cognome", required: true, max: 120 },
      { name: "household", label: "Nucleo familiare", max: 120, placeholder: "Es. Famiglia Russo" },
      { name: "side", label: "Invitato da", type: "select", options: opts(LABEL.side) },
      { name: "rsvp", label: "Risposta", type: "select", options: opts(LABEL.rsvp) },
      { name: "menu", label: "Menù", type: "select", options: opts(LABEL.menu) },
      { name: "notes", label: "Note", max: 500 }
    ],
    tasks: [
      { name: "title", label: "Attività", required: true, max: 200, wide: true },
      { name: "due_date", label: "Scadenza", type: "date" },
      { name: "phase", label: "Fase", type: "select", options: PHASES.map(function (p, i) { return [String(i), p]; }) },
      { name: "assignee", label: "Chi se ne occupa", type: "select", options: opts(LABEL.assignee) },
      { name: "done", label: "Fatto", type: "checkbox" }
    ],
    timeline_items: [
      { name: "start_time", label: "Ora", type: "time", required: true },
      { name: "title", label: "Momento", required: true, max: 120, placeholder: "Es. Cerimonia" },
      { name: "place", label: "Luogo", max: 120 },
      { name: "owner", label: "Responsabile", max: 120, placeholder: "Es. Fotografo" }
    ],
    internal_notes: [{ name: "body", label: "Nota", type: "textarea", required: true, max: 4000, wide: true }]
  };

  /* ------------------------------------------------------------ routing */
  function route() {
    var parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
    return parts;
  }
  function go(path) { if (location.hash !== "#/" + path) location.hash = "#/" + path; else render(); }
  var current = function () { var p = route(); return p[0] === "m" ? p[1] : null; };
  var wedding = function (id) { return state.weddings.filter(function (w) { return w.id === id; })[0]; };
  var isPlannerHere = function (w) { return state.me.role === "admin" || (w && w.my_role === "planner"); };

  window.addEventListener("hashchange", function () { state.navOpen = false; render(); });

  /* ------------------------------------------------------------ guscio */
  function markSvg() {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 64"); s.setAttribute("aria-hidden", "true");
    ["M0.00,0.00 L31.00,0.00 L31.00,10.02 A22,22 0 0 0 10.02,31.00 L0.00,31.00 Z", "M64.00,0.00 L33.00,0.00 L33.00,10.02 A22,22 0 0 1 53.98,31.00 L64.00,31.00 Z",
     "M0.00,64.00 L31.00,64.00 L31.00,53.98 A22,22 0 0 1 10.02,33.00 L0.00,33.00 Z", "M64.00,64.00 L33.00,64.00 L33.00,53.98 A22,22 0 0 0 53.98,33.00 L64.00,33.00 Z",
     "M20,32 A12,12 0 1 0 44,32 A12,12 0 1 0 20,32 Z"].forEach(function (d) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); s.append(p);
    });
    return s;
  }
  function brand() { return h("a", { class: "brand", href: "../index.html" }, markSvg(), h("span", null, "Nozze in Ordine")); }

  function navLink(href, label, active) { return h("a", { href: "#/" + href, class: active ? "on" : null, "aria-current": active ? "page" : null }, label); }

  function shell(content) {
    var p = route(), wid = current(), w = wedding(wid), me = state.me;
    var nav = h("nav", { class: "nav", "aria-label": "Sezioni" });
    if (me.role === "planner" || me.role === "admin") nav.append(navLink("eventi", me.role === "admin" ? "Tutti i matrimoni" : "I miei matrimoni", p[0] === "eventi"));
    if (me.role === "admin") nav.append(navLink("admin", "Amministrazione", p[0] === "admin"));
    if (state.weddings.length > 1 || (wid && me.role !== "coppia")) {
      var sel = h("select", { "aria-label": "Matrimonio aperto", onchange: function (e) { if (e.target.value) go("m/" + e.target.value + "/panoramica"); } },
        h("option", { value: "" }, "Apri un matrimonio…"),
        state.weddings.map(function (x) { return h("option", { value: x.id, selected: x.id === wid }, x.title); }));
      nav.append(h("div", { class: "switch" }, sel));
    }
    if (w) {
      var sec = p[2] || "panoramica";
      var items = [["panoramica", "Panoramica"], ["scadenze", "Scadenze"], ["budget", "Budget"], ["fornitori", "Fornitori e preventivi"], ["invitati", "Invitati"], ["scaletta", "Scaletta del giorno"]];
      if (isPlannerHere(w)) items.push(["note", "Note interne"]);
      items.push(["persone", "Persone e inviti"], ["impostazioni", "Dati del matrimonio"]);
      add(nav, [h("p", { class: "nav-title" }, w.title), items.map(function (it) { return navLink("m/" + w.id + "/" + it[0], it[1], sec === it[0]); })]);
    }
    nav.append(h("div", { class: "nav-foot" }, navLink("profilo", "Profilo", p[0] === "profilo"),
      h("button", { class: "linkish", type: "button", onclick: async function () { await attempt(api.signOut); } }, "Esci")));

    function setNav(open) {
      state.navOpen = open;
      var sd = document.getElementById("side"); if (sd) sd.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) { var a = sd && sd.querySelector("a, button"); if (a) a.focus(); } else toggle.focus();
    }
    var toggle = h("button", { class: "menu-btn", type: "button", "aria-expanded": state.navOpen ? "true" : "false", "aria-controls": "side",
      onclick: function () { setNav(!state.navOpen); } }, "Menu");
    document.onkeydown = function (e) { if (e.key === "Escape" && state.navOpen) setNav(false); };
    var side = h("aside", { class: "side" + (state.navOpen ? " open" : ""), id: "side" },
      h("div", { class: "side-top" }, h("button", { class: "close-nav", type: "button", onclick: function () { setNav(false); } }, "Chiudi"), brand(), h("p", { class: "who" }, h("b", null, me.full_name || me.email), h("span", null, LABEL.role[me.role]))), nav);
    var banner = api.mode === "demo" ? h("p", { class: "demo-band" }, "Demo con dati finti: ogni modifica resta solo in questa pagina. ", h("a", { href: "demo.html" }, "Cambia profilo")) : null;
    var invites = state.invites.length ? h("section", { class: "invites", "aria-label": "Inviti ricevuti" }, state.invites.map(function (i) {
      return h("div", { class: "invite-row" }, h("span", null, "Sei invitato a ", h("b", null, i.wedding_title), " come " + LABEL.member[i.member_role].toLowerCase() + "."),
        h("button", { class: "btn sm", type: "button", onclick: async function () {
          var id = await attempt(function () { return api.acceptInvite(i.token); }, "Invito accettato.");
          await loadBase(); go("m/" + id + "/panoramica");
        } }, "Accetta"));
    })) : null;
    return h("div", { class: "shell" }, h("header", { class: "topbar" }, brand(), toggle), side,
      h("main", { class: "main", id: "main", tabindex: "-1", onclick: function () { if (state.navOpen) setNav(false); } }, banner, invites, content));
  }

  function pageHead(title, sub, actions) {
    return h("header", { class: "page-head" }, h("div", null, h("h1", null, title), sub ? h("p", { class: "sub" }, sub) : null), actions ? h("div", { class: "head-actions" }, actions) : null);
  }
  function empty(text, action) { return h("div", { class: "empty" }, h("p", null, text), action || null); }
  function btn(label, onclick, cls) { return h("button", { class: "btn " + (cls || ""), type: "button", onclick: onclick }, label); }
  function iconBtn(label, onclick, cls) { return h("button", { class: "mini " + (cls || ""), type: "button", onclick: onclick }, label); }

  /* ------------------------------------------------------------ accesso */
  function authScreen(kind) {
    var msg = h("p", { class: "form-msg", role: "status", "aria-live": "polite" });
    var say = function (t, bad) { msg.textContent = t; msg.className = "form-msg" + (bad ? " bad" : " good"); };
    var busy = function (f, on) { Array.prototype.forEach.call(f.querySelectorAll("button"), function (b) { b.disabled = on; }); };
    var card;
    if (kind === "registrati") {
      var f = h("form", { class: "auth-form", novalidate: true },
        h("fieldset", null, h("legend", null, "Chi sei?"), h("div", { class: "seg" },
          h("label", null, h("input", { type: "radio", name: "role", value: "coppia", checked: true }), h("span", null, "Ci sposiamo")),
          h("label", null, h("input", { type: "radio", name: "role", value: "planner" }), h("span", null, "Sono una wedding planner")))),
        field({ name: "full_name", label: "Nome e cognome", required: true, max: 120, autocomplete: "name" }),
        field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
        field({ name: "password", label: "Password", type: "password", required: true, autocomplete: "new-password", help: "Almeno 8 caratteri." }),
        h("label", { class: "check" }, h("input", { type: "checkbox", name: "privacy", required: true }), h("span", null, "Ho letto l'", h("a", { href: "../privacy.html", target: "_blank", rel: "noopener" }, "informativa privacy"), ".")),
        h("button", { class: "btn", type: "submit" }, "Crea l'account"), msg);
      f.addEventListener("submit", async function (e) {
        e.preventDefault();
        var d = { full_name: f.elements.full_name.value.trim(), email: f.elements.email.value.trim(), password: f.elements.password.value, role: f.elements.role.value };
        if (!d.full_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return say("Controlla nome ed email.", true);
        if (d.password.length < 8) return say("La password deve avere almeno 8 caratteri.", true);
        if (!f.elements.privacy.checked) return say("Spunta la casella dell'informativa privacy.", true);
        busy(f, true);
        try { var r = await api.signUp(d); say(r.needsConfirmation ? "Fatto. Ti abbiamo mandato un'email: apri il link per confermare l'indirizzo, poi accedi." : "Account creato.", false); }
        catch (err) { say(err.message, true); }
        busy(f, false);
      });
      card = [h("h1", null, "Crea il tuo spazio"), h("p", { class: "sub" }, "Per coppie e wedding planner. Gratis durante la prova."), f,
        h("p", { class: "alt-link" }, "Hai già un account? ", h("a", { href: "#/accedi" }, "Accedi"))];
    } else if (kind === "password") {
      var fp = h("form", { class: "auth-form", novalidate: true }, field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
        h("button", { class: "btn", type: "submit" }, "Mandami il link"), msg);
      fp.addEventListener("submit", async function (e) {
        e.preventDefault(); busy(fp, true);
        try { await api.resetPassword(fp.elements.email.value.trim()); say("Se l'indirizzo è registrato, riceverai un'email con il link per scegliere una nuova password.", false); }
        catch (err) { say(err.message, true); }
        busy(fp, false);
      });
      card = [h("h1", null, "Password dimenticata"), fp, h("p", { class: "alt-link" }, h("a", { href: "#/accedi" }, "Torna all'accesso"))];
    } else {
      var fl = h("form", { class: "auth-form", novalidate: true },
        field({ name: "email", label: "Email", type: "email", required: true, autocomplete: "email" }),
        field({ name: "password", label: "Password", type: "password", required: true, autocomplete: "current-password" }),
        h("button", { class: "btn", type: "submit" }, "Accedi"), msg);
      fl.addEventListener("submit", async function (e) {
        e.preventDefault(); busy(fl, true);
        try { await api.signIn(fl.elements.email.value.trim(), fl.elements.password.value); }
        catch (err) { say(err.message, true); busy(fl, false); }
      });
      card = [h("h1", null, "Bentornati"), h("p", { class: "sub" }, "Accedi al tuo spazio di Nozze in Ordine."), fl,
        h("p", { class: "alt-link" }, h("a", { href: "#/password" }, "Password dimenticata?")),
        h("p", { class: "alt-link" }, "Non hai un account? ", h("a", { href: "#/registrati" }, "Registrati"))];
    }
    return h("div", { class: "auth" }, h("div", { class: "auth-card" }, brand(), card,
      h("p", { class: "alt-link demo-link" }, "Vuoi solo guardare? ", h("a", { href: "demo.html" }, "Apri la demo con dati finti"))),
      h("div", { class: "auth-pic", "aria-hidden": "true" }));
  }

  function demoChooser() {
    var pick = function (role) { return async function () { await api.demoSignIn(role); }; };
    return h("div", { class: "auth" }, h("div", { class: "auth-card" }, brand(),
      h("h1", null, "Prova la dashboard"), h("p", { class: "sub" }, "Dati finti, nessun account. Scegli con quali occhi guardarla:"),
      h("div", { class: "pick" },
        h("button", { class: "pick-tile", type: "button", onclick: pick("coppia") }, h("b", null, "Coppia"), h("span", null, "Anna e Marco, matrimonio a Caserta")),
        h("button", { class: "pick-tile", type: "button", onclick: pick("planner") }, h("b", null, "Wedding planner"), h("span", null, "Beatrice, tre matrimoni in corso")),
        h("button", { class: "pick-tile", type: "button", onclick: pick("admin") }, h("b", null, "Amministrazione"), h("span", null, "Utenti, matrimoni e lista d'attesa"))),
      h("p", { class: "alt-link" }, h("a", { href: "index.html" }, "Vai all'accesso vero"))), h("div", { class: "auth-pic", "aria-hidden": "true" }));
  }

  function newPasswordScreen() {
    var msg = h("p", { class: "form-msg", role: "status", "aria-live": "polite" });
    var f = h("form", { class: "auth-form", novalidate: true }, field({ name: "password", label: "Nuova password", type: "password", required: true, autocomplete: "new-password", help: "Almeno 8 caratteri." }),
      h("button", { class: "btn", type: "submit" }, "Salva la password"), msg);
    f.addEventListener("submit", async function (e) {
      e.preventDefault();
      var p = f.elements.password.value;
      if (p.length < 8) { msg.textContent = "La password deve avere almeno 8 caratteri."; msg.className = "form-msg bad"; return; }
      try { await api.updatePassword(p); toast("Password aggiornata."); go(""); }
      catch (err) { msg.textContent = err.message; msg.className = "form-msg bad"; }
    });
    return h("div", { class: "auth" }, h("div", { class: "auth-card" }, brand(), h("h1", null, "Scegli una nuova password"), f), h("div", { class: "auth-pic", "aria-hidden": "true" }));
  }

  /* ------------------------------------------------------------ creazione del matrimonio */
  async function createWeddingFlow() {
    var d = await formDialog("Nuovo matrimonio", F.wedding, { ceremony: "da_decidere" }, "Crea");
    if (!d) return;
    var id = await attempt(function () { return api.createWedding(d); }, "Matrimonio creato: abbiamo preparato le prime scadenze.");
    await loadBase();
    go("m/" + id + "/panoramica");
  }
  function onboarding() {
    var me = state.me;
    return [pageHead("Benvenuti" + (me.full_name ? ", " + me.full_name.split(" ")[0] : ""), "Per cominciare, create lo spazio del vostro matrimonio."),
      h("div", { class: "onboard" },
        h("div", { class: "tile big-tile" }, h("h2", null, "Il vostro matrimonio"), h("p", null, "Bastano il nome e, se c'è già, la data: le scadenze si calcolano da sole e si spostano se la data cambia."),
          btn("Crea il matrimonio", createWeddingFlow)),
        h("div", { class: "tile" }, h("h2", null, "Vi segue una wedding planner?"), h("p", null, "Chiedetele di invitarvi con questa email: " + me.email + ". L'invito comparirà qui in alto, appena entrate.")))];
  }

  /* ------------------------------------------------------------ panoramica del matrimonio */
  function budgetTotals(items) {
    return items.reduce(function (a, b) { a.planned += num(b.planned); a.contracted += num(b.contracted); a.paid += num(b.paid); return a; }, { planned: 0, contracted: 0, paid: 0 });
  }
  function bar(parts, total, label) {
    total = total || 1;
    return h("div", { class: "bar", role: "img", "aria-label": label }, parts.map(function (p) {
      return h("i", { class: p[1], style: "width:" + Math.max(0, Math.min(100, p[0] / total * 100)).toFixed(1) + "%" });
    }));
  }
  function currentPhase(w) {
    var n = daysTo(w.wedding_date);
    if (n == null) return null;
    if (n < 0) return -1;
    var m = n / 30.44;
    return m >= 12 ? 0 : m >= 9 ? 1 : m >= 6 ? 2 : m >= 3 ? 3 : n > 7 ? 4 : 5;
  }

  async function overview(w) {
    var res = await Promise.all([api.list("budget_items", w.id), api.list("guests", w.id), api.list("tasks", w.id), api.list("vendors", w.id)]);
    var bud = res[0], guests = res[1], tasks = res[2], vendors = res[3];
    var t = budgetTotals(bud), n = daysTo(w.wedding_date), ph = currentPhase(w);
    var open = tasks.filter(function (x) { return !x.done; });
    var late = open.filter(function (x) { return x.due_date && x.due_date < todayIso(); });
    var next = open.filter(function (x) { return x.due_date; }).slice(0, 6);
    var g = { si: 0, no: 0, in_attesa: 0 }; guests.forEach(function (x) { g[x.rsvp]++; });
    var pays = bud.filter(function (b) { return b.due_date && num(b.contracted) > num(b.paid) && b.due_date >= todayIso(); }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; }).slice(0, 4);
    var vs = {}; vendors.forEach(function (v) { vs[v.status] = (vs[v.status] || 0) + 1; });
    var budgetRef = num(w.budget_total) || t.planned;

    var countdown = h("div", { class: "tile t-count" },
      h("p", { class: "lbl" }, "Mancano al sì"),
      n == null ? h("p", { class: "big" }, "Data da scegliere") : n < 0 ? h("p", { class: "big" }, "Auguri!") :
        h("p", { class: "big" }, h("b", null, String(Math.floor(n / 7))), Math.floor(n / 7) === 1 ? " settimana " : " settimane ", h("b", null, String(n % 7)), n % 7 === 1 ? " giorno" : " giorni"),
      h("p", { class: "meta" }, [fmtDate(w.wedding_date, true), w.city, LABEL.ceremony[w.ceremony] !== "Da decidere" ? "rito " + LABEL.ceremony[w.ceremony].toLowerCase() : null].filter(Boolean).join(" · ")),
      ph != null && ph >= 0 ? h("p", { class: "meta" }, "Fase in corso: " + PHASES[ph]) : null);

    var budget = h("a", { class: "tile t-budget", href: "#/m/" + w.id + "/budget" },
      h("p", { class: "lbl" }, "Budget"),
      h("p", { class: "fig" }, eur(t.paid), h("small", null, " pagati su " + eur(budgetRef))),
      bar([[t.paid, "p"], [t.contracted - t.paid, "c"]], Math.max(budgetRef, t.contracted), "Pagato " + eur(t.paid) + ", firmato " + eur(t.contracted) + ", budget " + eur(budgetRef)),
      h("dl", { class: "kv" }, h("div", null, h("dt", null, "Firmato"), h("dd", null, eur(t.contracted))), h("div", null, h("dt", null, "Da pagare"), h("dd", null, eur(t.contracted - t.paid))),
        h("div", null, h("dt", null, "Previsto per voce"), h("dd", null, eur(t.planned))),
        num(w.budget_total) ? h("div", null, h("dt", null, "Margine sul budget"), h("dd", { class: t.planned > num(w.budget_total) ? "warn" : null }, eur(num(w.budget_total) - t.planned))) : null));

    var guestTile = h("a", { class: "tile t-guests", href: "#/m/" + w.id + "/invitati" },
      h("p", { class: "lbl" }, "Invitati"),
      h("p", { class: "fig" }, String(g.si), h("small", null, " vengono su " + guests.length + (w.guests_expected ? " (previsti " + w.guests_expected + ")" : ""))),
      bar([[g.si, "ok"], [g.no, "no"]], guests.length, g.si + " vengono, " + g.no + " non vengono, " + g.in_attesa + " in attesa"),
      h("p", { class: "chips" }, chip("Vengono " + g.si, "ok"), chip("Non vengono " + g.no, "no"), chip("In attesa " + g.in_attesa, "wait")));

    var taskTile = h("div", { class: "tile t-tasks" },
      h("div", { class: "tile-head" }, h("p", { class: "lbl" }, "Prossime scadenze"), h("a", { href: "#/m/" + w.id + "/scadenze" }, "Tutte")),
      late.length ? h("p", { class: "alert" }, late.length === 1 ? "1 attività è in ritardo." : late.length + " attività sono in ritardo.") : null,
      next.length ? h("ul", { class: "rows" }, next.map(function (x) {
        var lateOne = x.due_date < todayIso();
        return h("li", null, h("span", null, x.title), h("span", { class: lateOne ? "warn" : "soft" }, whenText(x.due_date)));
      })) : h("p", { class: "soft" }, open.length ? "Le attività aperte non hanno una data." : "Tutto fatto. Complimenti."),
      h("p", { class: "soft small" }, (tasks.length - open.length) + " fatte su " + tasks.length));

    var payTile = h("div", { class: "tile" }, h("p", { class: "lbl" }, "Prossimi pagamenti"),
      pays.length ? h("ul", { class: "rows" }, pays.map(function (b) { return h("li", null, h("span", null, b.category), h("span", null, eur(num(b.contracted) - num(b.paid)) + " · " + whenText(b.due_date))); }))
        : h("p", { class: "soft" }, "Nessun pagamento con una data. Aggiungila nelle voci del budget."));

    var vendTile = h("a", { class: "tile", href: "#/m/" + w.id + "/fornitori" }, h("p", { class: "lbl" }, "Fornitori"),
      vendors.length ? h("p", { class: "chips" }, Object.keys(LABEL.vendor).filter(function (k) { return vs[k]; }).map(function (k) {
        return chip(LABEL.vendor[k] + " " + vs[k], k === "confermato" ? "ok" : k === "in_trattativa" ? "on" : k === "scartato" ? "past" : "");
      })) : h("p", { class: "soft" }, "Ancora nessun fornitore."));

    return [pageHead(w.title, w.wedding_date ? fmtDate(w.wedding_date, true) + (w.city ? ", " + w.city : "") : "Data da decidere"),
      h("div", { class: "board" }, countdown, budget, guestTile, taskTile, payTile, vendTile)];
  }

  /* ------------------------------------------------------------ scadenze */
  async function tasksView(w) {
    var tasks = await api.list("tasks", w.id);
    var onlyOpen = store.get("nio-open") === "1";
    var toggleOpen = h("label", { class: "check inline" }, h("input", { type: "checkbox", checked: onlyOpen, onchange: function (e) { store.set("nio-open", e.target.checked ? "1" : "0"); render(); } }), h("span", null, "Solo da fare"));
    var addBtn = btn("Aggiungi attività", async function () {
      var d = await formDialog("Nuova attività", F.tasks, { phase: String(Math.max(0, currentPhase(w) || 0)), assignee: "sposi" });
      if (!d) return; d.phase = Number(d.phase); d.wedding_id = w.id;
      await attempt(function () { return api.insert("tasks", d); }, "Attività aggiunta."); render();
    });
    var groups = PHASES.map(function (p, i) {
      var rows = tasks.filter(function (t) { return Number(t.phase) === i && (!onlyOpen || !t.done); });
      if (!rows.length) return null;
      var done = tasks.filter(function (t) { return Number(t.phase) === i && t.done; }).length, all = tasks.filter(function (t) { return Number(t.phase) === i; }).length;
      return h("section", { class: "group" + (i === currentPhase(w) ? " now" : "") }, h("h2", null, p, h("span", { class: "count" }, done + " di " + all)),
        h("ul", { class: "task-list" }, rows.map(function (t) {
          var late = !t.done && t.due_date && t.due_date < todayIso();
          return h("li", { class: t.done ? "done" : null },
            h("label", { class: "check" }, h("input", { type: "checkbox", checked: t.done, onchange: async function (e) {
              await attempt(function () { return api.update("tasks", t.id, { done: e.target.checked }); }); render();
            } }), h("span", null, t.title)),
            h("span", { class: late ? "warn" : "soft" }, t.due_date ? fmtDate(t.due_date) + (t.done || Math.abs(daysTo(t.due_date)) >= 60 ? "" : " · " + whenText(t.due_date)) : "senza data"),
            chip(LABEL.assignee[t.assignee], t.assignee === "planner" ? "on" : ""),
            h("span", { class: "row-actions" },
              iconBtn("Modifica", async function () {
                var d = await formDialog("Modifica attività", F.tasks, Object.assign({}, t, { phase: String(t.phase) }));
                if (!d) return; d.phase = Number(d.phase);
                await attempt(function () { return api.update("tasks", t.id, d); }, "Salvato."); render();
              }),
              iconBtn("Elimina", async function () {
                if (!await confirmBox("Eliminare l'attività?", "«" + t.title + "» verrà tolta dalla lista.", "Elimina")) return;
                await attempt(function () { return api.remove("tasks", t.id); }, "Eliminata."); render();
              }, "danger")));
        })));
    }).filter(Boolean);
    return [pageHead("Scadenze", w.wedding_date ? "Calcolate sul " + fmtDate(w.wedding_date, true) + ". Se cambiate la data, quelle non ancora fatte si spostano." : "Inserite la data del matrimonio per avere le scadenze.", [toggleOpen, addBtn]),
      groups.length ? groups : empty(onlyOpen ? "Niente da fare: tutto completato." : "Nessuna attività.")];
  }

  /* ------------------------------------------------------------ budget */
  async function budgetView(w) {
    var items = await api.list("budget_items", w.id), t = budgetTotals(items), ref = num(w.budget_total);
    var add = btn("Aggiungi voce", async function () {
      var d = await formDialog("Nuova voce di spesa", F.budget_items);
      if (!d) return; d.wedding_id = w.id;
      await attempt(function () { return api.insert("budget_items", d); }, "Voce aggiunta."); render();
    });
    var summary = h("div", { class: "board sum4" },
      h("div", { class: "tile t-count" }, h("p", { class: "lbl" }, "Budget complessivo"), h("p", { class: "fig" }, ref ? eur(ref) : "—"), h("p", { class: "meta" }, ref ? "Margine: " + eur(ref - t.planned) : h("a", { href: "#/m/" + w.id + "/impostazioni" }, "Imposta il budget"))),
      h("div", { class: "tile" }, h("p", { class: "lbl" }, "Previsto per voce"), h("p", { class: "fig" }, eur(t.planned))),
      h("div", { class: "tile" }, h("p", { class: "lbl" }, "Contratti firmati"), h("p", { class: "fig" }, eur(t.contracted))),
      h("div", { class: "tile" }, h("p", { class: "lbl" }, "Già pagato"), h("p", { class: "fig" }, eur(t.paid)), h("p", { class: "meta" }, "Da pagare: " + eur(t.contracted - t.paid))));
    var table = items.length ? h("div", { class: "tscroll" }, h("table", { class: "tbl data" },
      h("caption", { class: "sr" }, "Voci di spesa"),
      h("thead", null, h("tr", null, ["Voce", "Previsto", "Firmato", "Pagato", "Da pagare", "Prossimo pagamento", ""].map(function (x, i) { return h("th", { scope: "col", class: i >= 1 && i <= 4 ? "n" : null }, x); }))),
      h("tbody", null, items.map(function (b) {
        return h("tr", null, h("th", { scope: "row" }, h("b", null, b.category), b.description ? h("small", null, b.description) : null),
          h("td", { class: "n" }, eur(b.planned)), h("td", { class: "n" }, eur(b.contracted)), h("td", { class: "n" }, eur(b.paid)),
          h("td", { class: "n" }, eur(num(b.contracted) - num(b.paid))), h("td", null, b.due_date ? fmtDate(b.due_date) : "—"),
          h("td", { class: "row-actions" },
            iconBtn("Modifica", async function () { var d = await formDialog("Modifica voce", F.budget_items, b); if (!d) return; await attempt(function () { return api.update("budget_items", b.id, d); }, "Salvato."); render(); }),
            iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare la voce?", "«" + b.category + "» verrà tolta dal budget.", "Elimina")) return; await attempt(function () { return api.remove("budget_items", b.id); }, "Eliminata."); render(); }, "danger")));
      })),
      h("tfoot", null, h("tr", null, h("th", { scope: "row" }, "Totale"), h("td", { class: "n" }, eur(t.planned)), h("td", { class: "n" }, eur(t.contracted)), h("td", { class: "n" }, eur(t.paid)), h("td", { class: "n" }, eur(t.contracted - t.paid)), h("td", null), h("td", null))))) :
      empty("Ancora nessuna voce. Cominciate dalla location: è di solito la spesa più grande.");
    return [pageHead("Budget", "Previsto, firmato, pagato e residuo per ogni voce.", add), summary, table];
  }

  /* ------------------------------------------------------------ fornitori e preventivi */
  async function vendorsView(w) {
    var res = await Promise.all([api.list("vendors", w.id), api.list("quotes", w.id)]);
    var vendors = res[0], quotes = res[1], guestsN = num(w.guests_expected);
    var add = btn("Aggiungi fornitore", async function () {
      var d = await formDialog("Nuovo fornitore", F.vendors, { status: "da_scegliere" });
      if (!d) return; d.wedding_id = w.id;
      await attempt(function () { return api.insert("vendors", d); }, "Fornitore aggiunto."); render();
    });
    var list = vendors.map(function (v) {
      var qs = quotes.filter(function (q) { return q.vendor_id === v.id; });
      var total = function (q) { return q.per_person ? num(q.amount) * guestsN : num(q.amount); };
      var cheapest = qs.length > 1 ? Math.min.apply(null, qs.map(total)) : null;
      return h("article", { class: "vendor" },
        h("header", null, h("div", null, h("p", { class: "lbl" }, v.category), h("h2", null, v.name), v.contact ? h("p", { class: "soft" }, v.contact) : null),
          h("div", { class: "vendor-actions" },
            h("label", { class: "sr", for: "st-" + v.id }, "Stato di " + v.name),
            h("select", { id: "st-" + v.id, onchange: async function (e) { await attempt(function () { return api.update("vendors", v.id, { status: e.target.value }); }, "Stato aggiornato."); } },
              opts(LABEL.vendor).map(function (o) { return h("option", { value: o[0], selected: v.status === o[0] }, o[1]); })),
            iconBtn("Modifica", async function () { var d = await formDialog("Modifica fornitore", F.vendors, v); if (!d) return; await attempt(function () { return api.update("vendors", v.id, d); }, "Salvato."); render(); }),
            iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare il fornitore?", "Verranno eliminati anche i suoi preventivi.", "Elimina")) return; await attempt(function () { return api.remove("vendors", v.id); }, "Eliminato."); render(); }, "danger"))),
        v.notes ? h("p", { class: "notes" }, v.notes) : null,
        h("div", { class: "quotes" }, qs.map(function (q) {
          return h("div", { class: "quote" + (q.chosen ? " pick" : "") },
            q.chosen ? chip("Scelto", "ok") : null,
            h("p", { class: "lbl" }, q.label),
            h("p", { class: "fig" }, eur(q.amount), q.per_person ? h("small", null, " a persona") : null),
            q.per_person && guestsN ? h("p", { class: "soft small" }, "Per " + guestsN + " invitati: " + eur(total(q))) : null,
            q.includes ? h("p", { class: "small" }, q.includes) : null,
            q.expires_on ? h("p", { class: daysTo(q.expires_on) < 0 ? "warn small" : "soft small" }, "Valido fino al " + fmtDate(q.expires_on)) : null,
            cheapest != null && total(q) === cheapest ? h("p", { class: "small good" }, "Il più conveniente") : null,
            h("p", { class: "row-actions" },
              q.chosen ? null : iconBtn("Scegli", async function () {
                await attempt(async function () {
                  for (var i = 0; i < qs.length; i++) if (qs[i].chosen) await api.update("quotes", qs[i].id, { chosen: false });
                  await api.update("quotes", q.id, { chosen: true });
                }, "Preventivo scelto."); render();
              }),
              iconBtn("Modifica", async function () { var d = await formDialog("Modifica preventivo", F.quotes, q); if (!d) return; await attempt(function () { return api.update("quotes", q.id, d); }, "Salvato."); render(); }),
              iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare il preventivo?", "«" + q.label + "» verrà eliminato.", "Elimina")) return; await attempt(function () { return api.remove("quotes", q.id); }, "Eliminato."); render(); }, "danger")));
        }), h("button", { class: "quote add-quote", type: "button", onclick: async function () {
          var d = await formDialog("Nuovo preventivo per " + v.name, F.quotes);
          if (!d) return; d.wedding_id = w.id; d.vendor_id = v.id;
          await attempt(function () { return api.insert("quotes", d); }, "Preventivo aggiunto."); render();
        } }, "+ Aggiungi un preventivo")));
    });
    return [pageHead("Fornitori e preventivi", guestsN ? "I preventivi a persona sono calcolati su " + guestsN + " invitati previsti." : "Indicate gli invitati previsti nei dati del matrimonio per confrontare i preventivi a persona.", add),
      vendors.length ? h("div", { class: "vendors" }, list) : empty("Ancora nessun fornitore. Aggiungete il primo e allegate i preventivi che ricevete.")];
  }

  /* ------------------------------------------------------------ invitati */
  async function guestsView(w) {
    var guests = await api.list("guests", w.id);
    var filter = store.get("nio-rsvp") || "";
    var q = (store.get("nio-q") || "").toLowerCase();
    var g = { si: 0, no: 0, in_attesa: 0 }, menus = {}; guests.forEach(function (x) { g[x.rsvp]++; if (x.rsvp === "si") menus[x.menu] = (menus[x.menu] || 0) + 1; });
    var add = btn("Aggiungi invitato", async function () {
      var d = await formDialog("Nuovo invitato", F.guests, { side: "entrambi", rsvp: "in_attesa", menu: "standard" }, "Aggiungi");
      if (!d) return; d.wedding_id = w.id;
      await attempt(function () { return api.insert("guests", d); }, "Invitato aggiunto."); render();
    });
    var shown = guests.filter(function (x) { return (!filter || x.rsvp === filter) && (!q || (x.name + " " + x.household).toLowerCase().indexOf(q) >= 0); });
    var households = {}; shown.forEach(function (x) { var k = x.household || "Senza nucleo"; (households[k] = households[k] || []).push(x); });
    var tools = h("div", { class: "tools" },
      h("label", { class: "sr", for: "q" }, "Cerca"),
      h("input", { id: "q", type: "search", placeholder: "Cerca per nome o nucleo", value: store.get("nio-q") || "", oninput: function (e) { store.set("nio-q", e.target.value); clearTimeout(window.__nioQ); window.__nioQ = setTimeout(render, 250); } }),
      h("div", { class: "seg small", role: "group", "aria-label": "Filtra per risposta" }, [["", "Tutti " + guests.length], ["si", "Vengono " + g.si], ["in_attesa", "In attesa " + g.in_attesa], ["no", "Non vengono " + g.no]].map(function (o) {
        return h("button", { type: "button", class: filter === o[0] ? "on" : null, "aria-pressed": String(filter === o[0]), onclick: function () { store.set("nio-rsvp", o[0]); render(); } }, o[1]);
      })));
    var mosaic = guests.length ? h("div", { class: "mosaic", role: "img", "aria-label": g.si + " vengono, " + g.no + " non vengono, " + g.in_attesa + " in attesa" },
      guests.slice().sort(function (a, b) { var o = { si: 0, no: 1, in_attesa: 2 }; return o[a.rsvp] - o[b.rsvp]; }).map(function (x) { return h("i", { class: x.rsvp === "si" ? "ok" : x.rsvp === "no" ? "no" : "wait" }); })) : null;
    var menuLine = Object.keys(menus).length ? h("p", { class: "soft" }, "Menù di chi viene: " + Object.keys(menus).map(function (k) { return LABEL.menu[k].toLowerCase() + " " + menus[k]; }).join(", ") + ".") : null;
    var lists = Object.keys(households).sort().map(function (k) {
      return h("section", { class: "group" }, h("h2", null, k, h("span", { class: "count" }, households[k].length)),
        h("ul", { class: "guest-list" }, households[k].map(function (x) {
          return h("li", null, h("span", null, h("b", null, x.name), h("small", null, LABEL.side[x.side] + " · menù " + LABEL.menu[x.menu].toLowerCase() + (x.notes ? " · " + x.notes : ""))),
            h("label", { class: "sr", for: "r-" + x.id }, "Risposta di " + x.name),
            h("select", { id: "r-" + x.id, class: "rsvp " + x.rsvp, onchange: async function (e) { await attempt(function () { return api.update("guests", x.id, { rsvp: e.target.value }); }, "Risposta aggiornata."); render(); } },
              opts(LABEL.rsvp).map(function (o) { return h("option", { value: o[0], selected: x.rsvp === o[0] }, o[1]); })),
            h("span", { class: "row-actions" },
              iconBtn("Modifica", async function () { var d = await formDialog("Modifica invitato", F.guests, x); if (!d) return; await attempt(function () { return api.update("guests", x.id, d); }, "Salvato."); render(); }),
              iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare l'invitato?", x.name + " verrà tolto dalla lista.", "Elimina")) return; await attempt(function () { return api.remove("guests", x.id); }, "Eliminato."); render(); }, "danger")));
        })));
    });
    function csv() {
      var rows = [["Nome", "Nucleo", "Invitato da", "Risposta", "Menù", "Note"]].concat(guests.map(function (x) { return [x.name, x.household, LABEL.side[x.side], LABEL.rsvp[x.rsvp], LABEL.menu[x.menu], x.notes]; }));
      download("invitati-" + w.title.replace(/\W+/g, "-").toLowerCase() + ".csv", rows);
    }
    return [pageHead("Invitati", g.si + " vengono, " + g.in_attesa + " in attesa, " + g.no + " non vengono" + (w.guests_expected ? " · previsti " + w.guests_expected : "") + ".", [guests.length ? btn("Esporta CSV", csv, "alt") : null, add]),
      mosaic, menuLine, guests.length ? tools : null, lists.length ? lists : empty(guests.length ? "Nessun invitato con questi filtri." : "La lista è vuota. Aggiungete gli invitati per nucleo familiare: la risposta si aggiorna da qui.")];
  }
  function download(name, rows) {
    var text = "﻿" + rows.map(function (r) { return r.map(function (c) { c = c == null ? "" : String(c); return /[";\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(";"); }).join("\n");
    var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.append(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ------------------------------------------------------------ scaletta */
  async function timelineView(w) {
    var items = await api.list("timeline_items", w.id);
    var add = btn("Aggiungi momento", async function () {
      var d = await formDialog("Nuovo momento", F.timeline_items);
      if (!d) return; d.wedding_id = w.id;
      await attempt(function () { return api.insert("timeline_items", d); }, "Aggiunto."); render();
    });
    return [pageHead("Scaletta del giorno", w.wedding_date ? fmtDate(w.wedding_date, true) : null, [items.length ? btn("Stampa", function () { window.print(); }, "alt") : null, add]),
      items.length ? h("ol", { class: "timeline" }, items.map(function (x) {
        return h("li", null, h("b", { class: "time" }, String(x.start_time).slice(0, 5)), h("span", null, h("b", null, x.title), x.place ? h("small", null, x.place) : null),
          h("span", { class: "soft" }, x.owner),
          h("span", { class: "row-actions" },
            iconBtn("Modifica", async function () { var d = await formDialog("Modifica momento", F.timeline_items, x); if (!d) return; await attempt(function () { return api.update("timeline_items", x.id, d); }, "Salvato."); render(); }),
            iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare il momento?", "«" + x.title + "» verrà tolto dalla scaletta.", "Elimina")) return; await attempt(function () { return api.remove("timeline_items", x.id); }, "Eliminato."); render(); }, "danger")));
      })) : empty("Ancora vuota. Aggiungete i momenti principali: arrivo, rito, foto, aperitivo, cena.")];
  }

  /* ------------------------------------------------------------ note interne (solo planner) */
  async function notesView(w) {
    var notes = await api.list("internal_notes", w.id);
    var add = btn("Aggiungi nota", async function () {
      var d = await formDialog("Nuova nota interna", F.internal_notes);
      if (!d) return; d.wedding_id = w.id;
      await attempt(function () { return api.insert("internal_notes", d); }, "Nota salvata."); render();
    });
    return [pageHead("Note interne", "Le vedono solo le wedding planner di questo matrimonio, mai gli sposi.", add),
      notes.length ? h("ul", { class: "notes-list" }, notes.map(function (x) {
        return h("li", null, h("p", null, x.body), h("p", { class: "soft small" }, fmtDate(x.created_at)),
          h("span", { class: "row-actions" }, iconBtn("Elimina", async function () { if (!await confirmBox("Eliminare la nota?", "La nota verrà eliminata.", "Elimina")) return; await attempt(function () { return api.remove("internal_notes", x.id); }, "Eliminata."); render(); }, "danger")));
      })) : empty("Nessuna nota.")];
  }

  /* ------------------------------------------------------------ persone e inviti */
  async function peopleView(w) {
    var res = await Promise.all([api.listMembers(w.id), api.listInvites(w.id)]);
    var members = res[0], invites = res[1].filter(function (i) { return !i.accepted_at; });
    var me = state.me, planner = isPlannerHere(w);
    var link = location.origin + location.pathname;
    var invite = btn("Invita qualcuno", async function () {
      var d = await formDialog("Invita in questo matrimonio", [
        { name: "email", label: "Email della persona", type: "email", required: true, wide: true, help: "L'invito vale per questa email: la persona deve registrarsi o accedere con lo stesso indirizzo." },
        { name: "member_role", label: "Come", type: "select", options: [["sposi", "Sposa o sposo"], ["planner", "Wedding planner"]] }
      ], { member_role: "sposi" }, "Crea l'invito");
      if (!d) return;
      await attempt(function () { return api.createInvite(w.id, d.email, d.member_role, me); }, "Invito creato.");
      render();
    });
    var msg = "Ciao! Ti ho invitato a organizzare «" + w.title + "» su Nozze in Ordine. Registrati o accedi con questa email da " + link + " e troverai l'invito appena entri.";
    return [pageHead("Persone e inviti", "Chi può vedere e modificare questo matrimonio.", invite),
      h("section", { class: "group" }, h("h2", null, "Membri", h("span", { class: "count" }, members.length)),
        h("ul", { class: "people" }, members.map(function (m) {
          var self = m.user_id === me.id;
          return h("li", null, h("span", null, h("b", null, (m.full_name || m.email) + (self ? " (tu)" : "")), h("small", null, m.email)), chip(LABEL.member[m.member_role], m.member_role === "planner" ? "on" : ""),
            (self || planner) ? h("span", { class: "row-actions" }, iconBtn(self ? "Esci" : "Togli", async function () {
              if (!await confirmBox(self ? "Uscire da questo matrimonio?" : "Togliere questa persona?", self ? "Non vedrai più i suoi dati, finché qualcuno non ti invita di nuovo." : (m.full_name || m.email) + " non vedrà più questo matrimonio.", self ? "Esci" : "Togli")) return;
              await attempt(function () { return api.removeMember(w.id, m.user_id); }, "Fatto.");
              if (self) { await loadBase(); go(""); } else render();
            }, "danger")) : null);
        }))),
      h("section", { class: "group" }, h("h2", null, "Inviti in attesa", h("span", { class: "count" }, invites.length)),
        invites.length ? h("ul", { class: "people" }, invites.map(function (i) {
          return h("li", null, h("span", null, h("b", null, i.email), h("small", null, "Scade il " + fmtDate(i.expires_at))), chip(LABEL.member[i.member_role], i.member_role === "planner" ? "on" : ""),
            h("span", { class: "row-actions" }, iconBtn("Annulla", async function () { await attempt(function () { return api.deleteInvite(i.id); }, "Invito annullato."); render(); }, "danger")));
        })) : h("p", { class: "soft" }, "Nessun invito in attesa."),
        h("div", { class: "share" }, h("p", { class: "lbl" }, "Messaggio da mandare a chi inviti"), h("p", { class: "share-text" }, msg),
          btn("Copia il messaggio", async function () { try { await navigator.clipboard.writeText(msg); toast("Messaggio copiato."); } catch (e) { toast("Copia non riuscita: seleziona il testo a mano.", true); } }, "alt")))];
  }

  /* ------------------------------------------------------------ dati del matrimonio */
  async function settingsView(w) {
    var form = h("form", { class: "grid-form card-form", novalidate: false }, F.wedding.map(function (f) { return field(f, w[f.name]); }),
      h("div", { class: "form-end" }, h("button", { class: "btn", type: "submit" }, "Salva le modifiche")));
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      await attempt(function () { return api.updateWedding(w.id, readForm(form, F.wedding)); }, "Dati salvati. Le scadenze aperte seguono la nuova data.");
      await loadBase(); render();
    });
    var canDelete = state.me.role === "admin" || w.created_by === state.me.id;
    return [pageHead("Dati del matrimonio", "Nome, data, luogo e budget."), form,
      canDelete ? h("section", { class: "danger-zone" }, h("h2", null, "Eliminare il matrimonio"), h("p", null, "Si cancellano per sempre budget, fornitori, invitati, scadenze e scaletta, per tutti i membri."),
        btn("Elimina il matrimonio", async function () {
          if (!await confirmBox("Eliminare «" + w.title + "»?", "Tutti i dati di questo matrimonio verranno cancellati per sempre, per tutti i membri. Non si può annullare.", "Elimina per sempre")) return;
          await attempt(function () { return api.deleteWedding(w.id); }, "Matrimonio eliminato."); await loadBase(); go("");
        }, "danger")) : null];
  }

  /* ------------------------------------------------------------ profilo */
  async function profileView() {
    var me = state.me;
    var f = h("form", { class: "grid-form card-form" }, field({ name: "full_name", label: "Nome e cognome", required: true, max: 120, autocomplete: "name" }, me.full_name),
      h("div", { class: "fld" }, h("p", { class: "lbl" }, "Email"), h("p", null, me.email)),
      h("div", { class: "fld" }, h("p", { class: "lbl" }, "Tipo di account"), h("p", null, LABEL.role[me.role])),
      h("div", { class: "form-end" }, h("button", { class: "btn", type: "submit" }, "Salva")));
    f.addEventListener("submit", async function (e) {
      e.preventDefault(); var n = f.elements.full_name.value.trim(); if (!n) return;
      await attempt(function () { return api.updateMyName(me.id, n); }, "Nome aggiornato."); state.me.full_name = n; render();
    });
    var pw = api.mode === "live" ? h("form", { class: "grid-form card-form" }, field({ name: "password", label: "Nuova password", type: "password", required: true, autocomplete: "new-password", help: "Almeno 8 caratteri." }),
      h("div", { class: "form-end" }, h("button", { class: "btn alt", type: "submit" }, "Cambia password"))) : null;
    if (pw) pw.addEventListener("submit", async function (e) {
      e.preventDefault(); var p = pw.elements.password.value;
      if (p.length < 8) return toast("La password deve avere almeno 8 caratteri.", true);
      await attempt(function () { return api.updatePassword(p); }, "Password cambiata."); pw.reset();
    });
    return [pageHead("Profilo", null), f, pw ? h("h2", { class: "sec" }, "Password") : null, pw,
      h("p", { class: "soft small" }, "Per cambiare tipo di account o cancellarlo scrivi a info@nozzeinordine.com.")];
  }

  /* ------------------------------------------------------------ planner: tutti i matrimoni */
  async function eventsView() {
    var ws = state.weddings;
    var tasks = ws.length ? await api.list("tasks", null) : [];
    var soon = tasks.filter(function (t) { return !t.done && t.due_date && daysTo(t.due_date) <= 7; }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; });
    var title = function (id) { var x = wedding(id); return x ? x.title : ""; };
    var add = btn("Nuovo matrimonio", createWeddingFlow);
    var cards = ws.map(function (w) {
      var tt = tasks.filter(function (t) { return t.wedding_id === w.id; }), done = tt.filter(function (t) { return t.done; }).length;
      var n = daysTo(w.wedding_date);
      return h("a", { class: "tile event", href: "#/m/" + w.id + "/panoramica" },
        h("h2", null, w.title),
        h("p", { class: "meta" }, (w.wedding_date ? fmtDate(w.wedding_date, true) : "Data da decidere") + (w.city ? " · " + w.city : "")),
        h("p", { class: "fig" }, n == null ? "—" : n < 0 ? "Celebrato" : String(n), n != null && n >= 0 ? h("small", null, " giorni") : null),
        bar([[done, "p"]], tt.length || 1, done + " attività fatte su " + tt.length),
        h("p", { class: "soft small" }, done + " di " + tt.length + " attività · " + w.members_count + (w.members_count === 1 ? " persona" : " persone")));
    });
    return [pageHead(state.me.role === "admin" ? "Tutti i matrimoni" : "I miei matrimoni", ws.length ? ws.length + (ws.length === 1 ? " matrimonio" : " matrimoni") : null, add),
      soon.length ? h("section", { class: "group week" }, h("h2", null, "In ritardo o in scadenza entro 7 giorni", h("span", { class: "count" }, soon.length)),
        h("ul", { class: "rows" }, soon.slice(0, 12).map(function (t) {
          return h("li", null, h("a", { href: "#/m/" + t.wedding_id + "/scadenze" }, h("b", null, title(t.wedding_id)), " · " + t.title), h("span", { class: daysTo(t.due_date) < 0 ? "warn" : "soft" }, whenText(t.due_date)));
        }))) : null,
      ws.length ? h("div", { class: "events" }, cards) : empty("Ancora nessun matrimonio. Create il primo: potrete poi invitare gli sposi nel loro portale.", add)];
  }

  /* ------------------------------------------------------------ amministrazione */
  async function adminView(sub) {
    var res = await Promise.all([api.listProfiles(), api.listWaitlist()]);
    var profiles = res[0], wait = res[1], ws = state.weddings;
    var count = function (r) { return profiles.filter(function (p) { return p.role === r; }).length; };
    var tabs = h("nav", { class: "seg small tabs", "aria-label": "Sezioni di amministrazione" }, [["", "Riepilogo"], ["utenti", "Utenti"], ["lista", "Lista d'attesa"]].map(function (t) {
      return h("a", { href: "#/admin" + (t[0] ? "/" + t[0] : ""), class: (sub || "") === t[0] ? "on" : null, "aria-current": (sub || "") === t[0] ? "page" : null }, t[1]);
    }));
    var body;
    if (sub === "utenti") {
      body = h("div", { class: "tscroll" }, h("table", { class: "tbl data" }, h("caption", { class: "sr" }, "Utenti"),
        h("thead", null, h("tr", null, ["Nome", "Email", "Ruolo", "Registrato"].map(function (x) { return h("th", { scope: "col" }, x); }))),
        h("tbody", null, profiles.map(function (p) {
          return h("tr", null, h("th", { scope: "row" }, p.full_name || "—"), h("td", null, p.email),
            h("td", null, h("label", { class: "sr", for: "role-" + p.id }, "Ruolo di " + (p.full_name || p.email)),
              h("select", { id: "role-" + p.id, disabled: p.id === state.me.id, onchange: async function (e) {
                var r = e.target.value;
                if (!await confirmBox("Cambiare il ruolo?", (p.full_name || p.email) + " diventerà " + LABEL.role[r].toLowerCase() + ".", "Cambia")) { render(); return; }
                await attempt(function () { return api.setRole(p.id, r); }, "Ruolo aggiornato."); render();
              } }, opts(LABEL.role).map(function (o) { return h("option", { value: o[0], selected: p.role === o[0] }, o[1]); }))),
            h("td", null, fmtDate(p.created_at)));
        }))));
    } else if (sub === "lista") {
      var exp = btn("Esporta CSV", function () {
        download("lista-attesa.csv", [["Data", "Profilo", "Email", "Zona", "Prezzo", "Matrimoni l'anno", "Strumenti", "Chiamata"]].concat(wait.map(function (x) {
          var d = x.dati || {}; return [fmtDate(x.created_at), x.profilo, x.email, d.zona, d.prezzo, d.eventi, d.strumenti, d.chiamata ? "sì" : ""];
        })));
      }, "alt");
      body = [h("div", { class: "head-actions inline" }, wait.length ? exp : null), wait.length ? h("div", { class: "tscroll" }, h("table", { class: "tbl data" }, h("caption", { class: "sr" }, "Lista d'attesa"),
        h("thead", null, h("tr", null, ["Data", "Profilo", "Email", "Zona", "Prezzo", "Dettagli"].map(function (x) { return h("th", { scope: "col" }, x); }))),
        h("tbody", null, wait.map(function (x) {
          var d = x.dati || {};
          return h("tr", null, h("td", null, fmtDate(x.created_at)), h("td", null, x.profilo), h("th", { scope: "row" }, x.email), h("td", null, d.zona || "—"), h("td", null, d.prezzo || "—"),
            h("td", null, [d.eventi ? d.eventi + " matrimoni l'anno" : null, d.strumenti, d.chiamata ? "vuole una chiamata" : null].filter(Boolean).join(" · ") || "—"));
        })))) : empty("Nessuna iscrizione.")];
    } else {
      body = h("div", { class: "board sum4" },
        h("a", { class: "tile t-count", href: "#/admin/utenti" }, h("p", { class: "lbl" }, "Utenti"), h("p", { class: "fig" }, String(profiles.length)), h("p", { class: "meta" }, count("coppia") + " coppie · " + count("planner") + " planner · " + count("admin") + " admin")),
        h("a", { class: "tile", href: "#/eventi" }, h("p", { class: "lbl" }, "Matrimoni"), h("p", { class: "fig" }, String(ws.length))),
        h("a", { class: "tile", href: "#/admin/lista" }, h("p", { class: "lbl" }, "Lista d'attesa"), h("p", { class: "fig" }, String(wait.length)),
          h("p", { class: "meta" }, wait.filter(function (x) { return x.profilo === "planner"; }).length + " planner · " + wait.filter(function (x) { return x.profilo === "coppia"; }).length + " coppie")),
        h("div", { class: "tile" }, h("p", { class: "lbl" }, "Ultime registrazioni"), h("ul", { class: "rows" }, profiles.slice(0, 5).map(function (p) { return h("li", null, h("span", null, p.full_name || p.email), h("span", { class: "soft" }, LABEL.role[p.role])); }))));
    }
    return [pageHead("Amministrazione", null), tabs, body];
  }

  /* ------------------------------------------------------------ caricamento e disegno */
  async function loadBase() {
    state.me = await api.me();
    if (!state.me) return;
    var r = await Promise.all([api.listWeddings(state.me), api.pendingInvites().catch(function () { return []; })]);
    state.weddings = r[0]; state.invites = r[1] || [];
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
        if (my === renderId) root.replaceChildren(screen);
        return;
      }
      if (p[0] === "nuova-password") { root.replaceChildren(newPasswordScreen()); return; }
      if (!state.me) await loadBase();
      if (!state.me) throw new Error("Profilo non trovato. Esci e accedi di nuovo.");
      var me = state.me, content;
      if (p[0] === "m") {
        var w = wedding(p[1]);
        if (!w) { content = empty("Questo matrimonio non esiste o non hai accesso.", btn("Torna all'inizio", function () { go(""); })); }
        else {
          var sec = p[2] || "panoramica";
          var view = { panoramica: overview, scadenze: tasksView, budget: budgetView, fornitori: vendorsView, invitati: guestsView, scaletta: timelineView, note: notesView, persone: peopleView, impostazioni: settingsView }[sec] || overview;
          if (sec === "note" && !isPlannerHere(w)) view = overview;
          root.replaceChildren(shell(h("p", { class: "loading" }, "Carico…")));
          content = await view(w);
        }
      } else if (p[0] === "eventi" && me.role !== "coppia") content = await eventsView();
      else if (p[0] === "admin" && me.role === "admin") content = await adminView(p[1]);
      else if (p[0] === "profilo") content = await profileView();
      else {
        // pagina iniziale secondo il ruolo
        if (me.role === "admin") return go("admin");
        if (me.role === "planner") return go("eventi");
        if (state.weddings.length) return go("m/" + state.weddings[0].id + "/panoramica");
        content = onboarding();
      }
      if (my !== renderId) return;
      root.replaceChildren(shell(content));
      document.title = (document.querySelector(".page-head h1") || {}).textContent + " · Nozze in Ordine";
    } catch (e) {
      if (my !== renderId) return;
      var box = h("div", { class: "empty" }, h("h1", null, "Qualcosa non ha funzionato"), h("p", null, e.message || String(e)), btn("Riprova", function () { state.me = null; render(); }));
      root.replaceChildren(state.me ? shell(box) : box);
    }
  }

  api.onAuthChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { location.hash = "#/nuova-password"; return; }
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      state.me = null; state.weddings = []; state.invites = [];
      if (event === "SIGNED_OUT") location.hash = "#/accedi";
      setTimeout(render, 0);
    }
  });
  render();
})();
