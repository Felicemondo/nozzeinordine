// Prova dal vivo di site/app/api.js contro Supabase, con due account di prova già confermati.
//   NIO_E2E_COPPIA=... NIO_E2E_PLANNER=... NIO_E2E_PASSWORD=... node tests/e2e-api.mjs
// Crea un matrimonio di prova, lo usa con entrambi i ruoli e alla fine lo elimina.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root = new URL("../site/app/", import.meta.url);
const vendor = readFileSync(new URL("vendor/supabase.js", root), "utf8");
const apiSrc = readFileSync(new URL("api.js", root), "utf8");

function client() {
  const store = new Map();
  const ctx = {
    console, fetch, Headers, Request, Response, URL, URLSearchParams, AbortController, TextEncoder, TextDecoder, crypto,
    setTimeout, clearTimeout, setInterval, clearInterval, atob, btoa, structuredClone, WebSocket, Event, EventTarget,
    location: { origin: "http://localhost", pathname: "/app/index.html", href: "http://localhost/app/index.html" },
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(vendor, ctx);
  ctx.window.supabase = ctx.supabase;
  vm.runInContext(apiSrc, ctx);
  return ctx.NIO_API;
}

const { NIO_E2E_COPPIA: emailA, NIO_E2E_PLANNER: emailB, NIO_E2E_PASSWORD: pw } = process.env;
if (!emailA || !emailB || !pw) { console.error("Imposta NIO_E2E_COPPIA, NIO_E2E_PLANNER e NIO_E2E_PASSWORD."); process.exit(2); }

const log = (m) => console.log("✓ " + m);
const A = client(), B = client();
let wid;
try {
  await A.signIn(emailA, pw);
  const meA = await A.me();
  assert.equal(meA.role, "coppia"); log("la coppia accede, ruolo coppia");

  await assert.rejects(() => A.signIn(emailA, pw + "x"), /Email o password non corrette/); log("password sbagliata: messaggio in italiano");

  wid = await A.createWedding({ title: "Prova automatica", wedding_date: "2027-06-12", city: "Caserta", budget_total: 20000, guests_expected: 100 });
  const ws = await A.listWeddings(meA);
  const w = ws.find((x) => x.id === wid);
  assert.ok(w && w.my_role === "sposi"); log("matrimonio creato, la coppia è tra gli sposi");

  const tasks = await A.list("tasks", wid);
  assert.equal(tasks.length, 20); log("20 scadenze generate dalla data");

  await A.insert("budget_items", { wedding_id: wid, category: "Location", planned: 10000, contracted: 9000, paid: 3000 });
  await A.insert("vendors", { wedding_id: wid, category: "Catering", name: "Prova", status: "in_trattativa" });
  const [v] = await A.list("vendors", wid);
  await A.insert("quotes", { wedding_id: wid, vendor_id: v.id, label: "Menù A", amount: 90, per_person: true });
  await A.insert("guests", { wedding_id: wid, name: "Ospite di prova", household: "Famiglia Prova", rsvp: "si" });
  await A.insert("timeline_items", { wedding_id: wid, start_time: "16:00", title: "Cerimonia" });
  assert.equal((await A.list("quotes", wid)).length, 1); log("budget, fornitore, preventivo, invitato e scaletta salvati");

  await A.updateWedding(wid, { wedding_date: "2027-09-12" });
  const moved = (await A.list("tasks", wid)).find((t) => t.title === "Inviare le partecipazioni");
  assert.equal(moved.due_date, "2027-04-12"); log("cambio data: le scadenze aperte si spostano");

  await assert.rejects(() => A.list("internal_notes", wid).then((r) => { if (r.length) throw new Error("vede"); throw new Error("nessuna"); }), /nessuna/);
  await A.createInvite(wid, emailB.toUpperCase(), "planner", meA);
  assert.equal((await A.listInvites(wid)).length, 1); log("invito creato per la planner");

  await B.signIn(emailB, pw);
  const meB = await B.me();
  assert.equal(meB.role, "planner");
  assert.equal((await B.listWeddings(meB)).filter((x) => x.id === wid).length, 0); log("prima dell'invito la planner non vede il matrimonio");
  const pend = await B.pendingInvites();
  const inv = pend.find((p) => p.wedding_title === "Prova automatica");
  assert.ok(inv); log("la planner vede l'invito in sospeso");
  assert.equal(await B.acceptInvite(inv.token), wid);
  const wb = (await B.listWeddings(meB)).find((x) => x.id === wid);
  assert.equal(wb.my_role, "planner"); log("invito accettato: la planner è membro");
  await B.insert("internal_notes", { wedding_id: wid, body: "Nota riservata di prova" });
  assert.equal((await A.list("internal_notes", wid)).length, 0); log("le note interne della planner restano invisibili alla coppia");
  const members = await A.listMembers(wid);
  assert.equal(members.length, 2); log("la coppia vede i due membri con il nome");

  await assert.rejects(() => B.setRole(meA.id, "admin"), /amministratore/); log("la planner non può cambiare i ruoli");
  await assert.rejects(() => B.listWaitlist().then((r) => { if (r.length) throw new Error("vede la lista"); throw new Error("vuota"); }), /vuota/); log("la lista d'attesa non è leggibile da chi non è admin");

  await A.deleteWedding(wid); wid = null;
  assert.equal((await B.listWeddings(meB)).length, 0); log("matrimonio eliminato per tutti");
  await A.signOut(); await B.signOut();
  console.log("\nTutte le prove sono passate.");
} catch (e) {
  console.error("✗ " + (e && e.message || e));
  if (wid) { try { await A.deleteWedding(wid); } catch (x) {} }
  process.exitCode = 1;
}
