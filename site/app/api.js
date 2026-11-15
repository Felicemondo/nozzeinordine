/* Nozze in Ordine: accesso ai dati tramite Supabase.
   Tutte le regole di sicurezza stanno nel database (RLS): qui si usa solo la chiave publishable.
   La stessa interfaccia è implementata in mock-api.js per la demo con dati finti. */
(function () {
  var SUPABASE_URL = "https://msokhiezfsmkqsvzgmmi.supabase.co";
  var SUPABASE_KEY = "sb_publishable_kBqdAb3VA2lb4YJ45aA_2Q_0c0EQ85Q";

  var MODULES = ["budget_items", "vendors", "quotes", "guests", "tasks", "timeline_items", "internal_notes", "seating_tables"];
  var ORDER = {
    budget_items: ["category", true], vendors: ["category", true], quotes: ["created_at", true],
    guests: ["household", true], tasks: ["due_date", true], timeline_items: ["start_time", true],
    internal_notes: ["created_at", false], seating_tables: ["created_at", true]
  };

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // Gli errori di Supabase arrivano in inglese: li traduco quelli che una persona può incontrare.
  function tr(err) {
    var m = (err && (err.message || err.error_description)) || String(err);
    var map = [
      [/Invalid login credentials/i, "Email o password non corrette."],
      [/Email not confirmed/i, "Conferma prima l'indirizzo email: ti abbiamo mandato un link."],
      [/User already registered/i, "Esiste già un account con questa email. Prova ad accedere."],
      [/Password should be at least/i, "La password deve avere almeno 8 caratteri."],
      [/rate limit/i, "Troppi tentativi ravvicinati. Riprova tra qualche minuto."],
      [/violates check constraint/i, "Uno dei valori non è valido."],
      [/guests_one_per_seat/i, "Quel posto è già occupato."],
      [/duplicate key/i, "Esiste già."],
      [/row-level security|permission denied/i, "Non hai i permessi per questa operazione."],
      [/Failed to fetch|NetworkError/i, "Connessione assente. Controlla la rete e riprova."]
    ];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(m)) return new Error(map[i][1]);
    return new Error(m);
  }
  function ok(res) { if (res.error) throw tr(res.error); return res.data; }
  function checkModule(t) { if (MODULES.indexOf(t) < 0) throw new Error("Modulo sconosciuto: " + t); }
  var appUrl = function () { return location.origin + location.pathname.replace(/[^/]*$/, ""); };

  window.NIO_API = {
    mode: "live",

    /* ---- accesso ---- */
    session: async function () { return ok(await sb.auth.getSession()).session; },
    onAuthChange: function (cb) { sb.auth.onAuthStateChange(function (event, session) { cb(event, session); }); },
    signIn: async function (email, password) { ok(await sb.auth.signInWithPassword({ email: email, password: password })); },
    signUp: async function (p) {
      var data = ok(await sb.auth.signUp({
        email: p.email, password: p.password,
        options: { emailRedirectTo: appUrl(), data: { full_name: p.full_name, role: p.role === "planner" ? "planner" : "coppia", terms_version: "2026-11-15", terms_accepted_at: new Date().toISOString() } }
      }));
      return { needsConfirmation: !data.session };
    },
    signOut: async function () { ok(await sb.auth.signOut()); },
    resetPassword: async function (email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() + "#/nuova-password" })); },
    updatePassword: async function (password) { ok(await sb.auth.updateUser({ password: password })); },

    /* ---- profilo ---- */
    me: async function () {
      var u = ok(await sb.auth.getUser()).user;
      if (!u) return null;
      var COLS = "id, role, full_name, email, phone, business_name, city, notify_days, weddings_per_year, work_mode, created_at, plan, trial_ends_at";
      var p = ok(await sb.from("profiles").select(COLS).eq("id", u.id).maybeSingle());
      // Profilo mancante (riga cancellata per errore): il database lo ricrea dai dati della registrazione.
      if (!p) { try { ok(await sb.rpc("ensure_profile")); p = ok(await sb.from("profiles").select(COLS).eq("id", u.id).maybeSingle()); } catch (e) {} }
      return p || { id: u.id, role: "coppia", full_name: "", email: u.email, phone: "", business_name: "", city: "", notify_days: 3 };
    },
    updateMyProfile: async function (id, patch) {
      var allowed = {}; ["full_name", "phone", "business_name", "city", "notify_days", "weddings_per_year", "work_mode"].forEach(function (k) { if (k in patch) allowed[k] = patch[k]; });
      ok(await sb.from("profiles").update(allowed).eq("id", id));
    },

    /* ---- matrimoni ---- */
    listWeddings: async function (me) {
      var rows = ok(await sb.from("weddings").select("*, wedding_members(user_id, member_role)").order("wedding_date", { ascending: true, nullsFirst: false }));
      return rows.map(function (w) {
        var mine = (w.wedding_members || []).filter(function (m) { return m.user_id === me.id; })[0];
        w.my_role = mine ? mine.member_role : null;
        w.members_count = (w.wedding_members || []).length;
        w.has_planner = (w.wedding_members || []).some(function (m) { return m.member_role === "planner"; });
        delete w.wedding_members;
        return w;
      });
    },
    // L'id nasce nel browser: la riga è leggibile solo dopo che il trigger mi ha aggiunto tra i membri.
    createWedding: async function (data) {
      var id = crypto.randomUUID();
      ok(await sb.from("weddings").insert(Object.assign({ id: id }, data)));
      return id;
    },
    getWedding: async function (id) { return ok(await sb.from("weddings").select("*").eq("id", id).maybeSingle()); },
    updateWedding: async function (id, patch) { ok(await sb.from("weddings").update(patch).eq("id", id)); },
    deleteWedding: async function (id) { ok(await sb.from("weddings").delete().eq("id", id)); },

    /* ---- membri e inviti ---- */
    listMembers: async function (wid) {
      var ms = ok(await sb.from("wedding_members").select("user_id, member_role, created_at").eq("wedding_id", wid));
      if (!ms.length) return [];
      var ps = ok(await sb.from("profiles").select("id, full_name, email").in("id", ms.map(function (m) { return m.user_id; })));
      return ms.map(function (m) {
        var p = ps.filter(function (x) { return x.id === m.user_id; })[0] || {};
        return { user_id: m.user_id, member_role: m.member_role, full_name: p.full_name || "", email: p.email || "" };
      });
    },
    removeMember: async function (wid, uid) { ok(await sb.from("wedding_members").delete().eq("wedding_id", wid).eq("user_id", uid)); },
    listInvites: async function (wid) {
      return ok(await sb.from("wedding_invites").select("id, email, member_role, accepted_at, expires_at, created_at").eq("wedding_id", wid).order("created_at", { ascending: false }));
    },
    createInvite: async function (wid, email, role, me) {
      ok(await sb.from("wedding_invites").insert({ wedding_id: wid, email: email.trim(), member_role: role, invited_by: me.id }));
    },
    deleteInvite: async function (id) { ok(await sb.from("wedding_invites").delete().eq("id", id)); },
    pendingInvites: async function () { return ok(await sb.rpc("my_pending_invites")); },
    acceptInvite: async function (token) { return ok(await sb.rpc("accept_invite", { invite_token: token })); },

    /* ---- moduli ---- */
    list: async function (table, wid) {
      checkModule(table);
      var q = sb.from(table).select("*");
      if (wid) q = q.eq("wedding_id", wid);
      var o = ORDER[table];
      return ok(await q.order(o[0], { ascending: o[1], nullsFirst: false }));
    },
    insert: async function (table, row) { checkModule(table); ok(await sb.from(table).insert(row)); },
    update: async function (table, id, patch) { checkModule(table); ok(await sb.from(table).update(patch).eq("id", id)); },
    remove: async function (table, id) { checkModule(table); ok(await sb.from(table).delete().eq("id", id)); },

    /* ---- amministrazione ---- */
    listProfiles: async function () { return ok(await sb.from("profiles").select("*").order("created_at", { ascending: false })); },
    setRole: async function (uid, role) { ok(await sb.rpc("admin_set_role", { target: uid, new_role: role })); },
    /* ---- piani: gli utenti li chiedono, l'amministrazione li assegna ---- */
    requestPlan: async function (plan, wid) {
      var r = await sb.from("plan_requests").insert({ plan: plan, wedding_id: wid || null });
      if (r.error && /duplicate key/i.test(r.error.message || "")) throw new Error("La richiesta è già stata inviata: ti scriviamo per email.");
      ok(r);
    },
    listPlanRequests: async function () { return ok(await sb.from("plan_requests").select("*").order("created_at", { ascending: false })); },
    setPlanRequestStatus: async function (id, stato) { ok(await sb.from("plan_requests").update({ stato: stato }).eq("id", id)); },
    setWeddingPlan: async function (wid, plan) { ok(await sb.rpc("admin_set_wedding_plan", { target: wid, new_plan: plan })); },
    setProfilePlan: async function (uid, plan, trialDays) { ok(await sb.rpc("admin_set_profile_plan", { target: uid, new_plan: plan, trial_days: trialDays || null })); },
    listWaitlist: async function () { return ok(await sb.from("waitlist").select("*").order("created_at", { ascending: false })); },
    setWaitlistStatus: async function (id, stato) { ok(await sb.from("waitlist").update({ stato: stato }).eq("id", id)); }
  };
})();
