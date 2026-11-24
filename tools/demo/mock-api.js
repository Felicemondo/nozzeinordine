/* Nozze in Ordine: demo con dati finti. Stessa interfaccia di api.js, tutto in memoria:
   ricaricando la pagina si riparte da capo e niente esce dal browser. */
(function () {
  var uid = function () { return "x" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); };
  var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var addDays = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  var addMonthsTo = function (s, m, dd) {
    if (!s) return null;
    var p = s.split("-").map(Number), d = new Date(p[0], p[1] - 1 - m, p[2] - (dd || 0));
    return iso(d);
  };

  var USERS = {
    coppia: { id: "u-anna", role: "coppia", full_name: "Anna Russo", email: "anna@esempio.it", phone: "", business_name: "", city: "Caserta", notify_days: 3, created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
    planner: { id: "u-bea", role: "planner", plan: "prova", trial_ends_at: new Date(Date.now() + 86400000 * 21).toISOString(), full_name: "Beatrice Esposito", email: "bea@esempio.it", phone: "333 000 0000", business_name: "Esposito Wedding Studio", city: "Napoli", notify_days: 7, weddings_per_year: "1-5", work_mode: "autonomia", created_at: new Date(Date.now() - 86400000 * 40).toISOString() },
    admin: { id: "u-admin", role: "admin", full_name: "Amministrazione", email: "info@nozzeinordine.com", phone: "", business_name: "", city: "", notify_days: 3, created_at: new Date(Date.now() - 86400000 * 60).toISOString() }
  };
  var TEMPLATE = [
    ["Fissare la data e il tipo di rito", 0, 14, 0], ["Definire il budget complessivo", 0, 13, 0],
    ["Scegliere e prenotare la location", 0, 12, 0], ["Stilare la prima lista degli invitati", 0, 12, 0],
    ["Fotografo e video: confrontare e prenotare", 1, 10, 0], ["Catering: chiedere e confrontare i preventivi", 1, 10, 0],
    ["Musica e intrattenimento", 1, 9, 0], ["Prenotare il rito in comune o in parrocchia", 1, 9, 0],
    ["Inviare i save the date", 2, 8, 0], ["Scegliere gli abiti", 2, 7, 0], ["Fiori e allestimenti", 2, 6, 0],
    ["Ordinare partecipazioni e bomboniere", 2, 6, 0], ["Inviare le partecipazioni", 3, 5, 0],
    ["Definire il menù con il catering", 3, 4, 0], ["Documenti per le pubblicazioni", 3, 3, 0],
    ["Raccogliere le risposte degli invitati", 4, 2, 0], ["Saldi dei fornitori principali", 4, 1, 0],
    ["Confermare orari con tutti i fornitori", 4, 0, 14], ["Ultima conferma dei numeri al catering", 5, 0, 7],
    ["Condividere la scaletta con fornitori e testimoni", 5, 0, 5]
  ];

  var db = {
    profiles: [USERS.coppia, USERS.planner, USERS.admin,
      { id: "u-marco", role: "coppia", full_name: "Marco De Luca", email: "marco@esempio.it", created_at: null },
      { id: "u-sara", role: "coppia", full_name: "Sara Gallo", email: "sara@esempio.it", created_at: null }],
    weddings: [], wedding_members: [], wedding_invites: [],
    budget_items: [], vendors: [], quotes: [], guests: [], tasks: [], timeline_items: [], internal_notes: [], seating_tables: [],
    waitlist: [
      { id: 1, created_at: new Date(Date.now() - 86400000 * 3).toISOString(), profilo: "planner", email: "studio@esempio.it", consenso: true, stato: "contattata", dati: { modulo: "richiesta-1", studio: "Studio Esempio", zona: "napoli", team: "2-3", eventi: "5-10", in_corso: 7, strumenti: "fogli-whatsapp", perdite: ["pagamenti", "sposi"], pilota: "si", chiamata: true } },
      { id: 2, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), profilo: "coppia", email: "coppia@esempio.it", consenso: true, stato: "nuova", dati: { modulo: "richiesta-1", nome: "Lucia e Paolo", mese: "06", anno: "2027", zona: "caserta", invitati: "100-150", planner: "no", pesi: ["budget", "tavoli"], prezzo49: "si", prova: true, note: "Ci servirebbe soprattutto la parte dei tavoli." } },
      { id: 3, created_at: new Date(Date.now() - 86400000).toISOString(), profilo: "coppia", email: "sposi@esempio.it", consenso: true, stato: "nuova", dati: { modulo: "richiesta-1", mese: "09", anno: "2027", zona: "salerno", invitati: "50-100", planner: "cerchiamo", prezzo49: "forse" } },
      { id: 4, created_at: new Date(Date.now() - 3600000 * 5).toISOString(), profilo: "coppia", email: "noi@esempio.it", consenso: true, stato: "nuova", dati: { modulo: "richiesta-1", mese: "nd", anno: "nd", zona: "napoli", invitati: "nd", planner: "no", prezzo49: "no" } }
    ]
  };

  // come nel database: una scadenza calcolata nel passato nasce a una settimana da oggi
  // e senza data non nasce nessuna scadenza automatica
  function seedTasks(w, clamp) {
    if (!w.wedding_date || db.tasks.some(function (t) { return t.wedding_id === w.id && t.offset_months != null; })) return;
    var floor = addDays(7);
    TEMPLATE.forEach(function (t) {
      var due = addMonthsTo(w.wedding_date, t[2], t[3]);
      if (clamp && due && due < floor) due = floor < w.wedding_date ? floor : w.wedding_date;
      db.tasks.push({ id: uid(), wedding_id: w.id, title: t[0], phase: t[1], offset_months: t[2], offset_days: t[3],
        due_date: due, done: false, assignee: "sposi", created_at: new Date().toISOString() });
    });
  }
  function wedding(id, title, date, city, budget, guests, members) {
    var names = title.split(" e ");
    var w = { id: id, title: title, partner_a: names[0] || "", partner_b: names[1] || "", wedding_date: date, city: city, ceremony: "religioso", budget_total: budget, guests_expected: guests, priorities: ["spese", "invitati"], stage: "qualcosa", vendor_categories: [], created_by: members[0][0], created_at: new Date().toISOString() };
    w.plan = members.some(function (m) { return m[1] === "planner"; }) ? "planner" : "completo";
    db.weddings.push(w);
    members.forEach(function (m) { db.wedding_members.push({ wedding_id: id, user_id: m[0], member_role: m[1], created_at: w.created_at }); });
    seedTasks(w);
    return w;
  }

  // dati di esempio, coerenti con quelli del sito
  // Anna e Marco organizzano da soli; Beatrice segue Sara e Paolo (la coppia lì è in sola lettura)
  wedding("w-anna", "Anna e Marco", addDays(232), "Caserta", 26000, 150, [["u-anna", "sposi"], ["u-marco", "sposi"]]);
  // ?piano=gratis|tableau|completo: il matrimonio della coppia con un altro piano, per provare sblocchi e anteprime
  var forcedPlan = /[?&]piano=(gratis|tableau|completo)/.exec(location.search);
  if (forcedPlan) db.weddings[0].plan = forcedPlan[1];
  wedding("w-sara", "Sara e Paolo", addDays(330), "Napoli", 32000, 180, [["u-bea", "planner"], ["u-sara", "sposi"]]);
  wedding("w-giulia", "Giulia e Andrea", addDays(345), "Salerno", 21000, 110, [["u-bea", "planner"]]);
  // per ogni matrimonio: le prime attività già passate sono fatte, le altre restano in ritardo (dati fissi, non casuali)
  ["w-anna", "w-sara", "w-giulia"].forEach(function (wid, k) {
    var past = db.tasks.filter(function (t) { return t.wedding_id === wid && t.due_date && t.due_date < iso(new Date()); });
    past.slice(0, [4, 1, 3][k]).forEach(function (t) { t.done = true; });
  });
  // gli stessi dati di esempio per il matrimonio della coppia e per quello seguito dalla planner
  function sample(wid) {
    var now = new Date().toISOString();
    [["Location e ricevimento", "Villa con giardino", 0, 0, 3000, addDays(14), 0, 0, 3500], ["Catering", "Menù di cinque portate", 0, 0, 2000, addDays(30), 95, 45, null],
     ["Fotografo e video", "Studio Luce", 2400, 2200, 700, addDays(40)], ["Abiti e accessori", "Sposa e sposo", 3600, 2900, 1450, addDays(90)], ["Musica e intrattenimento", "Band per la festa", 1500, 1200, 300, addDays(60)],
     ["Fiori e allestimenti", "", 1800, 0, 0, null], ["Bomboniere", "Ceramica di Vietri", 0, 0, 0, null, 12, 0, null], ["Partecipazioni e stampa", "Carta cotone", 0, 0, 0, null, 6.5, 0, null],
     ["Viaggio di nozze", "Giappone, 12 giorni", 4500, 0, 0, addDays(150)]]
      .forEach(function (b) { var dp = { "Location e ricevimento": [3000, -20], "Catering": [2000, -5], "Fotografo e video": [700, -10], "Abiti e accessori": [1450, -30], "Musica e intrattenimento": [600, 20], "Viaggio di nozze": [1500, 45] }[b[0]];
        db.budget_items.push({ id: uid(), wedding_id: wid, category: b[0], description: b[1], planned: b[2], contracted: b[3], paid: b[4], due_date: b[5], deposit: dp ? dp[0] : 0, deposit_due: dp ? addDays(dp[1]) : null, unit_price: b[6] || 0, unit_child: b[7] || 0, rental_amount: b[8] == null ? null : b[8], created_at: now }); });
    var v = function (category, name, contact, status, notes, quotes) {
      var x = { id: uid(), wedding_id: wid, category: category, name: name, contact: contact, status: status, notes: notes, created_at: now };
      db.vendors.push(x);
      quotes.forEach(function (q) { db.quotes.push({ id: uid(), wedding_id: wid, vendor_id: x.id, label: q[0], amount: q[1], per_person: q[2], includes: q[3] || "", expires_on: q[4] || null, chosen: false, created_at: now }); });
    };
    v("Catering", "Sapori di Terra di Lavoro", "081 000 0000", "in_trattativa", "Cinque portate, prodotti del territorio. Degustazione da fissare.", [["Menù", 95, true, "Aperitivo incluso", addDays(36)], ["Open bar", 1200, false, "Tre ore dopo la torta"]]);
    v("Catering", "Cucina dei Campi", "cucina@esempio.it", "da_scegliere", "Menù a km zero, torta nuziale inclusa.", [["Menù", 88, true, "Torta inclusa", addDays(51)], ["Allestimento buffet", 900, false]]);
    v("Fotografo e video", "Studio Luce", "studio@esempio.it", "confermato", "Servizio completo con drone.", [["Servizio completo", 2200, false, "Album e video"]]);
    v("Fotografo e video", "Scatti Veri", "333 111 2222", "scartato", "Solo foto, niente video.", [["Reportage", 1900, false]]);
    v("Musica e intrattenimento", "Trio Vesuvio", "", "da_scegliere", "Musica dal vivo per rito e aperitivo.", [["Rito e aperitivo", 900, false]]);
    v("Musica e intrattenimento", "DJ Notte", "dj@esempio.it", "in_trattativa", "DJ set fino all'una, luci incluse.", [["DJ set", 750, false], ["Luci", 250, false]]);
    // 64 invitati in cinque gruppi: famiglie a nuclei di quattro con qualche bambino, amici uno per uno
    var gi = 0, menus = ["standard", "standard", "standard", "vegetariano", "standard", "no_pesce", "standard", "vegano"], ALL = [[], [], ["glutine"], [], [], ["lattosio"], [], [], [], ["frutta_guscio"]];
    GROUPS.forEach(function (gr) {
      for (var k = 0; k < gr[2]; k++) {
        var r = gi % 9 === 4 ? "no" : gi % 7 === 3 ? "in_attesa" : "si", fam = gr[0].indexOf("famiglia") === 0, kid = fam && k % 4 === 3;
        db.guests.push({ id: uid(), wedding_id: wid, household: fam ? gr[1] + " " + (1 + Math.floor(k / 4)) : "", name: (kid ? "Bambino · " : "") + FIRST[(gi * 7) % FIRST.length] + " " + gr[3], guest_group: gr[0], rsvp: r,
          age_band: kid ? (k === 3 ? "under3" : "bambino") : "adulto", menu: menus[gi % menus.length], allergies: ALL[gi % ALL.length], allergies_note: "", notes: "", table_id: null, seat_number: null, created_at: now });
        gi++;
      }
    });
    var first = db.seating_tables.length;
    TABLES.forEach(function (t) { db.seating_tables.push({ id: uid(), wedding_id: wid, name: t[0], seats: t[1], shape: t[2], kind: t[5] || "ospiti", pos_x: t[3], pos_y: t[4], created_at: now }); });
    var seat = function (group, tableIdx, howMany) {
      var t = db.seating_tables[first + tableIdx], n = 0;
      db.guests.filter(function (g) { return g.wedding_id === wid && g.guest_group === group && g.rsvp !== "no" && !g.table_id; }).slice(0, howMany).forEach(function (g) { g.table_id = t.id; g.seat_number = ++n; });
    };
    seat("famiglia_a", 1, 10); seat("famiglia_b", 2, 9); seat("amici_a", 4, 6);
    [["11:00", "Preparazione della sposa", "Casa della sposa", "Truccatrice", "a"], ["12:00", "Preparazione dello sposo", "Casa dello sposo", "Testimone", "b"],
     ["15:30", "Arrivo degli invitati", "Chiesa di San Michele", "Wedding planner", "comune"], ["16:00", "Cerimonia", "Chiesa di San Michele", "Celebrante", "comune"],
     ["17:30", "Foto di gruppo", "Sagrato", "Fotografo", "comune"], ["18:30", "Aperitivo in giardino", "Villa", "Catering", "comune"], ["20:00", "Cena", "Villa", "Catering", "comune"]]
      .forEach(function (t) { db.timeline_items.push({ id: uid(), wedding_id: wid, start_time: t[0] + ":00", title: t[1], place: t[2], owner: t[3], party: t[4], created_at: now }); });
  }
  var FIRST = ["Giovanni", "Maria", "Luca", "Carmela", "Francesca", "Davide", "Elena", "Pietro", "Rosa", "Antonio", "Chiara", "Salvatore", "Teresa", "Vincenzo", "Giulia", "Alessandro", "Sofia", "Raffaele", "Martina", "Gennaro", "Laura", "Ciro", "Valentina", "Pasquale", "Federica", "Michele", "Serena", "Nicola", "Ilaria", "Domenico", "Paola", "Stefano"];
  var GROUPS = [["famiglia_a", "Famiglia Russo", 16, "Russo"], ["famiglia_b", "Famiglia De Luca", 14, "De Luca"], ["amici_a", "Amici di Anna", 12, "Bianchi"], ["amici_b", "Amici di Marco", 12, "Romano"], ["amici_comuni", "Amici comuni", 10, "Conti"]];
  var TABLES = [["Sposi", 2, "rettangolare", 50, 12, "sposi"], ["Capri", 10, "rotondo", 18, 42], ["Ischia", 10, "rotondo", 50, 45], ["Procida", 10, "rotondo", 82, 42], ["Amalfi", 12, "rotondo", 30, 78], ["Positano", 12, "rotondo", 70, 78]];
  sample("w-anna"); sample("w-sara");
  db.internal_notes.push({ id: uid(), wedding_id: "w-sara", body: "La sposa preferisce non avere fiori bianchi sui tavoli.", created_by: "u-bea", created_at: new Date().toISOString() });
  db.wedding_invites.push({ id: uid(), wedding_id: "w-giulia", email: "giulia@esempio.it", member_role: "sposi", token: uid(), accepted_at: null, expires_at: addDays(30), created_at: new Date().toISOString() });

  var me = null, listeners = [];
  var params = new URLSearchParams(location.search);
  var startRole = params.get("ruolo");
  if (USERS[startRole]) me = USERS[startRole];

  var wait = function () { return new Promise(function (r) { setTimeout(r, 60); }); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var isMember = function (wid) { return me && (me.role === "admin" || db.wedding_members.some(function (m) { return m.wedding_id === wid && m.user_id === me.id; })); };
  var isPlanner = function (wid) { return me && (me.role === "admin" || db.wedding_members.some(function (m) { return m.wedding_id === wid && m.user_id === me.id && m.member_role === "planner"; })); };
  function guard(table, wid) {
    if (!me) throw new Error("Accesso richiesto");
    if (table === "internal_notes" ? !isPlanner(wid) : !isMember(wid)) throw new Error("Non hai i permessi per questa operazione.");
  }
  // come nel database: con una planner nel matrimonio, la coppia scrive solo invitati e tavoli
  var hasPlanner = function (wid) { return db.wedding_members.some(function (m) { return m.wedding_id === wid && m.member_role === "planner"; }); };
  function guardWrite(table, wid) {
    guard(table, wid);
    if (table !== "guests" && table !== "seating_tables" && !isPlanner(wid) && hasPlanner(wid)) throw new Error("Non hai i permessi per questa operazione.");
  }
  var cmp = function (k, asc) { return function (a, b) { var x = a[k], y = b[k]; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1); }; };
  var ORDER = { budget_items: ["category", true], vendors: ["category", true], quotes: ["created_at", true], guests: ["household", true], tasks: ["due_date", true], timeline_items: ["start_time", true], internal_notes: ["created_at", false], seating_tables: ["created_at", true] };

  window.NIO_API = {
    mode: "demo",
    demoUsers: USERS,
    _db: db, // solo per le prove automatiche della demo
    session: async function () { return me ? { user: { id: me.id } } : null; },
    onAuthChange: function (cb) { listeners.push(cb); },
    signIn: async function () { throw new Error("Nella demo scegli un profilo qui sotto: non servono password."); },
    signUp: async function () { throw new Error("Nella demo non si creano account."); },
    demoSignIn: async function (role) { await wait(); me = USERS[role]; listeners.forEach(function (l) { l("SIGNED_IN", { user: { id: me.id } }); }); },
    signOut: async function () { me = null; listeners.forEach(function (l) { l("SIGNED_OUT", null); }); },
    resetPassword: async function () { throw new Error("Non disponibile nella demo."); },
    updatePassword: async function () { throw new Error("Non disponibile nella demo."); },

    me: async function () { await wait(); return me ? clone(me) : null; },
    updateMyProfile: async function (id, patch) { ["full_name", "phone", "business_name", "city", "notify_days", "weddings_per_year", "work_mode"].forEach(function (k) { if (k in patch) me[k] = patch[k]; }); },

    listWeddings: async function () {
      await wait();
      return clone(db.weddings.filter(function (w) { return isMember(w.id); }).map(function (w) {
        var ms = db.wedding_members.filter(function (m) { return m.wedding_id === w.id; });
        var mine = ms.filter(function (m) { return m.user_id === me.id; })[0];
        return Object.assign({}, w, { my_role: mine ? mine.member_role : null, members_count: ms.length, has_planner: ms.some(function (m) { return m.member_role === "planner"; }) });
      }).sort(cmp("wedding_date", true)));
    },
    createWedding: async function (data) {
      await wait();
      var w = Object.assign({ id: uid(), city: "", partner_a: "", partner_b: "", ceremony: "da_decidere", budget_total: 0, guests_expected: 0, priorities: [], stage: null, vendor_categories: [], created_by: me.id, created_at: new Date().toISOString() }, data);
      w.plan = me.role === "planner" ? "planner" : "gratis";
      db.weddings.push(w);
      db.wedding_members.push({ wedding_id: w.id, user_id: me.id, member_role: me.role === "planner" ? "planner" : "sposi", created_at: w.created_at });
      seedTasks(w, true);
      return w.id;
    },
    getWedding: async function (id) { await wait(); return isMember(id) ? clone(db.weddings.filter(function (w) { return w.id === id; })[0] || null) : null; },
    updateWedding: async function (id, patch) {
      guardWrite("weddings", id);
      var w = db.weddings.filter(function (x) { return x.id === id; })[0];
      var dateChanged = patch.wedding_date !== undefined && patch.wedding_date !== w.wedding_date, wasNull = !w.wedding_date;
      Object.assign(w, patch);
      if (dateChanged && wasNull && !db.tasks.some(function (t) { return t.wedding_id === id && t.offset_months != null; })) { seedTasks(w, true); return; }
      if (dateChanged) db.tasks.forEach(function (t) { if (t.wedding_id === id && !t.done && t.offset_months != null) t.due_date = addMonthsTo(w.wedding_date, t.offset_months, t.offset_days); });
    },
    deleteWedding: async function (id) {
      guard("weddings", id);
      Object.keys(db).forEach(function (k) { if (Array.isArray(db[k]) && k !== "profiles" && k !== "waitlist") db[k] = db[k].filter(function (r) { return (r.wedding_id || r.id) !== id; }); });
    },

    listMembers: async function (wid) {
      guard("weddings", wid);
      return db.wedding_members.filter(function (m) { return m.wedding_id === wid; }).map(function (m) {
        var p = db.profiles.filter(function (x) { return x.id === m.user_id; })[0] || {};
        return { user_id: m.user_id, member_role: m.member_role, full_name: p.full_name || "", email: p.email || "" };
      });
    },
    removeMember: async function (wid, u) { guard("weddings", wid); db.wedding_members = db.wedding_members.filter(function (m) { return !(m.wedding_id === wid && m.user_id === u); }); },
    listInvites: async function (wid) { guard("weddings", wid); return clone(db.wedding_invites.filter(function (i) { return i.wedding_id === wid; })); },
    createInvite: async function (wid, email, role) {
      guardWrite("weddings", wid);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) throw new Error("Uno dei valori non è valido.");
      db.wedding_invites.push({ id: uid(), wedding_id: wid, email: email.trim(), member_role: role, token: uid(), accepted_at: null, expires_at: addDays(30), created_at: new Date().toISOString() });
    },
    deleteInvite: async function (id) { db.wedding_invites = db.wedding_invites.filter(function (i) { return i.id !== id; }); },
    pendingInvites: async function () { return []; },
    acceptInvite: async function () { throw new Error("Non disponibile nella demo."); },

    list: async function (table, wid) {
      await wait();
      if (wid) guard(table, wid);
      var o = ORDER[table];
      return clone(db[table].filter(function (r) { return wid ? r.wedding_id === wid : (table === "internal_notes" ? isPlanner(r.wedding_id) : isMember(r.wedding_id)); }).sort(cmp(o[0], o[1])));
    },
    insert: async function (table, row) {
      await wait();
      // come il database: si possono inserire più righe insieme
      [].concat(row).forEach(function (row) {
        guardWrite(table, row.wedding_id);
        var base = { id: uid(), created_at: new Date().toISOString() };
        if (table === "guests") Object.assign(base, { table_id: null, seat_number: null, guest_group: "amici_comuni", age_band: "adulto", allergies: [], allergies_note: "" });
        if (table === "seating_tables") Object.assign(base, { seats: 10, shape: "rotondo", kind: "ospiti", pos_x: 50, pos_y: 50 });
        if (table === "timeline_items") base.party = "comune";
        if (table === "budget_items") Object.assign(base, { unit_price: 0, unit_child: 0, rental_amount: null });
        db[table].push(Object.assign(base, row));
      });
    },
    update: async function (table, id, patch) {
      await wait();
      var r = db[table].filter(function (x) { return x.id === id; })[0];
      guardWrite(table, r.wedding_id);
      // stesse regole del database per tavoli e posti
      if (table === "guests" && patch.table_id) {
        var t = db.seating_tables.filter(function (x) { return x.id === patch.table_id && x.wedding_id === r.wedding_id; })[0];
        if (!t) throw new Error("Uno dei valori non è valido.");
        if (patch.seat_number > t.seats) throw new Error("Il tavolo ha solo " + t.seats + " posti");
        if (db.guests.some(function (g) { return g.id !== id && g.table_id === patch.table_id && g.seat_number === patch.seat_number; })) throw new Error("Quel posto è già occupato.");
      }
      if (table === "seating_tables" && patch.seats && patch.seats < r.seats && db.guests.some(function (g) { return g.table_id === id && g.seat_number > patch.seats; }))
        throw new Error("Prima libera i posti oltre il numero " + patch.seats);
      Object.assign(r, patch);
    },
    remove: async function (table, id) {
      await wait();
      var r = db[table].filter(function (x) { return x.id === id; })[0];
      guardWrite(table, r.wedding_id);
      db[table] = db[table].filter(function (x) { return x.id !== id; });
      if (table === "vendors") db.quotes = db.quotes.filter(function (q) { return q.vendor_id !== id; });
      if (table === "seating_tables") db.guests.forEach(function (g) { if (g.table_id === id) { g.table_id = null; g.seat_number = null; } });
    },

    requestPlan: async function () {},
    trackUnlock: async function () {},
    myPlanRequests: async function () { return []; },
    listPurchases: async function () { return []; },
    listUnlockClicks: async function () { return []; },
    listPlanRequests: async function () { return []; },
    setPlanRequestStatus: async function () {},
    setWeddingPlan: async function (wid, plan) { db.weddings.forEach(function (w) { if (w.id === wid) w.plan = plan; }); },
    setProfilePlan: async function (uid, plan) { db.profiles.forEach(function (p) { if (p.id === uid) p.plan = plan; }); },
    listProfiles: async function () { if (me.role !== "admin") throw new Error("Non hai i permessi per questa operazione."); return clone(db.profiles); },
    setRole: async function (u, role) {
      if (me.role !== "admin") throw new Error("Solo un amministratore può cambiare i ruoli");
      if (u === me.id && role !== "admin") throw new Error("Non puoi togliere a te stesso il ruolo di amministratore");
      db.profiles.filter(function (p) { return p.id === u; })[0].role = role;
    },
    listWaitlist: async function () { if (me.role !== "admin") throw new Error("Non hai i permessi per questa operazione."); return clone(db.waitlist).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }); },
    setWaitlistStatus: async function (id, stato) {
      if (me.role !== "admin") throw new Error("Non hai i permessi per questa operazione.");
      db.waitlist.filter(function (x) { return x.id === id; })[0].stato = stato;
    }
  };
})();
