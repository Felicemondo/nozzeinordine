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
// Ogni foto esce in AVIF a due larghezze (-m 800px, -l originale) con il JPEG di riserva: il telefono scarica solo ciò che gli serve.
const img = (k, { lazy = true, cls = "", sizes = "" } = {}) => { const [f, w, h, alt] = IMG[k]; const sz = sizes || (cls === "hero-img" ? "100vw" : "(min-width: 1000px) 50vw, 100vw");
  return `<picture><source type="image/avif" srcset="img/${f}-m.avif 800w, img/${f}-l.avif ${w}w" sizes="${sz}"><img src="img/${f}.jpg" width="${w}" height="${h}" alt="${alt}"${cls ? ` class="${cls}"` : ""}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}></picture>`; };
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
const head = (title, desc) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="${desc}"><meta name="theme-color" content="#F5F0E7"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="twitter:card" content="summary_large_image"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:image" content="https://nozzeinordine.com/og.png"><link rel="preload" href="fonts/dm-serif-display-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css"></head><body>`;
// I pulsanti portano alla dashboard (app/): registrazione diretta. I moduli della lista d'attesa (richiesta-*.html) non vengono più generati.
const top = (cur) => `<a class="skip" href="#main">Vai al contenuto</a><header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="Nozze in Ordine, pagina iniziale">${MARK}<span>Nozze in Ordine</span></a>
<nav class="menu" id="menu" aria-label="Principale">${NAV.map(([h, l]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${l}</a>`).join("")}<a class="btn menu-cta" href="app/">Accedi ${ARROW}</a></nav>
<a class="btn sm top-cta" href="app/">Accedi ${ARROW}</a><button class="burger" type="button" aria-expanded="false" aria-controls="menu"><span class="burger-icon" aria-hidden="true"><i></i><i></i></span><span class="burger-label">Menu</span></button></div></header>`;
const foot = `<footer class="foot"><div class="wrap"><div class="foot-main"><div><p class="foot-brand">Nozze in Ordine</p><p>Per il vostro sì.</p></div>
<nav aria-label="Pagine"><a href="coppie.html">Per le coppie</a><a href="planner.html">Per le planner</a><a href="prezzi.html">Prezzi</a></nav>
<nav aria-label="Accesso"><a href="app/#/registrati">Inizia gratis</a><a href="app/">Accedi</a><a href="app/demo.html">Demo</a></nav></div>
<div class="foot-line"><span>© 2026 Nozze in Ordine · Nato in Campania, per tutta Italia</span><span class="foot-legal"><a href="privacy.html">Privacy</a><a href="cookie.html">Cookie</a><a href="termini.html">Termini</a></span></div></div></footer><script src="app.js"></script></body></html>`;
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
const APP = "app/#/registrati";
const DEMO = "app/demo.html";
const MAIL = "mailto:info@nozzeinordine.com";
write("index.html", head("Nozze in Ordine | Organizzare il matrimonio in un unico spazio", "Budget, fornitori, invitati, tavoli e scadenze del matrimonio in uno spazio condiviso. Per coppie e wedding planner, in tutta Italia. Gratis per iniziare.") + top("") + `
<main id="main">
${hero({ k: "home", eb: eyebrow("Per coppie e wedding planner", "light"), h1: "Il tuo sì, un tassello alla volta.", p: "Budget, fornitori, invitati, tavoli e scadenze in un unico spazio condiviso. Vi registrate e trovate le scadenze già calcolate sulla data del matrimonio.",
  a: btn(APP, "Inizia gratis"), b: btn(DEMO, "Guarda la demo", "ghost"), fine: "Gratis per iniziare · Senza carta di credito · In tutta Italia", corner: "01 / Il sì" })}
