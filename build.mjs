// Genera le pagine di site/ a partire dai contenuti qui sotto.  node build.mjs
// Struttura e testi seguono i mockup Figma "Website" (Home, Per le coppie, Per le planner, Prezzi).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "site");
const write = (name, html) => writeFileSync(join(OUT, name), html);

/* ---------- il marchio, in linea ---------- */
const outer = (sx, sy) => {
  const m = (x, y) => [32 + sx * (x - 32), 32 + sy * (y - 32)];
  const flip = sx * sy > 0 ? 0 : 1, Y = 21.977;
  const [c0, c1, a, b, c2] = [m(0, 0), m(31, 0), m(31, 32 - Y), m(32 - Y, 31), m(0, 31)];
  const f = (p) => p.map((v) => v.toFixed(2)).join(",");
  return `M${f(c0)} L${f(c1)} L${f(a)} A22,22 0 0 ${flip} ${f(b)} L${f(c2)} Z`;
};
const MARK = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">` +
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => `<path d="${outer(sx, sy)}"/>`).join("") +
  `<path d="M20,32 A12,12 0 1 0 44,32 A12,12 0 1 0 20,32 Z"/></svg>`;
const ARROW = `<svg class="arr" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CAL = `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="3" y="4.5" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

/* ---------- immagini ---------- */
const IMG = {
  home: ["tavola-pergolato", 1440, 960, "Una tavola apparecchiata sotto un pergolato, tra gli alberi e le rocce."],
  budget: ["tavola-legno-fiori", 1440, 960, "Una tavola di legno apparecchiata all'aperto, con sedie incrociate e centrotavola di fiori."],
  scadenze: ["calendario-fiori", 1440, 900, "Un calendario mensile su un tavolo bianco, con una matita e fiori arancioni."],
  invitati: ["tavolata-alberi", 1440, 960, "Una lunga tavola di legno con i bicchieri pronti, all'ombra degli alberi."],
  costiera: ["terrazza-costa", 1440, 960, "Tavoli e sedie su una terrazza affacciata su un paese della costa e sul mare."],
  fiori: ["cortile-fiori", 1440, 1201, "Un cortile di pietra con un tavolo, sedie bianche, vasi di fiori e piante."],
  coppie: ["tavola-uliveto", 1440, 960, "Un tavolo con le sedie in mezzo a un uliveto, con le colline sullo sfondo."],
  viale: ["cipressi-tramonto", 1440, 960, "Un prato al tramonto, con cipressi e case all'orizzonte."],
  versione: ["carta-fiori", 1152, 1440, "Cartoncini e partecipazioni su un tavolo chiaro, con rose e fiori di campo."],
  planner: ["allestimento-cerimonia", 1440, 958, "Un giardino allestito per una cerimonia all'aperto, con file di sedie e fiori bianchi."],
  scrivania: ["quaderno-rosa", 1440, 939, "Un quaderno a spirale, una penna e una rosa su un tavolo bianco."],
  coord: ["navata-cerimonia", 1440, 958, "Una navata di fiori bianchi tra le sedie, in un giardino pronto per la cerimonia."],
  cambia: ["arco-mare", 1051, 1440, "Un arco di pietra che si apre su una scala bianca e sul mare."],
  partiamo: ["patio-ulivo-mare", 1440, 1080, "Un patio con tavoli, sedie e un ulivo, affacciato sul mare."],
  dettaglio: ["terrazza-tramonto", 1440, 960, "Tavoli apparecchiati su una terrazza sul mare, al tramonto."],
  prezzi: ["tovaglioli-azzurri", 960, 1440, "Una tavola all'aperto con piatti, tovaglioli azzurri e bicchieri."],
  pergolato: ["tavola-limoni", 960, 1440, "Una tavola apparecchiata con un runner verde, limoni e fiori gialli."],
};
// Crediti Unsplash (autore e pagina della foto), mostrati nella privacy
const PHOTO_CREDITS = [["tavola-pergolato", "Steffen Lemmerzahl", "https://unsplash.com/@steffen_l?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-set-up-for-a-meal-under-a-pergolated-roof-z9MAxYlXv3s?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["tavola-legno-fiori", "Bruno Ngarukiye", "https://unsplash.com/@itsbrunoagain?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/wooden-table-set-for-outdoor-dining-with-floral-centerpieces-YrThd1lBFu4?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["calendario-fiori", "Debby Hudson", "https://unsplash.com/@hudsoncrafted?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/white-and-black-printer-paper-TMfDf6ItsZI?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["tavolata-alberi", "Jacob Diehl", "https://unsplash.com/@jacob_diehl_film?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-long-table-set-up-with-empty-wine-glasses-hV0y0KAJWno?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["terrazza-costa", "Arthur Tseng", "https://unsplash.com/@arthur3607?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-seating-overlooking-a-coastal-village-and-ocean-fgN1TeHcUKs?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cortile-fiori", "George Karelitsky", "https://unsplash.com/@georgekar?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-and-chairs-outside-6V7eOl67DM0?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["tavola-uliveto", "Anastasia Saldatava", "https://unsplash.com/@asaldatava?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-and-chairs-in-an-olive-grove-oNMk0OOul80?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cipressi-tramonto", "Rafael Peier", "https://unsplash.com/@rafaelpeier?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/sunset-over-a-green-field-and-buildings-with-cypress-trees-EyzMwZkyUoY?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["carta-fiori", "Diana Light", "https://unsplash.com/@dreamcatchlight?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/three-flowers-and-a-card-on-a-table-IP70EVPkjNs?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["allestimento-cerimonia", "Jonathan Borba", "https://unsplash.com/@jonathanborba?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-chairs-and-floral-decorations-EQcRRfDLIts?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["quaderno-rosa", "Kelly Sikkema", "https://unsplash.com/@kellysikkema?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/orange-rose-flower-H0QV32-mak8?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["navata-cerimonia", "Jonathan Borba", "https://unsplash.com/@jonathanborba?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-floral-arch-and-green-arch-_a4OJrB5Q4A?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["arco-mare", "Karwin Luo", "https://unsplash.com/@karw1n?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/archway-view-to-a-spiral-staircase-and-ocean-zNOgrItIMiE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["patio-ulivo-mare", "Jonas from Berlin", "https://unsplash.com/@jonasfromberlin?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/patio-with-tables-chairs-olive-tree-and-scenic-ocean-view-rX2DMYxsma0?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["terrazza-tramonto", "Cory Bjork", "https://unsplash.com/@corybjork?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-and-chairs-with-a-view-of-the-ocean-WatdiKeHuho?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["tovaglioli-azzurri", "Bruno Ngarukiye", "https://unsplash.com/@itsbrunoagain?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/elegant-outdoor-table-setting-with-light-blue-napkins-and-glasses-V0xzy924lCA?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["tavola-limoni", "Bruno Ngarukiye", "https://unsplash.com/@itsbrunoagain?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-beautifully-set-outdoor-dining-table-with-floral-centerpiece-fJbpoLw1YYM?utm_source=felice_mondo_progetti&amp;utm_medium=referral"]];
const img = (k, { lazy = true, cls = "" } = {}) => { const [f, w, h, alt] = IMG[k]; return `<img src="img/${f}.jpg" width="${w}" height="${h}" alt="${alt}"${cls ? ` class="${cls}"` : ""}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`; };
const EVOC = "Immagine evocativa · non rappresenta un evento organizzato da Nozze in Ordine.";

/* ---------- frammenti del prodotto (dati di esempio) ---------- */
const BUDGET_CARD = `<div class="ui" aria-label="Esempio: budget e pagamenti"><div class="ui-head"><b>Budget e pagamenti</b><span>Dati di esempio</span></div>
<div class="kpis"><div><span>Budget</span><b>26.000 €</b></div><div><span>Pagato</span><b>6.450 €</b></div><div><span>Residuo</span><b>10.650 €</b></div></div>
<div class="bars">${[["Location e ristorazione", 13000, 14000, "t"], ["Fotografia e video", 3000, 3200, ""], ["Abiti", 3000, 3500, ""]].map(([l, p, b, c]) =>
  `<div class="br"><span>${l}</span><i class="track"><i class="${c}" style="width:${(p / b * 66).toFixed(0)}%"></i></i><small>${p.toLocaleString("it-IT")} / ${b.toLocaleString("it-IT")} €</small></div>`).join("")}</div></div>`;

const PATH_STEPS = [["12+ mesi", "Data e location"], ["9–11 mesi", "Fornitori e preventivi"], ["6–8 mesi", "Save the date"], ["3–5 mesi", "Inviti e menù"], ["Settimana", "Scaletta"]];
const PATH_CARD = `<div class="ui" data-wedding="2027-06-12" aria-label="Esempio: percorso verso il sì"><div class="ui-head"><b>Percorso verso il sì</b><span>12 giugno 2027</span></div>
<ol class="path">${PATH_STEPS.map(([t, d], i) => `<li data-step="${i}"><b>${t}</b><span>${d}</span></li>`).join("")}</ol>
<div class="count"><b data-weeks>32</b><i>/</i><b data-days>5</b><span>settimane</span><span>giorni</span></div></div>`;

const RSVP_CARD = (note = "") => { const tiles = [...Array(84).fill("ok"), ...Array(14).fill("no"), ...Array(44).fill("wait"), ...Array(8).fill("todo")];
  // 150 inviti in 3 righe da 16 (gli ultimi 2 non si vedono come nel mockup: 48 tessere)
  const show = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 15; c++) show.push(tiles[Math.floor((r * 15 + c) / 45 * 150)]);
  return `<div class="ui" aria-label="Esempio: 150 inviti, 84 confermati, 14 rifiutati, 44 in attesa, 8 da invitare"><div class="ui-head"><b>Invitati e RSVP</b><span>84 confermati su 150${note}</span></div>
<div class="mosaic" role="img" aria-label="Ogni tessera è un gruppo di inviti">${show.map((c) => `<i class="${c}"></i>`).join("")}</div>
<div class="legend"><span class="ok">Confermati 84</span><span class="no">Rifiutati 14</span><span class="wait">In attesa 44</span><span class="todo">Da invitare 8</span></div></div>`; };

const PLANNER_TABLE = `<div class="ui flush"><div class="ui-head"><b>Dashboard planner</b><span>Dati di esempio</span></div><div class="tscroll"><table class="tbl"><thead><tr><th>Evento</th><th>Data</th><th>Fornitori</th><th>Pagato sul budget</th></tr></thead><tbody>` +
  [["Chiara e Marco", "12 giu 2027", "7 di 9", 28], ["Anna e Luca", "4 lug 2027", "5 di 8", 34], ["Sara e Paolo", "18 set 2027", "2 di 8", 12], ["Giulia e Andrea", "2 ott 2027", "1 di 8", 6]]
    .map(([n, d, f, p]) => `<tr><td>${n}</td><td>${d}</td><td>${f}</td><td><span class="paid"><i style="width:${Math.max(12, p * 1.4)}px"></i>${p}% pagato</span></td></tr>`).join("") + `</tbody></table></div></div>`;
const SCHEDULE = `<div class="ui flush"><div class="ui-head"><b>Scaletta evento</b><span>12 giugno</span></div><ol class="sched">` +
  [["10:30", "Arrivo degli invitati", "Wedding planner"], ["11:00", "Cerimonia", "Celebrante", 1], ["12:30", "Foto di gruppo", "Fotografo"], ["13:30", "Aperitivo in giardino", "Catering"], ["20:00", "Cena", "Catering"], ["23:30", "Taglio della torta", "Sposi"]]
    .map(([t, w, r, on]) => `<li${on ? ' class="on"' : ""}><b>${t}</b><span>${w}</span><small>${r}</small></li>`).join("") + `</ol></div>`;

/* ---------- struttura comune ---------- */
const NAV = [["coppie.html", "Per le coppie"], ["planner.html", "Per le planner"], ["prezzi.html", "Prezzi"]];
const head = (title, desc) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="${desc}"><meta name="theme-color" content="#F5F0E7"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="twitter:card" content="summary_large_image"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:image" content="https://nozzeinordine.com/og.png"><link rel="preload" href="fonts/cormorant-garamond-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css"></head><body>`;
// Il pulsante in alto porta alla dashboard; le iscrizioni passano dai moduli richiesta-*.html
const top = (cur) => `<a class="skip" href="#main">Vai al contenuto</a><header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="Nozze in Ordine, pagina iniziale">${MARK}<span>Nozze in Ordine</span></a>
<nav class="menu" id="menu" aria-label="Principale">${NAV.map(([h, l]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${l}</a>`).join("")}<a class="btn menu-cta" href="app/">Accedi ${ARROW}</a></nav>
<a class="btn sm top-cta" href="app/">Accedi ${ARROW}</a><button class="burger" type="button" aria-expanded="false" aria-controls="menu"><span class="burger-icon" aria-hidden="true"><i></i><i></i></span><span class="burger-label">Menu</span></button></div></header>`;
const foot = `<footer class="foot"><div class="wrap"><div class="foot-main"><div><p class="foot-brand">Nozze in Ordine</p><p>Per il vostro sì.</p></div>
<nav aria-label="Pagine"><a href="coppie.html">Per le coppie</a><a href="planner.html">Per le planner</a><a href="prezzi.html">Prezzi</a></nav>
<nav aria-label="Lista d'attesa e accesso"><a href="index.html#lista">Lista d'attesa</a><a href="app/">Accedi</a><a href="app/demo.html">Demo</a></nav></div>
<div class="foot-line"><span>© 2026 Nozze in Ordine · Nato in Campania, per tutta Italia</span><a href="privacy.html">Privacy</a></div></div></footer><script src="app.js"></script></body></html>`;
const eyebrow = (t, cls = "") => `<p class="eyebrow${cls ? " " + cls : ""}">${t}</p>`;
const btn = (href, label, cls = "") => `<a class="btn${cls ? " " + cls : ""}" href="${href}">${label} ${ARROW}</a>`;
const hero = ({ k, eb, h1, p, a, b, fine, corner, tall }) => `<section class="hero${tall ? " tall" : ""}" aria-labelledby="h1">${img(k, { lazy: false, cls: "hero-img" })}<div class="wrap hero-in">
${eb}<h1 id="h1">${h1}</h1><p class="hero-p">${p}</p><div class="actions">${a}${b}</div><p class="fine">${fine}</p></div>${corner ? `<p class="corner">${corner}</p>` : ""}</section>`;
const feat = ({ k, n, h, p, card, side = "left", bg = "", id = "" }) => `<section class="feat ${side}${bg ? " " + bg : ""}"${id ? ` id="${id}"` : ""} aria-labelledby="f${n}"><figure class="feat-pic">${img(k)}</figure>
<div class="feat-text"><p class="num">${n}</p><h2 id="f${n}">${h}</h2><p class="lead">${p}</p>${card}</div></section>`;
const editorial = (k, quote, cap = "Nozze in Ordine · In tutta Italia") => `<section class="editorial" aria-label="Immagine">${img(k)}<blockquote><p>${quote}</p></blockquote><p class="cap">${cap}</p></section>`;
const defs = (rows) => `<dl class="defs">${rows.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>`;

/* ---------- richieste: un modulo per coppie e uno per planner, in tre passaggi ---------- */
// I vecchi valori per provincia (caserta, napoli…) restano leggibili in dashboard: vedi WL.zona in site/app/ui.js
const ZONE = [["abruzzo", "Abruzzo"], ["basilicata", "Basilicata"], ["calabria", "Calabria"], ["campania", "Campania"], ["emilia-romagna", "Emilia-Romagna"], ["friuli-venezia-giulia", "Friuli Venezia Giulia"], ["lazio", "Lazio"], ["liguria", "Liguria"], ["lombardia", "Lombardia"], ["marche", "Marche"], ["molise", "Molise"], ["piemonte", "Piemonte"], ["puglia", "Puglia"], ["sardegna", "Sardegna"], ["sicilia", "Sicilia"], ["toscana", "Toscana"], ["trentino-alto-adige", "Trentino-Alto Adige"], ["umbria", "Umbria"], ["valle-d-aosta", "Valle d'Aosta"], ["veneto", "Veneto"], ["estero", "All'estero"]];
const OPTL = ` <span class="optl">· facoltativo</span>`;
const select = (id, label, items, { req = true, hint = "" } = {}) => `<div class="fld"><label for="${id}">${label}${req ? "" : OPTL}</label><select id="${id}" name="${id}"${req ? " required" : ""}><option value="">Scegli…</option>${items.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const input = (id, label, type, { req = true, ph = "", hint = "", attrs = "" } = {}) => `<div class="fld"><label for="${id}">${label}${req ? "" : OPTL}</label><input type="${type}" id="${id}" name="${id}"${req ? " required" : ""}${ph ? ` placeholder="${ph}"` : ""}${attrs ? " " + attrs : ""}>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const area = (id, label, ph) => `<div class="fld"><label for="${id}">${label}${OPTL}</label><textarea id="${id}" name="${id}" rows="3" maxlength="500" placeholder="${ph}"></textarea><p class="hint">Niente dati sulla salute o di altre persone, per favore.</p></div>`;
const radios = (name, legend, items) => `<fieldset class="fs"><legend>${legend}</legend><div class="opts">${items.map(([v, l, sub], i) =>
  `<div class="opt"><input type="radio" name="${name}" id="${name}-${i}" value="${v}"${i === 0 ? " required" : ""}><label for="${name}-${i}"><span class="price">${l}</span>${sub ? `<small>${sub}</small>` : ""}</label></div>`).join("")}</div></fieldset>`;
const chips = (name, legend, items, hint = "") => `<fieldset class="fs"><legend>${legend}${OPTL}</legend><div class="chips">${items.map(([v, l]) =>
  `<label class="chip"><input type="checkbox" name="${name}" value="${v}"><span>${l}</span></label>`).join("")}</div>${hint ? `<p class="hint">${hint}</p>` : ""}</fieldset>`;
const tick = (id, text, req = false) => `<label class="check" for="${id}"><input type="checkbox" id="${id}" name="${id}"${req ? " required" : ""}><span>${text}</span></label>`;
const CONSENT = tick("consenso", `Acconsento a ricevere email su Nozze in Ordine. Uso i dati solo per questo e per capire cosa costruire, e posso chiedere di cancellarli quando voglio. <a href="privacy.html">Leggi l'informativa</a>.`, true);
const EMAIL = input("email", "Email", "email", { ph: "nome@esempio.it", attrs: 'autocomplete="email" maxlength="254"' });
const step = (n, title, body) => `<div class="step" role="group" aria-labelledby="st${n}"><h2 class="step-t" id="st${n}" tabindex="-1">${title}</h2>${body}</div>`;
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"].map((m, i) => [String(i + 1).padStart(2, "0"), m]);
const requestForm = (profile, steps, sendLabel) => `<form id="richiesta" class="form-card req" data-profile="${profile}" novalidate>
<p class="progress" aria-hidden="true"><span class="progress-n">1 di ${steps.length}</span><i><b></b></i></p>
${steps.map(([t, body], i) => step(i + 1, t, body)).join("\n")}
<div class="form-nav"><button type="button" class="btn line" data-back>Indietro</button><button type="button" class="btn" data-next>Avanti ${ARROW}</button><button class="btn" type="submit" id="invia">${sendLabel} ${ARROW}</button></div>
<p id="status" role="status" aria-live="polite"></p></form>`;

const FORM_COUPLE = requestForm("coppia", [
  ["Il vostro matrimonio", `<div class="row2">${select("mese", "Mese", MESI.concat([["nd", "Non lo sappiamo ancora"]]))}${select("anno", "Anno", [["2026", "2026"], ["2027", "2027"], ["2028", "2028"], ["2029", "2029 o dopo"], ["nd", "Non abbiamo ancora deciso"]])}</div>
${select("zona", "Dove vi sposate?", ZONE)}
<div class="row2">${select("invitati", "Quanti invitati, più o meno?", [["fino-50", "Fino a 50"], ["50-100", "Da 50 a 100"], ["100-150", "Da 100 a 150"], ["150-200", "Da 150 a 200"], ["200+", "Più di 200"], ["nd", "Non lo sappiamo"]])}${select("budget", "Budget indicativo", [["sotto-15", "Meno di 15.000 €"], ["15-25", "Da 15.000 a 25.000 €"], ["25-40", "Da 25.000 a 40.000 €"], ["40+", "Più di 40.000 €"], ["nd", "Non lo sappiamo"]], { req: false })}</div>
${radios("planner", "Avete una wedding planner?", [["si", "Sì, ci segue una planner"], ["cerchiamo", "La stiamo cercando"], ["no", "No, organizziamo da soli"]])}`],
  ["A che punto siete", `${chips("prenotato", "Cosa avete già prenotato?", [["location", "Location"], ["catering", "Catering"], ["fotografo", "Fotografo e video"], ["abiti", "Abiti"], ["musica", "Musica"], ["fiori", "Fiori e allestimenti"], ["partecipazioni", "Partecipazioni"]], "Lasciate vuoto se non avete ancora prenotato nulla.")}
${select("strumenti", "Cosa usate oggi per organizzarvi?", [["fogli", "Fogli di calcolo"], ["app", "Un'app o un sito per matrimoni"], ["carta", "Quaderno e carta"], ["chat", "Chat e note sul telefono"], ["niente", "Niente, siamo all'inizio"], ["altro", "Altro"]], { req: false })}
${chips("pesi", "Cosa vi pesa di più?", [["budget", "Tenere il budget"], ["preventivi", "Confrontare i preventivi"], ["invitati", "Le risposte degli invitati"], ["scadenze", "Ricordare le scadenze"], ["coordinarsi", "Coordinarci tra noi e con le famiglie"], ["tavoli", "La disposizione dei tavoli"]])}
${area("note", "C'è altro che vorreste dirci?", "Per esempio: cosa vi farebbe risparmiare più tempo")}`],
  ["Come vi scriviamo", `${input("nome", "I vostri nomi", "text", { req: false, ph: "Anna e Marco", attrs: 'autocomplete="name" maxlength="120"' })}${EMAIL}
${radios("prezzo49", "Il piano Completo costa 49 €, una volta sola per il matrimonio. Lo prendereste?", [["si", "Sì, se fa quello che promette"], ["forse", "Forse, dopo averlo provato"], ["no", "No, ci basterebbe il piano gratuito"]])}
${tick("prova", "Ci piacerebbe essere tra le prime coppie a provarlo.")}${CONSENT}`]
], "Invia la richiesta");

const FORM_PLANNER = requestForm("planner", [
  ["Il tuo studio", `${input("studio", "Nome dello studio, o il tuo nome", "text", { ph: "Studio Esposito Wedding", attrs: 'autocomplete="organization" maxlength="120"' })}
${select("zona", "Dove lavori soprattutto?", ZONE)}
${input("web", "Sito o profilo Instagram", "text", { req: false, ph: "www.tuostudio.it o @tuostudio", attrs: 'maxlength="200"' })}
${radios("team", "Come lavori?", [["autonomia", "In autonomia"], ["2-3", "In 2 o 3 persone"], ["4+", "In 4 o più persone"]])}`],
  ["Il tuo lavoro", `<div class="row2">${select("eventi", "Matrimoni in un anno", [["1-4", "Da 1 a 4"], ["5-10", "Da 5 a 10"], ["11-20", "Da 11 a 20"], ["20+", "Più di 20"]])}${input("in_corso", "Quanti ne segui adesso?", "number", { ph: "Per esempio 6", attrs: 'min="0" max="200" step="1" inputmode="numeric"', hint: "Quelli con un incarico già firmato." })}</div>
${select("strumenti", "Cosa usi oggi per organizzare?", [["fogli-whatsapp", "Fogli di calcolo e WhatsApp"], ["gestionale", "Un software gestionale"], ["carta", "Quaderno e carta"], ["altro", "Altro"]])}
${select("spesa", "Quanto spendi oggi in software per il lavoro?", [["niente", "Niente"], ["sotto-20", "Meno di 20 € al mese"], ["20-50", "Da 20 a 50 € al mese"], ["50+", "Più di 50 € al mese"], ["nd", "Preferisco non dirlo"]], { req: false })}
${chips("perdite", "Dove perdi più tempo?", [["fornitori", "Preventivi e fornitori"], ["pagamenti", "Acconti e saldi"], ["invitati", "Invitati e tavoli"], ["sposi", "Messaggi con gli sposi"], ["scalette", "Scalette del giorno"], ["documenti", "Documenti e contratti"]])}
${area("note", "C'è altro che vorresti dirci?", "Per esempio: lo strumento che ti manca di più")}`],
  ["La prova pilota", `${radios("pilota", "Ti interessa la prova pilota?", [["si", "Sì, vorrei farne parte", "Gratuito, per le prime 10 planner"], ["info", "Vorrei saperne di più"], ["aggiornamenti", "Mi bastano gli aggiornamenti"]])}
${tick("chiamata", "Mi farebbe piacere una chiamata di 25 minuti per raccontare come lavoro.")}
${input("telefono", "Telefono", "tel", { req: false, ph: "Se preferisci essere chiamata", attrs: 'autocomplete="tel" maxlength="30"' })}${EMAIL}${CONSENT}`]
], "Invia la candidatura");

const requestPage = ({ file, title, desc, h1, lead, next, pic, form, done }) => write(file, head(title, desc) + top("") + `
<main id="main"><section class="request" aria-labelledby="h1"><div class="wrap request-in"><div class="request-text">
<h1 id="h1">${h1}</h1><p class="lead">${lead}</p><h2 class="next-t">Cosa succede dopo</h2><ul class="next">${next.map((x) => `<li>${CHECK}<span>${x}</span></li>`).join("")}</ul>
<figure class="side-pic">${img(pic)}<figcaption>${EVOC}</figcaption></figure></div>
<div class="request-form">${form}<div class="done" id="fatto" hidden><h2 tabindex="-1">${done[0]}</h2><p class="lead">${done[1]}</p><div class="actions">${btn("app/demo.html", "Prova la demo")}${btn("index.html", "Torna alla home", "line")}</div></div></div>
</div></section></main>` + foot);

const ctaBand = ({ h, p, href, label, fine }) => `<section class="cta-dark" id="lista" aria-labelledby="lst"><div class="wrap cta-in"><div><h2 id="lst">${h}</h2><p>${p}</p></div>
<div class="cta-btns"><a class="choice light" href="${href}">${label} ${ARROW}</a><p>${fine}</p></div></div></section>`;

/* =========================================================== HOME */
write("index.html", head("Nozze in Ordine | Il tuo sì, un tassello alla volta", "Budget, fornitori, invitati e scadenze del matrimonio in uno spazio condiviso, per coppie e wedding planner, in tutta Italia.") + top("") + `
<main id="main">
${hero({ k: "home", eb: eyebrow("Il vostro matrimonio, con calma", "light"), h1: "Il tuo sì, un tassello alla volta.", p: "Budget, fornitori, invitati e scadenze in uno spazio condiviso. Per organizzare ogni dettaglio con maggiore tranquillità.",
  a: btn("richiesta-coppia.html", "Sono una coppia"), b: btn("richiesta-planner.html", "Sono una wedding planner", "ghost"), fine: "Gratis per iniziare · Per coppie e wedding planner · In tutta Italia", corner: "01 / Il sì" })}
${feat({ k: "budget", n: "01", h: "Il budget che torna sempre.", p: "Previsto, firmato, pagato e residuo per ogni voce. Senza rifare i conti ogni sera.", card: BUDGET_CARD, side: "left" })}
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a partire dal giorno del matrimonio.", card: PATH_CARD, side: "right", bg: "sand" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Nuclei familiari, risposte e menù nello stesso elenco. Un invito, una riga.", card: RSVP_CARD(), side: "left", bg: "mist" })}
${editorial("costiera", "Tante cose da tenere insieme. Un posto in cui ritrovarle.")}
<section class="project" aria-labelledby="prog"><div class="wrap">
${eyebrow("Come si comincia")}<h2 id="prog">Tre passi per mettere ordine.</h2><p class="lead narrow">Dalla lista d'attesa al vostro spazio condiviso, senza fogli sparsi e senza file da rincorrere.</p>
<div class="project-grid"><ol class="steps">
<li><span>01</span><h3>Vi iscrivete.</h3><p>Ci raccontate il matrimonio in tre brevi passaggi: quando, quanti invitati, a che punto siete.</p></li>
<li><span>02</span><h3>Vi apriamo lo spazio.</h3><p>Entrate con la vostra email e trovate le scadenze già calcolate sulla data del matrimonio.</p></li>
<li><span>03</span><h3>Lo condividete.</h3><p>Invitate il partner o la vostra planner: ognuno vede ciò che gli serve, e nessuno rifà il lavoro due volte.</p></li></ol>
<figure class="project-pic">${img("fiori")}<figcaption>${eyebrow("In tutta Italia")}<p>Pensato per chi si sposa in Italia, una coppia e una planner alla volta.</p></figcaption></figure></div></div></section>
<section class="cta-dark" id="lista" aria-labelledby="lst"><div class="wrap cta-in"><div><h2 id="lst">Entra in lista d'attesa.</h2><p>Lista gratuita, nessun pagamento. Ti scriviamo appena c'è posto per te.</p></div>
<div class="cta-btns"><a class="choice light" href="richiesta-coppia.html">Sono una coppia ${ARROW}</a><a class="choice" href="richiesta-planner.html">Sono una wedding planner ${ARROW}</a><p>Gratis, in pochi minuti.</p></div></div></section>
</main>` + foot);

/* =========================================================== COPPIE */
const PHASES = [["12+ mesi prima", "Data, budget e location"], ["9–11 mesi prima", "Fornitori principali e preventivi"], ["6–8 mesi prima", "Save the date e abiti"], ["3–5 mesi prima", "Dettagli, inviti e menù"], ["1–2 mesi prima", "Conferme finali e saldi"], ["Settimana del sì", "Scaletta e responsabili"]];
write("coppie.html", head("Per le coppie | Nozze in Ordine", "Budget, preventivi, invitati e scadenze nello stesso posto condiviso, per organizzare il matrimonio con calma.") + top("coppie.html") + `
<main id="main">
${hero({ k: "coppie", tall: true, eb: eyebrow("Per le coppie", "light"), h1: "Il matrimonio, con calma.", p: "Budget, preventivi, invitati e scadenze nello stesso posto condiviso. Pensato per le coppie che si sposano in Italia.",
  a: btn("richiesta-coppia.html", "Iscrivetevi alla lista"), b: btn("#funzioni", "Cosa include", "ghost"), fine: "Piano gratuito · Completo a 49 €, una volta sola" })}
<section class="journey" aria-labelledby="perc"><div class="wrap"><div class="journey-head"><div>${eyebrow("Dal primo pensiero al giorno del sì")}<h2 id="perc">Un posto per tenere tutto insieme.</h2></div><p class="small">Provate con la vostra data</p></div>
<div class="planner-box" data-wedding="2027-06-12"><div class="calc"><label for="data-si">La data del sì</label><div class="date-in"><input type="date" id="data-si" value="2027-06-12">${CAL}</div>
<div class="count big"><b data-weeks>32</b><i>/</i><b data-days>5</b><span>settimane</span><span>giorni</span></div><p class="small" id="cd-msg" role="status"></p></div>
<ol class="phases">${PHASES.map(([t, d], i) => `<li data-step="${i}"><b>${t}</b><span>${d}</span><small>Da avviare</small></li>`).join("")}</ol></div>
<p class="small note">Esempio con il 12 giugno 2027. Le date sono calcolate sul vostro giorno e non vengono salvate.</p></div></section>
<section class="feat-photo" aria-labelledby="fb">${img("budget")}<div class="wrap feat-photo-in"><div><p class="num">01</p><h2 id="fb">Il budget che torna sempre.</h2><p class="lead">Previsto, firmato, pagato e residuo per ogni voce. Senza rifare i conti ogni sera.</p></div>${BUDGET_CARD}</div></section>
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a partire dal giorno del matrimonio, così sapete sempre cosa resta da fare.", card: PATH_CARD, side: "right" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Un invito, una riga. Nuclei familiari, risposte e menù in un elenco condiviso con il partner e con chi vi aiuta.", card: RSVP_CARD(" · dati di esempio"), side: "left", bg: "mist" })}
${editorial("viale", "Ogni dettaglio al suo posto. Ogni momento da vivere.")}
<section class="split-list" id="funzioni" aria-labelledby="funz"><div class="wrap">${eyebrow("Uno spazio condiviso")}<h2 id="funz">Cosa trovate nel vostro spazio.</h2>
<div class="split-grid"><div>${defs([["Budget e pagamenti", "Previsto, contrattualizzato, pagato e saldo residuo per ogni voce di spesa."], ["Fornitori e preventivi", "Scheda, contatti, allegati e stato della decisione, con i preventivi affiancati."], ["Checklist con scadenze", "Le attività si calcolano a partire dalla data del matrimonio."], ["Invitati e RSVP", "Nuclei familiari, risposte e menù, con esportazione."], ["Scaletta del giorno", "Orari, luoghi, responsabili e contatti per la giornata, da condividere."], ["Ruoli e documenti", "Sposi, planner e collaboratori con i loro permessi, e un archivio unico dei contratti."]])}
<p class="later">Niente marketplace di fornitori e niente pubblicità: lo spazio è vostro, e i fornitori li scegliete voi.</p></div>
<figure class="side-pic">${img("versione")}<figcaption>I dettagli restano vostri. L'ordine diventa condiviso.</figcaption></figure></div></div></section>
<section class="aside-band sand" aria-labelledby="pl"><div class="wrap aside-in"><div>${eyebrow("Insieme, senza doppioni")}<h2 id="pl">C'è una wedding planner al vostro fianco?</h2><p class="lead">Potrà invitarvi nel suo spazio. Vedrete budget, scadenze e documenti condivisi, senza rifare nulla e senza scambiarvi file.</p>${btn("planner.html", "Scopri la parte per le planner", "line")}</div>
<figure class="side-pic">${img("fiori")}<figcaption>Chi vi accompagna ha il suo ruolo. Voi avete il vostro spazio.</figcaption></figure></div></section>
${ctaBand({ h: "Entrate in lista d'attesa.", p: "Tre brevi passaggi sul vostro matrimonio, circa quattro minuti. Il piano gratuito resta gratuito; il Completo costerà 49 €, una volta sola.", href: "richiesta-coppia.html", label: "Compilate la richiesta", fine: "Iscriversi è gratis." })}
</main>` + foot);

/* =========================================================== PLANNER */
write("planner.html", head("Per le wedding planner | Nozze in Ordine", "Tutti i matrimoni che segui in un unico spazio, con budget, fornitori, scadenze, documenti e un portale condiviso con gli sposi.") + top("planner.html") + `
<main id="main">
${hero({ k: "planner", eb: eyebrow("Per le wedding planner", "light"), h1: "Tutti i matrimoni, in un unico spazio.", p: "Una dashboard per più eventi, con budget, fornitori, scadenze, documenti e un portale condiviso con gli sposi. Per le prime 10 planner la prova pilota è gratuita.",
  a: btn("richiesta-planner.html", "Candidati alla prova pilota"), b: btn("#colpo", "Come funziona", "ghost"), fine: "Prova pilota gratuita · Per le prime 10 planner", corner: "01 / Il coordinamento" })}
<section class="glance" id="colpo" aria-labelledby="gl"><div class="wrap">${eyebrow("Il lavoro a colpo d'occhio")}<h2 id="gl">Una dashboard pensata per più eventi.</h2><p class="lead narrow">Budget, fornitori, scadenze e documenti in un unico spazio. Non è un'agenzia: è uno strumento per chi coordina più matrimoni contemporaneamente.</p>
<div class="glance-grid"><div class="glance-col">${img("scrivania")}${PLANNER_TABLE}</div><div class="glance-col">${img("coord")}${SCHEDULE}</div></div></div></section>
<section class="split-list" aria-labelledby="cam"><div class="wrap">${eyebrow("Cosa cambia")}<h2 id="cam">Cosa cambia per la tua organizzazione.</h2>
<div class="split-grid"><div>${defs([["Template duplicabili", "Checklist, budget e scaletta da riusare a ogni nuovo evento."], ["Portale per gli sposi", "Gli sposi vedono ciò che condividi, con budget, scadenze e documenti nello stesso spazio."], ["Acconti e saldi per evento", "Chi ha pagato cosa e cosa scade questa settimana, su tutti gli eventi."], ["Scaletta condivisa", "Orari e responsabili del giorno, da mandare a fornitori e collaboratori."], ["Collaboratori con ruoli", "Ognuno vede e modifica solo ciò che gli compete."]])}
<p class="later">Nozze in Ordine comincia dove finisce la trattativa: dall'incarico firmato al giorno del sì.</p></div>
<figure class="side-pic">${img("cambia")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></div></section>
<section class="matrix mist" aria-labelledby="chi"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Ruoli e collaborazione")}<h2 id="chi">Chi vede e modifica cosa.</h2></div><p class="lead">Ogni persona vede e modifica solo ciò che le compete. Le note interne restano tue.</p></div>
<div class="ui flush"><div class="tscroll"><table class="tbl roles"><thead><tr><th>Nello spazio condiviso</th><th>La planner</th><th>Gli sposi</th></tr></thead><tbody>
<tr><th scope="row">Preventivi</th><td>Li carica e li gestisce</td><td>Li confrontano e approvano</td></tr><tr><th scope="row">Scadenze</th><td>Le assegna</td><td>Completano le loro</td></tr>
<tr><th scope="row">Documenti</th><td>Li carica</td><td>Li leggono e scaricano</td></tr><tr><th scope="row">Note interne</th><td>Le scrive e le legge</td><td>Non le vedono</td></tr></tbody></table></div></div></div></section>
<section class="aside-band" aria-labelledby="part"><div class="wrap aside-in"><div>${eyebrow("La prova pilota")}<h2 id="part">Costruito sul tuo metodo.</h2><p class="lead">Le prime 10 planner usano Nozze in Ordine sui loro matrimoni, gratis per tutta la prova pilota. Ogni mese ci dicono cosa serve, e lo strumento cresce intorno al loro lavoro.</p>${btn("richiesta-planner.html", "Raccontaci il tuo metodo", "line")}</div>
<figure class="side-pic">${img("partiamo")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></section>
<section class="inset-pic" aria-label="Immagine"><div class="wrap"><figure>${img("dettaglio")}<figcaption><em>Ogni dettaglio al suo posto. Ogni momento da vivere.</em><span>Nozze in Ordine · In tutta Italia</span></figcaption></figure></div></section>
${ctaBand({ h: "Candidati alla prova pilota.", p: "Cerchiamo le prime 10 wedding planner per costruire lo strumento insieme. È gratuita per tutta la sua durata: il prezzo dopo lo decidiamo insieme.", href: "richiesta-planner.html", label: "Invia la candidatura", fine: "Nessun pagamento, nessun impegno." })}
</main>` + foot);

/* =========================================================== PREZZI */
const plan = ({ name, price, sub, items, dark, tag, href, cta = "Entra in lista" }) => `<article class="plan${dark ? " dark" : ""}"><div class="plan-top"><h3>${name}</h3>${tag ? `<span class="tag soft">${tag}</span>` : ""}</div><p class="plan-price">${price}</p><p class="small">${sub}</p><hr>
<ul>${items.map((i) => `<li>${CHECK}${i}</li>`).join("")}</ul><a class="btn ${dark ? "light" : "line"}" href="${href}">${cta} ${ARROW}</a></article>`;
const faq = [["Devo pagare adesso?", "No. Iscriversi alla lista d'attesa è gratuito. Il piano Completo costa 49 €, una volta sola, e potete sempre restare sul piano gratuito."],
  ["Il piano Completo è un abbonamento?", "No. Sono 49 € una volta sola, per tutto il matrimonio: un matrimonio si organizza una volta."],
  ["Cosa resta gratis?", "Checklist con le scadenze, budget sintetico, fino a 50 invitati e 3 fornitori, e lo spazio condiviso con il partner. Senza limiti di tempo."],
  ["Perché per le planner non c'è un prezzo?", "Perché vogliamo deciderlo con chi lo usa. Le prime 10 planner lo provano gratis durante la prova pilota; il prezzo dopo lo concordiamo insieme, e non parte nessun addebito senza il vostro consenso."],
  ["Cosa succede ai miei dati?", `Usiamo le risposte ai moduli per scrivervi e per capire cosa costruire. I dettagli sono nella <a href="privacy.html">pagina privacy</a>.`]];
write("prezzi.html", head("Prezzi | Nozze in Ordine", "Per le coppie: gratis per iniziare, 49 € una volta sola per il piano Completo. Per le wedding planner: una prova pilota gratuita.") + top("prezzi.html") + `
<main id="main">
<section class="price-hero" aria-labelledby="h1"><div class="wrap price-hero-in"><div>${eyebrow("Prezzi")}<h1 id="h1">Gratis per iniziare.</h1><p class="lead">Per le coppie un prezzo solo, una volta per matrimonio. Per le wedding planner una prova pilota gratuita: il prezzo lo decidiamo insieme, dopo.</p>
${defs([["Per le coppie", "Piano gratuito, oppure Completo a 49 € una volta sola."], ["Per le planner", "Prova pilota gratuita per le prime 10 planner."]])}<p class="small note">La lista d'attesa è gratuita e non richiede pagamenti.</p></div>
<figure class="side-pic">${img("prezzi", { lazy: false })}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="plans-band sand" aria-labelledby="pc"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Per le coppie")}<h2 id="pc">Per le coppie.</h2></div><p class="lead">Un pagamento unico per matrimonio, perché l'organizzazione dura il tempo che serve e poi finisce. Potete restare sul piano gratuito quanto volete.</p></div>
<div class="plans">${plan({ href: "richiesta-coppia.html", name: "Gratis", price: "0 €", sub: "Per iniziare a mettere ordine, senza limiti di tempo", items: ["Checklist con scadenze", "Budget sintetico", "Fino a 50 invitati", "Fino a 3 fornitori", "Spazio condiviso con il partner"] })}
${plan({ href: "richiesta-coppia.html", name: "Completo", price: "49 €", sub: "Una volta sola, per tutto il matrimonio", items: ["Tutto il piano gratuito", "Invitati illimitati, risposte e tavoli", "Preventivi affiancati e pagamenti", "Documenti e contratti", "Scaletta del giorno ed esportazione dei dati"], dark: true })}</div></div></section>
<section class="plans-band" aria-labelledby="pp"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Per chi organizza")}<h2 id="pp">Per le wedding planner.</h2></div><p class="lead">Il prezzo per le planner lo decidiamo con chi partecipa alla prova pilota, sul lavoro vero e non su una tabella.</p></div>
<div class="plans"><article class="plan"><div class="plan-top"><h3>Come funziona la prova pilota</h3></div><ol class="pilot-steps"><li><b>Ti candidi.</b><span>Tre passaggi su come lavori e quanti matrimoni segui.</span></li><li><b>Ci sentiamo.</b><span>Una chiamata di 25 minuti per capire il tuo metodo.</span></li><li><b>Lo usi sui tuoi matrimoni.</b><span>Gratis per tutta la prova pilota, con un confronto ogni mese su cosa migliorare.</span></li><li><b>Decidiamo il prezzo insieme.</b><span>Non parte nessun addebito senza il tuo consenso.</span></li></ol></article>
${plan({ href: "richiesta-planner.html", name: "Prova pilota", price: "Gratuita", sub: "Per le prime 10 planner", items: ["Eventi illimitati durante la prova pilota", "Portale condiviso con gli sposi", "Template duplicabili", "Scadenze, acconti e saldi per evento", "Collaboratori con i loro permessi"], dark: true, tag: "10 posti", cta: "Candidati" })}</div></div></section>
<section class="faq-band mist" aria-labelledby="faq"><div class="wrap faq-in"><div>${eyebrow("Prima di iscriversi")}<h2 id="faq">Domande frequenti.</h2>
<div class="faq">${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div>
<figure class="side-pic">${img("pergolato")}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="closing" aria-labelledby="fine"><div class="wrap closing-in"><div>${eyebrow("Il prossimo tassello")}<h2 id="fine">Scegliete da dove partire.</h2><p class="lead">Un modulo per le coppie, uno per le planner: poche domande, circa quattro minuti, senza pagare nulla.</p></div>
<div class="closing-btns">${btn("richiesta-coppia.html", "Sono una coppia")}${btn("richiesta-planner.html", "Sono una wedding planner", "line")}</div></div></section>
</main>` + foot);

/* =========================================================== RICHIESTE */
requestPage({ file: "richiesta-coppia.html", title: "Lista d'attesa per le coppie | Nozze in Ordine", desc: "Tre brevi passaggi sul vostro matrimonio per entrare in lista d'attesa. Piano gratuito, Completo a 49 € una volta sola.",
  h1: "Entrate in lista d'attesa.", lead: "Tre brevi passaggi sul vostro matrimonio, circa quattro minuti. Ci servono per prepararvi lo spazio giusto e per scrivervi appena c'è posto.",
  next: ["Vi scriviamo appena c'è posto per voi.", "Il piano gratuito resta gratuito. Il Completo costa 49 €, una volta sola.", "Iscriversi non costa nulla."],
  pic: "versione", form: FORM_COUPLE, done: ["Grazie, siete in lista.", "Vi scriviamo appena c'è posto per voi. Nel frattempo potete provare la demo, con dati di esempio."] });
requestPage({ file: "richiesta-planner.html", title: "Prova pilota per le wedding planner | Nozze in Ordine", desc: "Candidati alla prova pilota gratuita di Nozze in Ordine per le prime 10 wedding planner.",
  h1: "Candidati alla prova pilota.", lead: "Cerchiamo le prime 10 wedding planner per costruire lo strumento insieme. Tre passaggi su come lavori, circa cinque minuti.",
  next: ["Leggiamo ogni candidatura e ti scriviamo per fissare una chiamata, se ti va.", "Durante la prova pilota non paghi nulla.", "Il prezzo dopo la prova pilota lo decidiamo insieme: niente addebiti senza il tuo consenso."],
  pic: "partiamo", form: FORM_PLANNER, done: ["Grazie, candidatura ricevuta.", "Ti scriviamo per raccontarti la prova pilota e, se ti va, fissare una chiamata. Nel frattempo puoi provare la demo, con dati di esempio."] });

/* =========================================================== PRIVACY */
write("privacy.html", head("Privacy | Nozze in Ordine", "Come trattiamo i dati delle richieste e della lista d'attesa di Nozze in Ordine.") + top("") + `
<main id="main">
<section class="price-hero" aria-labelledby="h1"><div class="wrap"><div class="legal">${eyebrow("Informativa")}<h1 id="h1">Privacy.</h1>
<p class="lead">Cosa raccogliamo quando compili una richiesta o ti iscrivi alla lista d'attesa, a cosa serve e come puoi chiedere di cancellarlo.</p>
<p class="small">Ultimo aggiornamento: 14 novembre 2026</p>
<h2>Chi tratta i dati</h2>
<p>Il titolare del trattamento è Felice Mondo, persona fisica. Puoi scrivere a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>.</p>
<h2>Quali dati raccogliamo</h2>
<ul><li>Email, e se lo scrivi il vostro nome o quello dello studio</li><li>Se sei una coppia o una wedding planner, la regione e la data della richiesta</li><li>Per le coppie: mese e anno del matrimonio, invitati e budget indicativi, se avete una planner, cosa avete già prenotato, cosa usate per organizzarvi, cosa vi pesa di più, se prendereste il piano Completo e se volete essere tra i primi a provarlo</li><li>Per le planner: sito o profilo Instagram, come lavori, matrimoni l'anno e in corso, strumenti e spesa in software, dove perdi più tempo, interesse per la prova pilota, se vuoi una chiamata e, se lo scrivi, il telefono</li><li>Le note che scegli di scriverci</li></ul>
<p>Nella prima fase non raccogliamo dati su intolleranze alimentari o salute degli invitati. Per questo nel campo note degli invitati vi chiediamo di non scrivere dati sulla salute. Se in futuro li raccoglieremo, lo scriveremo qui e chiederemo un consenso specifico.</p>
<h2>Perché li raccogliamo</h2>
<p>Per risponderti, per scriverti quando c'è posto, per organizzare la prova pilota con le planner e per capire quali funzioni servono davvero. Le risposte le leggiamo noi e le contiamo in forma aggregata; non le vendiamo e non le cediamo. La base è il tuo consenso, che puoi revocare in qualsiasi momento.</p>
<h2>Per quanto tempo</h2>
<p>Conserviamo i dati per 12 mesi dall'iscrizione, oppure fino a quando revochi il consenso se succede prima. Alla scadenza ti chiediamo se vuoi restare in lista; se non rispondi, li cancelliamo.</p>
<h2>I tuoi diritti</h2>
<p>Puoi chiedere accesso, correzione o cancellazione dei dati e revocare il consenso scrivendo a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>. Puoi anche rivolgerti al Garante per la protezione dei dati personali.</p>
<h2>Dove sono conservati e chi li gestisce</h2>
<p>Le iscrizioni sono salvate su Supabase, in un data center situato in Europa. Il sito è consegnato tramite Cloudflare, che gestisce anche l'inoltro delle email che arrivano a info@nozzeinordine.com. Alcuni di questi fornitori sono società con sede fuori dall'Unione Europea.</p>
<p>Come ogni sito, i server che consegnano le pagine registrano per breve tempo dati tecnici come l'indirizzo IP. I caratteri tipografici sono ospitati sul nostro stesso sito. In questa fase non usiamo cookie di profilazione né strumenti di analisi.</p>
<h2>Immagini</h2>
<p>Le fotografie del sito sono evocative e non rappresentano eventi organizzati da Nozze in Ordine. La foto del chiostro di Santa Chiara nella pagina di accesso è di Sailko, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, da <a href="https://commons.wikimedia.org/wiki/File:Chiostro_maiolicato_delle_clarisse_di_s._chiara,_1739-42,_01.jpg">Wikimedia Commons</a>.</p>
<p>Le altre fotografie vengono da <a href="https://unsplash.com/?utm_source=felice_mondo_progetti&amp;utm_medium=referral">Unsplash</a>, con la <a href="https://unsplash.com/license">licenza Unsplash</a>:</p>
<ul class="credits">${PHOTO_CREDITS.map(([f, a, au, p]) => `<li><a href="${p}">${f.replace(/-/g, " ")}</a> di <a href="${au}">${a}</a></li>`).join("")}</ul>
</div></div></section>
</main>` + foot);

console.log("pagine scritte in", OUT);