${feat({ k: "budget", n: "01", h: "Il budget che torna sempre.", p: "Previsto, firmato, pagato e residuo per ogni voce di spesa, viaggio di nozze compreso. Senza rifare i conti ogni sera.", card: BUDGET_CARD, side: "left" })}
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a ritroso dal giorno del matrimonio, e gli avvisi vi ricordano cosa sta per scadere.", card: PATH_CARD, side: "right", bg: "sand" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Gruppi, risposte e menù nello stesso elenco, e la sala in pianta con un nome su ogni posto.", card: RSVP_CARD(), side: "left", bg: "mist" })}
${editorial("costiera", "Tante cose da tenere insieme. Un posto in cui ritrovarle.")}
<section class="project" aria-labelledby="prog"><div class="wrap">
${eyebrow("Come si comincia")}<h2 id="prog">Tre passi per mettere ordine.</h2><p class="lead narrow">Dalla registrazione al vostro spazio condiviso, senza fogli sparsi e senza file da rincorrere.</p>
<div class="project-grid"><ol class="steps">
<li><span>01</span><h3>Vi registrate.</h3><p>Email, password e la data del matrimonio. Non serve la carta di credito.</p></li>
<li><span>02</span><h3>Trovate le scadenze già pronte.</h3><p>Le attività sono calcolate sul vostro giorno: sapete subito cosa viene prima e cosa può aspettare.</p></li>
<li><span>03</span><h3>Lo condividete.</h3><p>Invitate il partner o la vostra planner: ognuno vede ciò che gli serve, e nessuno rifà il lavoro due volte.</p></li></ol>
<figure class="project-pic">${img("fiori")}<figcaption>${eyebrow("In tutta Italia")}<p>Pensato per chi si sposa in Italia e per chi i matrimoni li organizza di mestiere.</p></figcaption></figure></div></div></section>
<section class="split-list" aria-labelledby="fid"><div class="wrap">${eyebrow("Su cosa potete contare")}<h2 id="fid">Uno strumento, con regole chiare.</h2>
<div class="split-grid"><div>${defs([["Nessuna pubblicità, nessun marketplace", "Non vendiamo spazi ai fornitori e non vi proponiamo nessuno. I fornitori li scegliete voi."], ["Ognuno vede ciò che gli spetta", "Sposi, planner e collaboratori entrano con il proprio accesso. Le note riservate della planner restano sue."], ["Prezzi scritti", "Per le coppie un pagamento unico per matrimonio. Per le planner un canone fisso. Nessun addebito senza il vostro consenso."], ["Anche dal telefono", "Si aggiunge alla schermata Home e vi avvisa di scadenze e pagamenti in arrivo."], ["Si prova prima di registrarsi", "La demo si apre senza account, con dati di esempio."]])}
<p class="later">Nozze in Ordine è progettato e sviluppato in Campania da Felice Mondo, UX/UI designer. Per ogni domanda: <a href="${MAIL}">info@nozzeinordine.com</a>.</p></div>
<figure class="side-pic">${img("versione")}<figcaption>I dettagli restano vostri. L'ordine diventa condiviso.</figcaption></figure></div></div></section>
<section class="cta-dark" id="inizia" aria-labelledby="lst"><div class="wrap cta-in"><div><h2 id="lst">Cominciate oggi.</h2><p>Il piano gratuito non scade. Se preferite prima dare un'occhiata, la demo si apre senza account.</p></div>
<div class="cta-btns"><a class="choice light" href="${APP}">Inizia gratis ${ARROW}</a><a class="choice" href="${DEMO}">Guarda la demo ${ARROW}</a><p>Senza carta di credito.</p></div></div></section>
</main>` + foot);

/* =========================================================== COPPIE */
const PHASES = [["12+ mesi prima", "Data, budget e location"], ["9–11 mesi prima", "Fornitori principali e preventivi"], ["6–8 mesi prima", "Save the date e abiti"], ["3–5 mesi prima", "Dettagli, inviti e menù"], ["1–2 mesi prima", "Conferme finali e saldi"], ["Settimana del sì", "Scaletta e responsabili"]];
write("coppie.html", head("Per le coppie | Nozze in Ordine", "Budget, preventivi, invitati, tavoli e scadenze del matrimonio nello stesso posto condiviso. Piano gratuito senza scadenza, Completo a 49 € una volta sola.") + top("coppie.html") + `
<main id="main">
${hero({ k: "coppie", tall: true, eb: eyebrow("Per le coppie", "light"), h1: "Il matrimonio, con calma.", p: "Budget, preventivi, invitati, tavoli e scadenze nello stesso posto, condiviso tra voi due. Pensato per chi si sposa in Italia.",
  a: btn(APP, "Iniziate gratis"), b: btn("#funzioni", "Cosa include", "ghost"), fine: "Piano gratuito senza scadenza · Completo a 49 €, una volta sola" })}
<section class="journey" aria-labelledby="perc"><div class="wrap"><div class="journey-head"><div>${eyebrow("Dal primo pensiero al giorno del sì")}<h2 id="perc">Un posto per tenere tutto insieme.</h2></div><p class="small">Provate con la vostra data</p></div>
<div class="planner-box" data-wedding="2027-06-12"><div class="calc"><label for="data-si">La data del sì</label><div class="date-in"><input type="date" id="data-si" value="2027-06-12">${CAL}</div>
<div class="count big"><b data-weeks>32</b><i>/</i><b data-days>5</b><span>settimane</span><span>giorni</span></div><p class="small" id="cd-msg" role="status"></p></div>
<ol class="phases">${PHASES.map(([t, d], i) => `<li data-step="${i}"><b>${t}</b><span>${d}</span><small>Da avviare</small></li>`).join("")}</ol></div>
<p class="small note">Esempio con il 12 giugno 2027. Le date sono calcolate sul vostro giorno e non vengono salvate.</p></div></section>
<section class="feat-photo" aria-labelledby="fb">${img("budget")}<div class="wrap feat-photo-in"><div><p class="num">01</p><h2 id="fb">Il budget che torna sempre.</h2><p class="lead">Previsto, firmato, pagato e residuo per ogni voce, viaggio di nozze compreso. Senza rifare i conti ogni sera.</p></div>${BUDGET_CARD}</div></section>
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a ritroso dal giorno del matrimonio, così sapete sempre cosa resta da fare.", card: PATH_CARD, side: "right" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Famiglia e amici di ciascuno, risposte e menù in un elenco condiviso. Poi la sala in pianta, con un nome su ogni posto.", card: RSVP_CARD(" · dati di esempio"), side: "left", bg: "mist" })}
${editorial("viale", "Ogni dettaglio al suo posto. Ogni momento da vivere.")}
<section class="split-list" id="funzioni" aria-labelledby="funz"><div class="wrap">${eyebrow("Uno spazio condiviso")}<h2 id="funz">Cosa trovate nel vostro spazio.</h2>
<div class="split-grid"><div>${defs([["Budget e pagamenti", "Spesa totale, pagato e saldo residuo per ogni voce."], ["Fornitori e preventivi", "Scheda, contatti e stato della decisione, con i preventivi affiancati."], ["Scadenze e avvisi", "Le attività si calcolano dalla data del matrimonio; gli avvisi segnalano ciò che sta per scadere."], ["Invitati e risposte", "Gruppi, risposte e menù. L'elenco si importa anche da un file CSV."], ["Tavoli e sala", "La sala in pianta, tavoli da 8 a 12 posti e un nome su ogni posto."], ["Scaletta del giorno", "Orari e responsabili della giornata, da esportare e stampare."]])}
<p class="later">Niente marketplace di fornitori e niente pubblicità: lo spazio è vostro, e i fornitori li scegliete voi.</p></div>
<figure class="side-pic">${img("versione")}<figcaption>I dettagli restano vostri. L'ordine diventa condiviso.</figcaption></figure></div></div></section>
<section class="aside-band sand" aria-labelledby="pl"><div class="wrap aside-in"><div>${eyebrow("Insieme, senza doppioni")}<h2 id="pl">C'è una wedding planner al vostro fianco?</h2><p class="lead">Potete invitarla nel vostro spazio, oppure può invitarvi lei nel suo. Vedete le stesse scadenze e lo stesso budget, senza scambiarvi file.</p>${btn("planner.html", "Scopri la parte per le planner", "line")}</div>
<figure class="side-pic">${img("fiori")}<figcaption>Chi vi accompagna ha il suo ruolo. Voi avete il vostro spazio.</figcaption></figure></div></section>
${ctaBand({ h: "Aprite il vostro spazio.", p: "Il piano gratuito non scade. Il Completo costa 49 €, una volta sola, e vale per il vostro matrimonio.", href: APP, label: "Iniziate gratis", fine: "Senza carta di credito." })}
</main>` + foot);

/* =========================================================== PLANNER */
write("planner.html", head("Per le wedding planner | Nozze in Ordine", "Il gestionale per wedding planner: tutti i matrimoni che segui in un unico spazio, con budget, fornitori, acconti e saldi, scadenze e un portale per gli sposi. Da 29 € al mese.") + top("planner.html") + `
<main id="main">
${hero({ k: "planner", eb: eyebrow("Per le wedding planner", "light"), h1: "Tutti i matrimoni, in un unico spazio.", p: "Una dashboard per seguire più eventi insieme: budget, fornitori, acconti e saldi, scadenze, tavoli e scaletta, con un portale condiviso con gli sposi.",
  a: btn(APP, "Prova gratis 30 giorni"), b: btn(DEMO + "?ruolo=planner", "Guarda la demo", "ghost"), fine: "Da 29 € al mese · Prova gratuita di 30 giorni · Senza carta di credito", corner: "01 / Il coordinamento" })}
<section class="glance" id="colpo" aria-labelledby="gl"><div class="wrap">${eyebrow("Il lavoro a colpo d'occhio")}<h2 id="gl">Una dashboard pensata per più eventi.</h2><p class="lead narrow">Per ogni matrimonio vedi la data, i fornitori confermati e quanto è già stato pagato. Non è un'agenzia: è uno strumento per chi coordina più matrimoni contemporaneamente.</p>
<div class="glance-grid"><div class="glance-col">${img("scrivania")}${PLANNER_TABLE}</div><div class="glance-col">${img("coord")}${SCHEDULE}</div></div></div></section>
<section class="split-list" aria-labelledby="cam"><div class="wrap">${eyebrow("Cosa cambia")}<h2 id="cam">Cosa cambia per la tua organizzazione.</h2>
<div class="split-grid"><div>${defs([["Portale per gli sposi", "Inviti la coppia nel suo matrimonio: vede budget, scadenze e scaletta senza chiederti un file."], ["Acconti e saldi per evento", "Cosa è stato pagato e cosa scade, con gli avvisi sulle date in arrivo."], ["Note riservate", "I tuoi appunti di lavoro su ogni evento. Gli sposi non li vedono."], ["Tavoli e sala in pianta", "Tavoli da 8 a 12 posti, con un nome su ogni posto."], ["Scaletta condivisa", "Orari e responsabili del giorno, da esportare per fornitori e collaboratori."], ["Collaboratori", "Aggiungi chi lavora con te a un evento, con il suo accesso."]])}
<p class="later">Nozze in Ordine comincia dove finisce la trattativa: dall'incarico firmato al giorno del sì.</p></div>
<figure class="side-pic">${img("cambia")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></div></section>
<section class="matrix mist" aria-labelledby="chi"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Ruoli e collaborazione")}<h2 id="chi">Chi vede e modifica cosa.</h2></div><p class="lead">Ogni persona vede e modifica solo ciò che le compete. Le note riservate restano tue.</p></div>
<div class="ui flush"><div class="tscroll"><table class="tbl roles"><thead><tr><th>Nello spazio condiviso</th><th>La planner</th><th>Gli sposi</th></tr></thead><tbody>
<tr><th scope="row">Preventivi</th><td>Li carica e li gestisce</td><td>Li confrontano e approvano</td></tr><tr><th scope="row">Scadenze</th><td>Le assegna</td><td>Completano le loro</td></tr>
<tr><th scope="row">Note riservate</th><td>Le scrive e le legge</td><td>Non le vedono</td></tr></tbody></table></div></div></div></section>
<section class="aside-band" aria-labelledby="part"><div class="wrap aside-in"><div>${eyebrow("Chi c'è dietro")}<h2 id="part">Uno strumento, non un'agenzia.</h2><p class="lead">Nozze in Ordine non organizza matrimoni e non ti manda clienti: ti dà un posto ordinato in cui lavorare. È progettato in Campania da Felice Mondo, UX/UI designer, e cresce con le richieste di chi lo usa.</p>${btn(MAIL, "Scrivici cosa ti serve", "line")}</div>
<figure class="side-pic">${img("partiamo")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></section>
<section class="inset-pic" aria-label="Immagine"><div class="wrap"><figure>${img("dettaglio")}<figcaption><em>Ogni dettaglio al suo posto. Ogni momento da vivere.</em><span>Nozze in Ordine · In tutta Italia</span></figcaption></figure></div></section>
${ctaBand({ h: "Provalo sui tuoi matrimoni.", p: `30 giorni di prova, poi da 29 € al mese. Per gli studi con più persone c'è un piano su misura: i dettagli sono nella <a href="prezzi.html">pagina prezzi</a>.`, href: APP, label: "Inizia la prova", fine: "Senza carta di credito." })}
</main>` + foot);

/* =========================================================== PREZZI */
// Prezzi e limiti dei piani: si cambiano qui. I limiti non sono ancora applicati dalla dashboard.
const PREZZI = { completo: "49 €", planner: "29 €", team: "59 €", eventiPlanner: 5, eventiTeam: 15, collabTeam: 3, prova: 30 };
const plan = ({ name, price, per = "", sub, items, dark, tag, href, cta = "Inizia gratis" }) => `<article class="plan${dark ? " dark" : ""}"><div class="plan-top"><h3>${name}</h3>${tag ? `<span class="tag soft">${tag}</span>` : ""}</div><p class="plan-price">${price}${per ? `<small> ${per}</small>` : ""}</p><p class="small">${sub}</p><hr>
<ul>${items.map((i) => `<li>${CHECK}${i}</li>`).join("")}</ul><a class="btn ${dark ? "light" : "line"}" href="${href}">${cta} ${ARROW}</a></article>`;
const faq = [["Devo inserire una carta di credito per iniziare?", "No. Vi registrate con email e password. Il piano gratuito per le coppie non scade, e la prova per le planner non chiede la carta."],
  ["Il piano Completo è un abbonamento?", `No. Sono ${PREZZI.completo} una volta sola, per tutto il matrimonio: un matrimonio si organizza una volta.`],
  ["Posso usare il piano Completo per più matrimoni?", "No. Il Completo vale per un solo matrimonio e i nomi degli sposi si fissano all'attivazione, senza poterli cambiare. Chi organizza matrimoni per lavoro trova i piani per le wedding planner."],
  ["Cosa conta come matrimonio attivo?", "Un matrimonio la cui data non è ancora passata. Quelli conclusi restano consultabili e non occupano posti nel piano."],
  [`Cosa succede alla fine dei ${PREZZI.prova} giorni di prova?`, "Scegli un piano oppure ti fermi. Non parte nessun addebito senza il tuo consenso."],
  ["I prezzi comprendono l'IVA?", `Per le coppie sì: ${PREZZI.completo} è il prezzo finale. Per le wedding planner i canoni sono IVA esclusa.`],
  ["Come si paga?", "I pagamenti online non sono ancora attivi: in questa fase di lancio l'accesso è gratuito. Prima di attivarli vi scriviamo per email, e nessun piano a pagamento parte senza il vostro consenso."],
  ["Cosa succede ai miei dati?", `Li usiamo per farvi funzionare lo spazio e per rispondervi. Non li vendiamo e non li cediamo. I dettagli sono nella <a href="privacy.html">pagina privacy</a>.`]];
write("prezzi.html", head("Prezzi | Nozze in Ordine", `Per le coppie: gratis per iniziare, ${PREZZI.completo} una volta sola per il piano Completo. Per le wedding planner: da ${PREZZI.planner} al mese, con ${PREZZI.prova} giorni di prova.`) + top("prezzi.html") + `
<main id="main">
<section class="price-hero" aria-labelledby="h1"><div class="wrap price-hero-in"><div>${eyebrow("Prezzi")}<h1 id="h1">Prezzi scritti, senza sorprese.</h1><p class="lead">Per le coppie un pagamento unico per matrimonio. Per le wedding planner un canone mensile fisso, in base a quanti matrimoni segui.</p>
${defs([["Per le coppie", `Piano gratuito senza scadenza, oppure Completo a ${PREZZI.completo} una volta sola.`], ["Per le planner", `Da ${PREZZI.planner} al mese, con ${PREZZI.prova} giorni di prova gratuita.`], ["Per gli studi", "Un piano su misura, con prezzo su contatto."]])}<p class="small note">In questa fase di lancio l'accesso è gratuito. Nessun piano a pagamento parte senza il vostro consenso.</p></div>
<figure class="side-pic">${img("prezzi", { lazy: false })}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="plans-band sand" aria-labelledby="pc"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Per chi si sposa")}<h2 id="pc">Per le coppie.</h2></div><p class="lead">Un pagamento unico per matrimonio, perché l'organizzazione dura il tempo che serve e poi finisce. Potete restare sul piano gratuito quanto volete.</p></div>
<div class="plans">${plan({ href: APP, name: "Gratis", price: "0 €", sub: "Per iniziare a mettere ordine, senza limiti di tempo", items: ["Scadenze calcolate sulla data", "Budget e pagamenti", "Fino a 50 invitati", "Fino a 3 fornitori, un preventivo ciascuno", "Spazio condiviso con il partner"] })}
${plan({ href: APP, name: "Completo", price: PREZZI.completo, sub: "Una volta sola, per un matrimonio · IVA inclusa", items: ["Tutto il piano gratuito", "Invitati e fornitori illimitati", "Preventivi affiancati per ogni fornitore", "Tavoli e sala in pianta", "Programma del giorno, da esportare e stampare", "Invito alla wedding planner"], dark: true })}</div>
<div class="ui flush cmp"><div class="tscroll"><table class="tbl roles"><thead><tr><th>Cosa include</th><th>Gratis</th><th>Completo</th></tr></thead><tbody><tr><th scope="row">Scadenze calcolate sulla data</th><td>Sì</td><td>Sì</td></tr><tr><th scope="row">Spazio condiviso con il partner</th><td>Sì</td><td>Sì</td></tr><tr><th scope="row">Invitati e risposte</th><td>Fino a 50</td><td>Illimitati</td></tr><tr><th scope="row">Fornitori</th><td>Fino a 3</td><td>Illimitati</td></tr><tr><th scope="row">Budget e pagamenti</th><td>Sì</td><td>Sì</td></tr><tr><th scope="row">Preventivi</th><td>Uno per fornitore</td><td>Più preventivi affiancati</td></tr><tr><th scope="row">Tavoli e sala in pianta</th><td>No</td><td>Sì</td></tr><tr><th scope="row">Programma del giorno</th><td>No</td><td>Sì</td></tr><tr><th scope="row">Esportazione e stampa</th><td>No</td><td>Sì</td></tr><tr><th scope="row">Invito alla wedding planner</th><td>No</td><td>Sì</td></tr></tbody></table></div></div>
<p class="small note">Il piano Completo è personale: vale per un solo matrimonio e i nomi degli sposi si fissano all'attivazione, senza poterli cambiare.</p></div></section>
<section class="plans-band" aria-labelledby="pp"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Per chi organizza")}<h2 id="pp">Per le wedding planner.</h2></div><p class="lead">Un canone fisso al mese, scelto in base ai matrimoni che segui. ${PREZZI.prova} giorni di prova su Planner e Team, senza carta di credito. I prezzi per le planner sono IVA esclusa.</p></div>
<div class="plans three">${plan({ href: APP, name: "Planner", price: PREZZI.planner, per: "al mese + IVA", sub: `Fino a ${PREZZI.eventiPlanner} matrimoni attivi`, items: ["Dashboard con tutti gli eventi", "Portale condiviso con gli sposi", "Budget, acconti e saldi per evento", "Scadenze, tavoli e scaletta", "Note riservate"], cta: "Inizia la prova" })}
${plan({ href: APP, name: "Team", price: PREZZI.team, per: "al mese + IVA", sub: `Fino a ${PREZZI.eventiTeam} matrimoni attivi`, items: ["Tutto il piano Planner", `Fino a ${PREZZI.collabTeam} collaboratori con il proprio accesso`, "Assistenza prioritaria via email"], dark: true, tag: "Più persone", cta: "Inizia la prova" })}
${plan({ href: MAIL + "?subject=Piano%20Studio", name: "Studio", price: "Su misura", sub: "Prezzo su contatto", items: ["Matrimoni e collaboratori concordati insieme", "Configurazione sul metodo del vostro studio", "Avvio assistito per il team"], cta: "Parliamone" })}</div></div></section>
<section class="faq-band mist" aria-labelledby="faq"><div class="wrap faq-in"><div>${eyebrow("Prima di iniziare")}<h2 id="faq">Domande frequenti.</h2>
<div class="faq">${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div>
<figure class="side-pic">${img("pergolato")}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="closing" aria-labelledby="fine"><div class="wrap closing-in"><div>${eyebrow("Il prossimo tassello")}<h2 id="fine">Scegliete da dove partire.</h2><p class="lead">Aprite il vostro spazio adesso, oppure guardate prima la demo: si apre senza account, con dati di esempio.</p></div>
<div class="closing-btns">${btn(APP, "Inizia gratis")}${btn(DEMO, "Guarda la demo", "line")}</div></div></section>
</main>` + foot);

/* =========================================================== PAGINE LEGALI */
// Dati del titolare: completare indirizzo e partita IVA prima di attivare i pagamenti.
const TITOLARE = { nome: "Felice Mondo", sede: "Marcianise (CE), Italia", piva: "", email: "info@nozzeinordine.com" };
const AGGIORNATO = "15 novembre 2026";
const MAILTO = `<a href="mailto:${TITOLARE.email}">${TITOLARE.email}</a>`;
const legalPage = ({ file, title, desc, eb, h1, lead, body }) => write(file, head(title, desc) + top("") + `
<main id="main">
<section class="price-hero" aria-labelledby="h1"><div class="wrap"><div class="legal">${eyebrow(eb)}<h1 id="h1">${h1}</h1>
<p class="lead">${lead}</p>
<p class="small">Ultimo aggiornamento: ${AGGIORNATO}</p>
${body}
</div></div></section>
</main>` + foot);

legalPage({ file: "privacy.html", title: "Privacy | Nozze in Ordine", desc: "Come Nozze in Ordine tratta i dati personali sul sito e nella dashboard, ai sensi del Regolamento (UE) 2016/679.", eb: "Informativa", h1: "Privacy.",
  lead: "Quali dati trattiamo sul sito e nella dashboard, perché, per quanto tempo e come esercitare i vostri diritti. Informativa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).",
  body: `
<h2>1. Chi tratta i dati</h2>
<p>Il titolare del trattamento è ${TITOLARE.nome}, ${TITOLARE.sede}${TITOLARE.piva ? `, partita IVA ${TITOLARE.piva}` : ""}. Per qualsiasi richiesta sui dati: ${MAILTO}. Non è stato nominato un responsabile della protezione dei dati, perché non è obbligatorio per questa attività.</p>
<h2>2. I due ruoli di Nozze in Ordine</h2>
<p>Per i dati del vostro account e per l'uso del sito, Nozze in Ordine è <strong>titolare</strong> del trattamento.</p>
<p>Per i dati che inserite nella dashboard su altre persone (invitati, fornitori, collaboratori), Nozze in Ordine li conserva per vostro conto. Quando a inserirli è una wedding planner o un altro professionista, il professionista è titolare e Nozze in Ordine è <strong>responsabile del trattamento</strong> ai sensi dell'articolo 28 del GDPR, alle condizioni scritte nei <a href="termini.html#responsabile">Termini di servizio</a>. Le coppie che organizzano il proprio matrimonio lo fanno per un'attività personale; a quei dati applichiamo comunque le stesse garanzie.</p>
<h2>3. Quali dati trattiamo</h2>
<ul><li><strong>Account:</strong> nome e cognome, email, ruolo (coppia o wedding planner), data di registrazione e di accesso. La password è conservata in forma cifrata dal servizio di autenticazione e non è leggibile da noi.</li>
<li><strong>Matrimonio:</strong> nomi degli sposi, data, luogo, tipo di rito, budget e voci di spesa, pagamenti, fornitori con i loro contatti, preventivi, scadenze, scaletta della giornata, tavoli e disposizione della sala.</li>
<li><strong>Invitati:</strong> nome, nucleo familiare, gruppo, risposta all'invito, menù, tavolo e posto, note e, se le indicate, intolleranze e allergie alimentari.</li>
<li><strong>Note riservate</strong> delle wedding planner e inviti inviati a partner, sposi e collaboratori (email della persona invitata).</li>
<li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser e orari delle richieste, registrati per breve tempo dai server che consegnano il sito e la dashboard.</li>
<li><strong>Messaggi:</strong> ciò che ci scrivete per email.</li>
<li><strong>Lista d'attesa:</strong> le risposte di chi ha compilato i moduli quando il servizio era in lista d'attesa. I moduli non sono più attivi.</li></ul>
<h2>4. Intolleranze e allergie</h2>
<p>Le intolleranze e le allergie alimentari sono dati relativi alla salute (articolo 9 del GDPR). Le inserisce chi organizza il matrimonio, su indicazione dell'invitato, e servono soltanto a preparare i menù. Chi le inserisce garantisce di averle ricevute dall'interessato e di poterle comunicare a chi cura la ristorazione. Nozze in Ordine si limita a conservarle: non le legge, non le analizza e non le usa per altri scopi. Vi chiediamo di non scrivere altri dati sulla salute nei campi di testo libero.</p>
<h2>5. Perché li trattiamo e su quale base</h2>
<ul><li><strong>Per fornire il servizio</strong> che avete chiesto registrandovi: creare l'account, far funzionare la dashboard, mandarvi le email di servizio (conferma dell'indirizzo, recupero della password, inviti). Base: esecuzione del contratto (articolo 6, paragrafo 1, lettera b).</li>
<li><strong>Per la sicurezza</strong> del servizio, per prevenire abusi e per contare in forma aggregata come viene usato. Base: legittimo interesse (lettera f).</li>
<li><strong>Per gli obblighi di legge</strong>, per esempio fiscali e contabili quando saranno attivi i pagamenti. Base: obbligo legale (lettera c).</li>
<li><strong>Per rispondervi</strong> quando ci scrivete. Base: misure precontrattuali o legittimo interesse.</li>
<li><strong>Per la lista d'attesa</strong> già raccolta. Base: il consenso dato allora, che potete revocare in qualsiasi momento (lettera a).</li></ul>
<p>Non usiamo i dati per pubblicità, non li vendiamo e non li cediamo a terzi per loro scopi. Non facciamo profilazione né prendiamo decisioni automatizzate che producono effetti su di voi. Non inviamo newsletter: se in futuro lo faremo, sarà solo con un consenso separato.</p>
<h2>6. Per quanto tempo</h2>
<ul><li>I dati dell'account e dei matrimoni restano finché l'account è attivo.</li>
<li>Se chiedete la cancellazione, li eliminiamo entro 30 giorni dalla richiesta.</li>
<li>Dopo 24 mesi senza accessi possiamo chiudere l'account, avvisandovi prima per email con almeno 30 giorni di anticipo.</li>
<li>Le risposte alla lista d'attesa si conservano per 12 mesi dall'iscrizione, o fino alla revoca del consenso.</li>
<li>I documenti fiscali, quando ci saranno, si conservano per 10 anni come richiede la legge.</li></ul>
<h2>7. Chi riceve i dati</h2>
<p>I dati sono trattati da noi e dai fornitori che ci permettono di offrire il servizio, nominati responsabili del trattamento:</p>
<ul><li><strong>Supabase</strong> (Supabase, Inc.): database e autenticazione. I dati della dashboard sono conservati in un data center a Londra (Regno Unito).</li>
<li><strong>Cloudflare</strong> (Cloudflare, Inc.): consegna del sito e della dashboard, protezione dagli attacchi, inoltro delle email inviate a ${TITOLARE.email}.</li>
<li><strong>Google</strong> (Google Ireland Limited): casella di posta in cui leggiamo i vostri messaggi.</li></ul>
<p>Chi invitate nel vostro matrimonio (partner, wedding planner, collaboratori) vede i dati di quel matrimonio secondo il proprio ruolo.</p>
<h2>8. Trasferimenti fuori dall'Unione Europea</h2>
<p>Il Regno Unito è coperto da una decisione di adeguatezza della Commissione europea. Alcuni fornitori hanno sede negli Stati Uniti: in quel caso il trasferimento avviene sulla base del Data Privacy Framework UE-USA, quando il fornitore vi aderisce, oppure delle clausole contrattuali standard approvate dalla Commissione europea. Potete chiederci copia delle garanzie adottate.</p>
<h2>9. I vostri diritti</h2>
<p>Potete chiedere in qualsiasi momento l'accesso ai vostri dati, la correzione, la cancellazione, la limitazione del trattamento, la portabilità in un formato leggibile, e potete opporvi ai trattamenti basati sul legittimo interesse o revocare un consenso. Basta scrivere a ${MAILTO}: rispondiamo entro 30 giorni.</p>
<p>Potete anche presentare reclamo al <a href="https://www.garanteprivacy.it">Garante per la protezione dei dati personali</a> o all'autorità di controllo del paese dell'Unione Europea in cui vivete o lavorate.</p>
<h2>10. Se siete tra gli invitati</h2>
<p>Se i vostri dati sono stati inseriti da una coppia o da una wedding planner, li abbiamo ricevuti da loro (articolo 14 del GDPR). Per sapere quali sono, correggerli o farli cancellare potete rivolgervi a chi organizza il matrimonio oppure scrivere a noi: inoltreremo la richiesta e vi aiuteremo a ottenerne riscontro.</p>
<h2>11. Sicurezza</h2>
<p>Sito e dashboard sono raggiungibili solo con connessione cifrata. Ogni persona accede con le proprie credenziali e vede soltanto i matrimoni a cui partecipa: la regola è applicata direttamente nel database, non solo nell'interfaccia. In caso di violazione dei dati che comporti un rischio per le persone, avvisiamo il Garante e gli interessati nei tempi previsti dalla legge.</p>
<h2>12. Età minima</h2>
<p>Il servizio è riservato a chi ha compiuto 18 anni.</p>
<h2>13. Cookie</h2>
<p>Non usiamo cookie di profilazione né strumenti di analisi. I dettagli sono nella <a href="cookie.html">pagina cookie</a>.</p>
<h2>14. Modifiche</h2>
<p>Se questa informativa cambia in modo sostanziale, lo scriviamo qui e avvisiamo per email chi ha un account.</p>
<h2>Immagini</h2>
<p>Le fotografie del sito sono evocative e non rappresentano eventi organizzati da Nozze in Ordine. La foto del chiostro di Santa Chiara nella pagina di accesso è di Sailko, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, da <a href="https://commons.wikimedia.org/wiki/File:Chiostro_maiolicato_delle_clarisse_di_s._chiara,_1739-42,_01.jpg">Wikimedia Commons</a>.</p>
<p>Le altre fotografie vengono da <a href="https://unsplash.com/?utm_source=felice_mondo_progetti&amp;utm_medium=referral">Unsplash</a>, con la <a href="https://unsplash.com/license">licenza Unsplash</a>:</p>
<ul class="credits">${PHOTO_CREDITS.map(([f, a, au, p]) => `<li><a href="${p}">${f.replace(/-/g, " ")}</a> di <a href="${au}">${a}</a></li>`).join("")}</ul>` });

legalPage({ file: "cookie.html", title: "Cookie | Nozze in Ordine", desc: "Quali cookie e strumenti simili usano il sito e la dashboard di Nozze in Ordine: solo quelli tecnici, necessari al funzionamento.", eb: "Informativa", h1: "Cookie.",
  lead: "Il sito e la dashboard usano soltanto strumenti tecnici, necessari al funzionamento. Per questo non compare un banner di consenso: la legge lo richiede solo per cookie di profilazione e strumenti di analisi non anonimi, che qui non ci sono.",
  body: `
<h2>Sul sito</h2>
<p>Le pagine del sito non impostano cookie nostri, non caricano contenuti da altri siti e non usano strumenti di analisi o pixel pubblicitari. I caratteri tipografici e le immagini sono ospitati sul nostro stesso dominio.</p>
<p>Cloudflare, che consegna il sito, può impostare cookie tecnici di sicurezza per distinguere le visite reali dal traffico automatico. Sono strettamente necessari e non servono a riconoscervi tra siti diversi.</p>
<h2>Nella dashboard</h2>
<p>Quando accedete, il browser conserva nella propria memoria locale (<em>localStorage</em> e <em>sessionStorage</em>):</p>
<ul><li><strong>La sessione di accesso</strong>, che vi mantiene collegati senza reinserire la password a ogni pagina. Si cancella quando uscite dall'account.</li>
<li><strong>Le preferenze dell'interfaccia</strong>, per esempio l'ultima sezione aperta.</li></ul>
<p>Se lo consentite, la dashboard mostra le notifiche di scadenze e pagamenti sul vostro dispositivo. Il permesso si concede e si revoca dalle impostazioni del browser.</p>
<h2>Come cancellarli</h2>
<p>Potete cancellare in ogni momento cookie e dati dei siti dalle impostazioni del browser. Senza la sessione di accesso la dashboard vi chiederà di nuovo email e password.</p>
<h2>Se qualcosa cambia</h2>
<p>Se in futuro useremo strumenti di analisi o di altro tipo che richiedono il consenso, li attiveremo solo dopo avervelo chiesto, e aggiorneremo questa pagina.</p>
<p>Per il resto vale l'<a href="privacy.html">informativa privacy</a>. Domande: ${MAILTO}.</p>` });

legalPage({ file: "termini.html", title: "Termini di servizio | Nozze in Ordine", desc: "Le condizioni d'uso di Nozze in Ordine per coppie e wedding planner: account, piani, prezzi, recesso, dati e responsabilità.", eb: "Condizioni", h1: "Termini di servizio.",
  lead: "Le regole con cui usate Nozze in Ordine. Registrandovi le accettate. Abbiamo cercato di scriverle in modo che si leggano dall'inizio alla fine.",
  body: `
<h2>1. Chi siamo</h2>
<p>Nozze in Ordine è un servizio di ${TITOLARE.nome}, ${TITOLARE.sede}${TITOLARE.piva ? `, partita IVA ${TITOLARE.piva}` : ""}. Contatto: ${MAILTO}.</p>
<h2>2. Il servizio</h2>
<p>Nozze in Ordine è uno strumento online per organizzare matrimoni: budget, fornitori, invitati, tavoli, scadenze e scaletta. Non è un'agenzia, non organizza eventi e non seleziona né raccomanda fornitori. Il servizio è in fase di lancio: le funzioni possono cambiare e migliorare nel tempo.</p>
<h2>3. Account</h2>
<p>Per registrarvi dovete avere almeno 18 anni e indicare dati veri. L'account è personale: custodite le credenziali e avvisateci se pensate che qualcun altro le stia usando. Chi invitate in un matrimonio vede e modifica ciò che il suo ruolo prevede.</p>
<h2>4. Piani e prezzi</h2>
<ul><li><strong>Gratis</strong> (coppie): senza limiti di tempo, con i limiti di funzioni indicati nella <a href="prezzi.html">pagina prezzi</a>.</li>
<li><strong>Completo</strong> (coppie): ${PREZZI.completo}, IVA inclusa, una volta sola. Vale per un solo matrimonio. I nomi degli sposi si fissano all'attivazione e non possono essere cambiati. È riservato all'uso personale: non può essere usato da chi organizza matrimoni per lavoro.</li>
<li><strong>Planner</strong> e <strong>Team</strong> (professionisti): canone mensile di ${PREZZI.planner} e ${PREZZI.team}, IVA esclusa, con i limiti di matrimoni attivi e collaboratori indicati nella pagina prezzi. Un matrimonio è attivo finché la sua data non è passata. La prova gratuita dura ${PREZZI.prova} giorni.</li>
<li><strong>Studio</strong>: condizioni e prezzo concordati per iscritto.</li></ul>
<p>In questa fase di lancio i pagamenti non sono attivi e l'accesso è gratuito. Nessun piano a pagamento parte senza il vostro consenso espresso. Prima di attivare i pagamenti vi scriviamo per email; per i canoni mensili, ogni variazione di prezzo è comunicata con almeno 30 giorni di anticipo e potete disdire prima che si applichi.</p>
<h2>5. Recesso e disdetta</h2>
<p><strong>Coppie (consumatori).</strong> Avete 14 giorni dall'acquisto del piano Completo per ripensarci, senza dare spiegazioni: scrivete a ${MAILTO} e rimborsiamo l'importo pagato entro 14 giorni, con lo stesso mezzo di pagamento. Restano fermi tutti i diritti che il Codice del consumo riconosce, compresa la garanzia legale di conformità.</p>
<p><strong>Wedding planner (professionisti).</strong> Potete disdire il canone in qualsiasi momento: la disdetta ha effetto alla fine del mese già pagato, senza rimborso della parte restante.</p>
<h2>6. Uso corretto</h2>
<p>Non è consentito usare il servizio per scopi illeciti, inserire dati che non avete il diritto di trattare, tentare di accedere a matrimoni o account altrui, aggirare i limiti dei piani o rivendere l'accesso. In caso di violazione possiamo sospendere l'account, avvisandovi e dandovi modo di rimediare quando la situazione lo consente.</p>
<h2>7. I vostri contenuti</h2>
<p>Ciò che inserite resta vostro. Ci autorizzate a conservarlo ed elaborarlo solo per farvi funzionare il servizio. Vi consigliamo di tenere una copia delle informazioni più importanti.</p>
<h2>8. Dati di altre persone</h2>
<p>Inserendo dati di invitati, fornitori e collaboratori garantite di poterlo fare e di averli informati quando la legge lo richiede. Intolleranze e allergie vanno inserite solo su indicazione dell'interessato e solo per la preparazione dei menù. I dettagli sono nell'<a href="privacy.html">informativa privacy</a>.</p>
<h2 id="responsabile">9. Wedding planner: nomina a responsabile del trattamento</h2>
<p>Quando usate Nozze in Ordine per la vostra attività, siete titolari del trattamento dei dati dei vostri clienti e dei loro invitati, e ci nominate responsabili ai sensi dell'articolo 28 del GDPR, a queste condizioni:</p>
<ul><li><strong>Oggetto e durata:</strong> conservazione e messa a disposizione dei dati che inserite, per tutta la durata dell'account.</li>
<li><strong>Dati e interessati:</strong> dati anagrafici e di contatto, dati sull'evento e, se li inserite, intolleranze e allergie alimentari; riguardano sposi, invitati, fornitori e collaboratori.</li>
<li><strong>Istruzioni:</strong> trattiamo i dati solo secondo le vostre istruzioni, che coincidono con l'uso che fate della dashboard e con questi termini.</li>
<li><strong>Riservatezza e sicurezza:</strong> chi accede ai dati per nostro conto è tenuto alla riservatezza; applichiamo le misure descritte nell'informativa privacy.</li>
<li><strong>Altri responsabili:</strong> ci autorizzate a servirci dei fornitori elencati nell'informativa privacy, vincolati agli stessi obblighi. Vi informiamo prima di aggiungerne o sostituirne uno, e potete opporvi disdicendo il servizio.</li>
<li><strong>Diritti degli interessati:</strong> vi aiutiamo a rispondere alle richieste delle persone a cui i dati si riferiscono.</li>
<li><strong>Violazioni:</strong> vi avvisiamo senza ritardo, e comunque entro 48 ore da quando ne veniamo a conoscenza.</li>
<li><strong>Fine del rapporto:</strong> alla chiusura dell'account cancelliamo i dati entro 30 giorni, salvo obblighi di legge. Prima della chiusura potete chiederci una copia.</li>
<li><strong>Verifiche:</strong> su richiesta vi forniamo le informazioni necessarie a dimostrare il rispetto di questi obblighi.</li></ul>
<h2>10. Disponibilità e responsabilità</h2>
<p>Lavoriamo perché il servizio sia sempre raggiungibile, ma non possiamo garantire che non ci siano interruzioni o errori. Nozze in Ordine è uno strumento di organizzazione: le decisioni, i contratti con i fornitori e i pagamenti restano vostri. Nei limiti consentiti dalla legge, non rispondiamo dei danni indiretti né delle conseguenze di dati inseriti in modo errato. Queste limitazioni non valgono in caso di dolo o colpa grave e non riducono i diritti che la legge riconosce ai consumatori.</p>
<h2>11. Chiusura dell'account</h2>
<p>Potete chiudere l'account quando volete scrivendo a ${MAILTO}: cancelliamo i dati entro 30 giorni. Possiamo chiudere un account che viola questi termini, o cessare il servizio, con un preavviso di almeno 30 giorni che vi permetta di recuperare le vostre informazioni.</p>
<h2>12. Modifiche ai termini</h2>
<p>Se cambiamo questi termini in modo sostanziale vi avvisiamo per email con almeno 30 giorni di anticipo. Se non siete d'accordo potete chiudere l'account prima che le modifiche si applichino.</p>
<h2>13. Legge applicabile e controversie</h2>
<p>Si applica la legge italiana. Se siete consumatori, è competente il giudice del luogo in cui risiedete o avete domicilio e potete rivolgervi a un organismo di risoluzione alternativa delle controversie. Se usate il servizio per la vostra attività professionale, è competente in via esclusiva il Foro di Santa Maria Capua Vetere.</p>
<h2>14. Contatti</h2>
<p>Per qualsiasi domanda su questi termini: ${MAILTO}.</p>` });

console.log("pagine scritte in", OUT);
