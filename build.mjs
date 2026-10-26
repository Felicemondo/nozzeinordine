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
  home: ["home-hero", 1024, 1024, "Una lunga tavola apparecchiata all'aperto, con candele color terracotta, fiori bianchi e bicchieri di cristallo."],
  budget: ["tavola-budget", 1152, 928, "Un coperto con piatto dorato, tovagliolo legato con un nastro e un centrotavola di rose."],
  scadenze: ["bouquet-scadenze", 1200, 896, "Le mani di una sposa con l'anello che stringono un piccolo bouquet di rose chiare."],
  invitati: ["tavolata-invitati", 1024, 1024, "Invitati che ridono a una lunga tavolata tra le colline, sotto un pergolato."],
  costiera: ["editoriale-costiera", 1200, 896, "Una tavolata su una terrazza affacciata su un paese della costiera."],
  fiori: ["fiori-progetto", 1200, 896, "Una donna sistema un centrotavola di rose bianche e ulivo in un cortile di pietra."],
  coppie: ["coppie-hero", 1024, 1024, "Due sposi camminano mano nella mano lungo un viale alberato."],
  viale: ["editoriale-viale", 1584, 672, "Un viale di ulivi al tramonto, con una coppia di spalle."],
  versione: ["coppie-versione", 928, 1152, "Un coperto su tovaglia di lino, con partecipazioni legate da un nastro azzurro e una rosa bianca."],
  planner: ["planner-hero", 1376, 768, "Una wedding planner con auricolare e cartellina in un giardino allestito per un matrimonio."],
  scrivania: ["planner-scrivania", 1376, 768, "Una planner alla scrivania tra raccoglitori, campioni di colore e un portatile."],
  coord: ["planner-coordinamento", 1152, 928, "Una planner rivede la piantina della sala con una coppia, su una terrazza."],
  cambia: ["planner-cosa-cambia", 928, 1152, "Una lunga tavola apparecchiata in un giardino sul mare."],
  partiamo: ["planner-come-partiamo", 1200, 896, "Una tavola apparecchiata con piatti azzurri, ulivo e cartoncini segnaposto."],
  dettaglio: ["planner-dettaglio", 1584, 672, "Una cena di matrimonio su una terrazza sopra il mare della costiera."],
  prezzi: ["prezzi-tavola", 928, 1152, "Un piatto con una rosa bianca e un rametto d'ulivo su una tovaglia di lino, con cartoncini."],
  pergolato: ["prezzi-pergolato", 896, 1200, "Una lunga tavola sotto un pergolato di glicine, con candele e fiori."],
};
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
const top = (cur, cta) => `<a class="skip" href="#main">Vai al contenuto</a><header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="Nozze in Ordine, pagina iniziale">${MARK}<span>Nozze in Ordine</span></a>
<nav aria-label="Principale">${NAV.map(([h, l]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav><a class="btn sm" href="${cta}">Lista d'attesa ${ARROW}</a></div></header>`;
const foot = `<footer class="foot"><div class="wrap"><div class="foot-main"><div><p class="foot-brand">Nozze in Ordine</p><p>Per il vostro sì.</p></div>
<nav aria-label="Pagine"><a href="coppie.html">Per le coppie</a><a href="planner.html">Per le planner</a><a href="prezzi.html">Prezzi</a></nav>
<nav aria-label="Lista d'attesa e accesso"><a href="index.html#lista">Lista d'attesa</a><a href="app/">Accedi</a><a href="app/demo.html">Demo</a></nav></div>
<div class="foot-line"><span>© 2026 Nozze in Ordine · dalla Campania</span><a href="privacy.html">Privacy</a></div></div></footer><script src="app.js"></script></body></html>`;
const banner = (text) => `<div class="banner"><div class="wrap"><p>${text}</p><span class="tag">In costruzione</span></div></div>`;
const eyebrow = (t, cls = "") => `<p class="eyebrow${cls ? " " + cls : ""}">${t}</p>`;
const btn = (href, label, cls = "") => `<a class="btn${cls ? " " + cls : ""}" href="${href}">${label} ${ARROW}</a>`;
const hero = ({ k, eb, h1, p, a, b, fine, corner, tall }) => `<section class="hero${tall ? " tall" : ""}" aria-labelledby="h1">${img(k, { lazy: false, cls: "hero-img" })}<div class="wrap hero-in">
${eb}<h1 id="h1">${h1}</h1><p class="hero-p">${p}</p><div class="actions">${a}${b}</div><p class="fine">${fine}</p></div>${corner ? `<p class="corner">${corner}</p>` : ""}</section>`;
const feat = ({ k, n, h, p, card, side = "left", bg = "", id = "" }) => `<section class="feat ${side}${bg ? " " + bg : ""}"${id ? ` id="${id}"` : ""} aria-labelledby="f${n}"><figure class="feat-pic">${img(k)}</figure>
<div class="feat-text"><p class="num">${n}</p><h2 id="f${n}">${h}</h2><p class="lead">${p}</p>${card}</div></section>`;
const editorial = (k, quote, cap = "Nozze in Ordine · Dalla Campania") => `<section class="editorial" aria-label="Immagine">${img(k)}<blockquote><p>${quote}</p></blockquote><p class="cap">${cap}</p></section>`;
const defs = (rows) => `<dl class="defs">${rows.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>`;

/* ---------- modulo lista d'attesa ---------- */
const ZONE = `<option value="caserta">Provincia di Caserta</option><option value="napoli">Provincia di Napoli</option><option value="salerno">Provincia di Salerno</option><option value="avellino">Provincia di Avellino</option><option value="benevento">Provincia di Benevento</option><option value="altra">Altra regione</option>`;
const CONSENT = `<label class="check" for="consenso"><input type="checkbox" id="consenso" name="consenso"><span>Acconsento a ricevere un'email quando la prima versione è pronta. Uso l'indirizzo solo per questo e posso chiedere di cancellarlo quando voglio. <a href="privacy.html">Leggi l'informativa</a>.</span></label>`;
const PRICE = `<fieldset><legend id="prezzo-legend">Quale prezzo ti sembrerebbe giusto per la versione completa?</legend><div class="opts" id="prezzi" role="radiogroup" aria-labelledby="prezzo-legend"></div></fieldset>`;
const EMAIL = `<div class="fld"><label for="email">La tua email</label><input type="email" id="email" name="email" autocomplete="email" placeholder="nome@esempio.it" required></div>`;
const SUBMIT = `<div class="submit"><button class="btn" type="submit" id="invia">Iscrivimi alla lista ${ARROW}</button><p id="status" role="status" aria-live="polite"></p></div>`;
const FORM_COUPLE = `<form id="waitlist" class="form-card" data-profile="coppia" novalidate>
<div class="fld"><label for="zona">Dove?</label><select id="zona" name="zona">${ZONE}</select></div>${PRICE}${EMAIL}${CONSENT}${SUBMIT}</form>`;
const FORM_PLANNER = `<form id="waitlist" class="form-card" data-profile="planner" novalidate>
<div class="fld"><label for="eventi">Quanti matrimoni segui in un anno?</label><select id="eventi" name="eventi"><option value="1-4">Da 1 a 4</option><option value="5-10" selected>Da 5 a 10</option><option value="11-20">Da 11 a 20</option><option value="20+">Più di 20</option></select></div>
<div class="fld"><label for="strumenti">Cosa usi oggi per organizzare?</label><select id="strumenti" name="strumenti"><option value="fogli-whatsapp">Fogli di calcolo + WhatsApp</option><option value="gestionale">Un software gestionale</option><option value="carta">Quaderno e carta</option><option value="altro">Altro</option></select></div>
<div class="fld"><label for="zona">Dove?</label><select id="zona" name="zona">${ZONE}</select></div>${PRICE}${EMAIL}
<label class="check" for="chiamata"><input type="checkbox" id="chiamata" name="chiamata"><span>Mi farebbe piacere una chiamata di 25 minuti per raccontare come lavoro.</span></label>${CONSENT}${SUBMIT}</form>`;
const formSection = ({ eb, h, p, sub, note, form }) => `<section class="signup" id="lista" aria-labelledby="lst"><div class="wrap signup-in"><div class="signup-text">
${eyebrow(eb)}<h2 id="lst">${h}</h2><p class="lead">${p}</p><hr><h3>${sub}</h3><p class="small">${note}</p></div>${form}</div></section>`;
const PRICE_NOTE = "I prezzi indicati sono ipotesi per capire cosa ha senso. Non c'è un abbonamento attivo. Useremo l'email solo per avvisarti quando la prima versione è pronta.";

/* =========================================================== HOME */
write("index.html", head("Nozze in Ordine | Il tuo sì, un tassello alla volta", "Budget, fornitori, invitati e scadenze del matrimonio in uno spazio condiviso, per coppie e wedding planner. Partiamo dalla Campania.") + top("", "#lista") + `
<main id="main">
${hero({ k: "home", eb: eyebrow("Il vostro matrimonio, con calma", "light"), h1: "Il tuo sì, un tassello alla volta.", p: "Budget, fornitori, invitati e scadenze in uno spazio condiviso. Per organizzare ogni dettaglio con maggiore tranquillità.",
  a: btn("coppie.html#lista", "Sono una coppia"), b: btn("planner.html#lista", "Sono una wedding planner", "ghost"), fine: "Prima versione in costruzione · Lista d'attesa gratuita · Nessun pagamento ora", corner: "01 / Il sì" })}
${banner("Stiamo parlando con coppie e planner in Campania prima di costruire. Le schermate qui sotto sono anteprime con dati di esempio.")}
${feat({ k: "budget", n: "01", h: "Il budget che torna sempre.", p: "Previsto, firmato, pagato e residuo per ogni voce. Senza rifare i conti ogni sera.", card: BUDGET_CARD, side: "left" })}
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a partire dal giorno del matrimonio.", card: PATH_CARD, side: "right", bg: "sand" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Nuclei familiari, risposte e menù nello stesso elenco. Un invito, una riga.", card: RSVP_CARD(), side: "left", bg: "mist" })}
${editorial("costiera", "Tante cose da tenere insieme. Un posto in cui ritrovarle.")}
<section class="project" aria-labelledby="prog"><div class="wrap">
${eyebrow("Il progetto")}<h2 id="prog">Come e perché stiamo costruendo questo.</h2><p class="lead narrow">Partiamo dalla Campania, parlando con coppie e planner, prima di costruire. Le foto qui sono evocative — non mostrano eventi che abbiamo organizzato né un team.</p>
<div class="project-grid"><ol class="steps">
<li><span>01</span><h3>Ascoltiamo.</h3><p>Parliamo con coppie e wedding planner campane. 25 minuti a testa: ci interessa capire cosa oggi fa perdere tempo e cosa manca davvero.</p></li>
<li><span>02</span><h3>Proviamo.</h3><p>Uno spazio prototipale con dati di esempio, da provare insieme alle prime persone interessate. Niente promesse: solo prove reali.</p></li>
<li><span>03</span><h3>Costruiamo.</h3><p>La prima versione nasce da ciò che le conversazioni e le prove ci diranno. Ti scriviamo quando è pronta: nessun pagamento ora.</p></li></ol>
<figure class="project-pic">${img("fiori")}<figcaption>${eyebrow("Dove siamo ora")}<p>Stiamo raccogliendo le prime iscrizioni. La prima versione non è ancora disponibile.</p></figcaption></figure></div></div></section>
<section class="cta-dark" id="lista" aria-labelledby="lst"><div class="wrap cta-in"><div><h2 id="lst">Entra in lista d'attesa.</h2><p>Lista gratuita, nessun pagamento. Ti scriviamo solo quando la prima versione è pronta, partendo dalla Campania.</p></div>
<div class="cta-btns"><a class="choice light" href="coppie.html#lista">Sono una coppia ${ARROW}</a><a class="choice" href="planner.html#lista">Sono una wedding planner ${ARROW}</a><p>Nessun acquisto. Nessun accesso immediato.</p></div></div></section>
</main>` + foot);

/* =========================================================== COPPIE */
const PHASES = [["12+ mesi prima", "Data, budget e location"], ["9–11 mesi prima", "Fornitori principali e preventivi"], ["6–8 mesi prima", "Save the date e abiti"], ["3–5 mesi prima", "Dettagli, inviti e menù"], ["1–2 mesi prima", "Conferme finali e saldi"], ["Settimana del sì", "Scaletta e responsabili"]];
write("coppie.html", head("Per le coppie | Nozze in Ordine", "Budget, preventivi, invitati e scadenze nello stesso posto condiviso, per organizzare il matrimonio con calma.") + top("coppie.html", "#lista") + `
<main id="main">
${hero({ k: "coppie", tall: true, eb: `<p class="pill">In costruzione · Lista d'attesa gratuita</p>${eyebrow("Per le coppie", "light")}`, h1: "Il matrimonio, con calma.", p: "Budget, preventivi, invitati e scadenze nello stesso posto condiviso. Uno spazio che stiamo costruendo partendo dalle coppie campane.",
  a: btn("#lista", "Iscrivetevi alla lista"), b: btn("#funzioni", "Cosa include", "ghost"), fine: "Anteprime con dati di esempio · Non un prodotto già accessibile" })}
<section class="journey" aria-labelledby="perc"><div class="wrap"><div class="journey-head"><div>${eyebrow("Dal primo pensiero al giorno del sì")}<h2 id="perc">Un posto per tenere tutto insieme.</h2></div><p class="small">Anteprima con dati di esempio</p></div>
<div class="planner-box" data-wedding="2027-06-12"><div class="calc"><label for="data-si">La data del sì</label><div class="date-in"><input type="date" id="data-si" value="2027-06-12">${CAL}</div>
<div class="count big"><b data-weeks>32</b><i>/</i><b data-days>5</b><span>settimane</span><span>giorni</span></div><p class="small" id="cd-msg" role="status"></p></div>
<ol class="phases">${PHASES.map(([t, d], i) => `<li data-step="${i}"><b>${t}</b><span>${d}</span><small>Da avviare</small></li>`).join("")}</ol></div>
<p class="small note">Esempio con il 12 giugno 2027. Le date sono calcolate sul vostro giorno e non vengono salvate.</p></div></section>
<section class="feat-photo" aria-labelledby="fb">${img("budget")}<div class="wrap feat-photo-in"><div><p class="num">01</p><h2 id="fb">Il budget che torna sempre.</h2><p class="lead">Previsto, firmato, pagato e residuo per ogni voce. Senza rifare i conti ogni sera.</p></div>${BUDGET_CARD}</div></section>
${feat({ k: "scadenze", n: "02", h: "Scadenze che non si perdono.", p: "Acconti, saldi e conferme con la loro data. Le attività si calcolano a partire dal giorno del matrimonio, così sapete sempre cosa resta da fare.", card: PATH_CARD, side: "right" })}
${feat({ k: "invitati", n: "03", h: "Chi viene e chi deve ancora rispondere.", p: "Un invito, una riga. Nuclei familiari, risposte e menù in un elenco condiviso con il partner e con chi vi aiuta.", card: RSVP_CARD(" · dati di esempio"), side: "left", bg: "mist" })}
${editorial("viale", "Ogni dettaglio al suo posto. Ogni momento da vivere.")}
<section class="split-list" id="funzioni" aria-labelledby="funz"><div class="wrap">${eyebrow("Uno spazio condiviso")}<h2 id="funz">Cosa troverete nella prima versione.</h2>
<div class="split-grid"><div>${defs([["Budget e pagamenti", "Previsto, contrattualizzato, pagato e saldo residuo per ogni voce di spesa."], ["Fornitori e preventivi", "Scheda, contatti, allegati e stato della decisione, con i preventivi affiancati."], ["Checklist con scadenze", "Le attività si calcolano a partire dalla data del matrimonio."], ["Invitati e RSVP", "Nuclei familiari, risposte e menù, con esportazione."], ["Scaletta del giorno", "Orari, luoghi, responsabili e contatti per la giornata, da condividere."], ["Ruoli e documenti", "Sposi, planner e collaboratori con i loro permessi, e un archivio unico dei contratti."]])}
<p class="later">Per ora non ci sono marketplace di fornitori, app per telefono, chat interna e pagamenti ai fornitori. Prima vogliamo capire cosa serve a chi organizza un matrimonio.</p></div>
<figure class="side-pic">${img("versione")}<figcaption>I dettagli restano vostri. L'ordine diventa condiviso.</figcaption></figure></div></div></section>
<section class="aside-band sand" aria-labelledby="pl"><div class="wrap aside-in"><div>${eyebrow("Insieme, senza doppioni")}<h2 id="pl">C'è una wedding planner al vostro fianco?</h2><p class="lead">Potrà invitarvi nel suo spazio. Vedrete budget, scadenze e documenti condivisi, senza rifare nulla e senza scambiarvi file.</p>${btn("planner.html", "Scopri la parte per le planner", "line")}</div>
<figure class="side-pic">${img("fiori")}<figcaption>Chi vi accompagna ha il suo ruolo. Voi avete il vostro spazio.</figcaption></figure></div></section>
${formSection({ eb: "Costruiamolo insieme", h: "Entrate in lista d'attesa.", p: "Stiamo parlando con coppie e planner prima di costruire, a partire dalla Campania. Dicci quale prezzo ti sembra giusto: ci aiuta a decidere.", sub: "Nessun pagamento", note: PRICE_NOTE, form: FORM_COUPLE })}
</main>` + foot);

/* =========================================================== PLANNER */
write("planner.html", head("Per le wedding planner | Nozze in Ordine", "Tutti i matrimoni che segui in un unico spazio, con budget, fornitori, scadenze, documenti e un portale condiviso con gli sposi.") + top("planner.html", "#lista") + `
<main id="main">
${hero({ k: "planner", eb: eyebrow("Per le wedding planner", "light"), h1: "Tutti i matrimoni, in un unico spazio.", p: "Una dashboard per più eventi, con budget, fornitori, scadenze, documenti e un portale condiviso con gli sposi. Cerchiamo le prime planner pilota in Campania.",
  a: btn("#lista", "Racconta come lavori"), b: btn("#colpo", "Come funziona", "ghost"), fine: "Prima versione in costruzione · Lista d'attesa gratuita · Nessun pagamento ora", corner: "01 / Il coordinamento" })}
${banner("Stiamo parlando con planner in Campania prima di costruire. Le schermate qui sotto sono anteprime con dati di esempio.")}
<section class="glance" id="colpo" aria-labelledby="gl"><div class="wrap">${eyebrow("Il lavoro a colpo d'occhio")}<h2 id="gl">Una dashboard pensata per più eventi.</h2><p class="lead narrow">Budget, fornitori, scadenze e documenti in un unico spazio. Non è un'agenzia: è uno strumento per chi coordina più matrimoni contemporaneamente.</p>
<div class="glance-grid"><div class="glance-col">${img("scrivania")}${PLANNER_TABLE}</div><div class="glance-col">${img("coord")}${SCHEDULE}</div></div></div></section>
<section class="split-list" aria-labelledby="cam"><div class="wrap">${eyebrow("Cosa cambia")}<h2 id="cam">Cosa cambia per la tua organizzazione.</h2>
<div class="split-grid"><div>${defs([["Template duplicabili", "Checklist, budget e scaletta da riusare a ogni nuovo evento."], ["Portale per gli sposi", "Gli sposi vedono ciò che condividi, con budget, scadenze e documenti nello stesso spazio."], ["Acconti e saldi per evento", "Chi ha pagato cosa e cosa scade questa settimana, su tutti gli eventi."], ["Scaletta condivisa", "Orari e responsabili del giorno, da mandare a fornitori e collaboratori."], ["Collaboratori con ruoli", "Ognuno vede e modifica solo ciò che gli compete."]])}
<p class="later">Non c'è un CRM per i contratti con i clienti né la firma elettronica: per ora lavoriamo su ciò che succede dopo che l'incarico è firmato. Queste anteprime mostrano solo un'ipotesi di partenza.</p></div>
<figure class="side-pic">${img("cambia")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></div></section>
<section class="matrix mist" aria-labelledby="chi"><div class="wrap"><div class="matrix-head"><div>${eyebrow("Ruoli e collaborazione")}<h2 id="chi">Chi vede e modifica cosa.</h2></div><p class="lead">Un'ipotesi di partenza per i permessi, da correggere con chi organizza davvero. Questa matrice serve solo a capire come potrebbe funzionare la collaborazione.</p></div>
<div class="ui flush"><div class="tscroll"><table class="tbl roles"><thead><tr><th>Nello spazio condiviso</th><th>La planner</th><th>Gli sposi</th></tr></thead><tbody>
<tr><th scope="row">Preventivi</th><td>Li carica e li gestisce</td><td>Li confrontano e approvano</td></tr><tr><th scope="row">Scadenze</th><td>Le assegna</td><td>Completano le loro</td></tr>
<tr><th scope="row">Documenti</th><td>Li carica</td><td>Li leggono e scaricano</td></tr><tr><th scope="row">Note interne</th><td>Le scrive e le legge</td><td>Non le vedono</td></tr></tbody></table></div></div></div></section>
<section class="aside-band" aria-labelledby="part"><div class="wrap aside-in"><div>${eyebrow("Il progetto")}<h2 id="part">Come e perché stiamo costruendo questo.</h2><p class="lead">Partiamo dalla Campania, parlando con planner prima di costruire. Le foto qui sono evocative — non mostrano eventi che abbiamo organizzato né un team.</p><p class="lead">Cerchiamo le prime planner pilota in Campania. Funzioni, disponibilità e condizioni sono da concordare insieme.</p>${btn("#lista", "Raccontaci il tuo metodo", "line")}</div>
<figure class="side-pic">${img("partiamo")}<figcaption>Immagine evocativa: preparazione, coordinamento e controllo di più eventi.</figcaption></figure></div></section>
<section class="inset-pic" aria-label="Immagine"><div class="wrap"><figure>${img("dettaglio")}<figcaption><em>Ogni dettaglio al suo posto. Ogni momento da vivere.</em><span>Nozze in Ordine · Dalla Campania</span></figcaption></figure></div></section>
${formSection({ eb: "Raccontaci come lavori", h: "Raccontaci come lavori.", p: "Rispondi a poche domande e, se ti va, fissiamo una chiamata di 25 minuti. Ci aiuta a decidere cosa costruire, a che prezzo e se il prodotto ha senso per il tuo lavoro.", sub: "Nessun pagamento ora", note: PRICE_NOTE, form: FORM_PLANNER })}
</main>` + foot);

/* =========================================================== PREZZI */
const plan = ({ name, price, sub, items, dark, tag, href }) => `<article class="plan${dark ? " dark" : ""}"><div class="plan-top"><h3>${name}</h3>${tag ? `<span class="tag soft">Ipotesi · da definire</span>` : ""}</div><p class="plan-price">${price}</p><p class="small">${sub}</p><hr>
<ul>${items.map((i) => `<li>${CHECK}${i}</li>`).join("")}</ul><a class="btn ${dark ? "light" : "line"}" href="${href}">Entra in lista ${ARROW}</a></article>`;
const faq = [["Devo pagare adesso?", "No. Per ora non addebitiamo nulla. Le cifre sono ipotesi: iscriverti alla lista ci aiuta a capire quale prezzo ha senso, senza alcun pagamento."],
  ["Perché i prezzi hanno un intervallo?", "Perché li stiamo ancora definendo. Nel modulo ci dici quale cifra ti sembra giusta e usiamo le risposte per decidere."],
  ["Il piano per le coppie è un abbonamento?", "Nelle nostre ipotesi no. È un pagamento unico per matrimonio, perché un matrimonio si organizza una volta sola."],
  ["Se sono una planner, posso seguire più matrimoni?", "Sì, è lo scopo del piano per planner: più eventi nello stesso spazio, ognuno con i suoi dati."],
  ["Cosa succede ai miei dati?", `Per la lista d'attesa raccogliamo email, zona, profilo e prezzo scelto. I dettagli sono nella <a href="privacy.html">pagina privacy</a>.`]];
write("prezzi.html", head("Prezzi | Nozze in Ordine", "Prezzi ipotetici per coppie e wedding planner: li decidiamo con chi si iscrive. La lista d'attesa è gratuita.") + top("prezzi.html", "index.html#lista") + `
<main id="main">
${banner("Stiamo parlando con coppie e planner in Campania prima di costruire. Le cifre qui sotto sono ipotesi, non offerte acquistabili.")}
<section class="price-hero" aria-labelledby="h1"><div class="wrap price-hero-in"><div>${eyebrow("Prezzi / Ipotesi, non promesse")}<h1 id="h1">Quanto costerà.</h1><p class="lead">Non abbiamo ancora fissato i prezzi. Le cifre qui sotto sono ipotesi che decideremo con chi si iscrive e, per ora, non addebitiamo nulla.</p>
${defs([["Per le coppie", "Un pagamento unico per matrimonio, tra 29 e 69 € (ipotesi)."], ["Per le planner", "Un abbonamento mensile, tra 19 e 49 € (ipotesi)."]])}<p class="small note">La lista d'attesa è gratuita e non richiede pagamenti.</p></div>
<figure class="side-pic">${img("prezzi", { lazy: false })}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="plans-band sand" aria-labelledby="pc"><div class="wrap"><div class="matrix-head"><div>${eyebrow("01 / Per le coppie")}<h2 id="pc">Per le coppie.</h2></div><p class="lead">Un pagamento unico per matrimonio, perché l'organizzazione dura il tempo che serve e poi finisce. Questi piani sono ipotesi, non offerte acquistabili.</p></div>
<div class="plans">${plan({ href: "coppie.html#lista", name: "Gratis", price: "0 €", sub: "Per iniziare a mettere ordine", items: ["Checklist con scadenze", "Budget sintetico", "Fino a 50 invitati", "Fino a 3 fornitori", "Collaborazione con il partner"] })}
${plan({ href: "coppie.html#lista", name: "Completo", price: "Tra 29 e 69 €", sub: "Una tantum per matrimonio · ipotesi da confermare", items: ["Invitati illimitati e RSVP", "Preventivi affiancati e pagamenti", "Documenti e contratti", "Scaletta del giorno", "Esportazione dei dati"], dark: true, tag: true })}</div></div></section>
<section class="plans-band" aria-labelledby="pp"><div class="wrap">${eyebrow("02 / Per chi organizza")}<h2 id="pp">Per le wedding planner.</h2>
<div class="plans">${plan({ href: "planner.html#lista", name: "Solo", price: "Tra 19 e 29 € al mese", sub: "Abbonamento mensile · ipotesi da confermare", items: ["Eventi illimitati", "Portale per gli sposi", "Template duplicabili", "Scadenze e acconti per evento"], tag: true })}
${plan({ href: "planner.html#lista", name: "Studio", price: "Tra 39 e 49 € al mese", sub: "Abbonamento mensile · ipotesi da confermare", items: ["Tutto il piano Solo", "Più collaboratori con ruoli", "Report economici per evento", "Marchio personalizzato (in arrivo)"], dark: true, tag: true })}</div></div></section>
<section class="faq-band mist" aria-labelledby="faq"><div class="wrap faq-in"><div>${eyebrow("Prima di iscriversi")}<h2 id="faq">Domande frequenti.</h2>
<div class="faq">${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div>
<figure class="side-pic">${img("pergolato")}<figcaption>${EVOC}</figcaption></figure></div></section>
<section class="closing" aria-labelledby="fine"><div class="wrap closing-in"><div>${eyebrow("Il prossimo tassello")}<h2 id="fine">Il prezzo giusto lo decidiamo insieme.</h2><p class="lead">Raccontaci cosa ti serve e quale cifra ti sembra sensata. Cominciamo dalle persone, prima di costruire il prodotto. Nessun pagamento ora.</p></div>
<div class="closing-btns">${btn("coppie.html#lista", "Sono una coppia")}${btn("planner.html#lista", "Sono una wedding planner", "line")}</div></div></section>
</main>` + foot);

/* =========================================================== PRIVACY */
write("privacy.html", head("Privacy | Nozze in Ordine", "Come trattiamo i dati della lista d'attesa di Nozze in Ordine.") + top("", "index.html#lista") + `
<main id="main">
<section class="price-hero" aria-labelledby="h1"><div class="wrap"><div class="legal">${eyebrow("Informativa")}<h1 id="h1">Privacy.</h1>
<p class="lead">Cosa raccogliamo quando ti iscrivi alla lista d'attesa, a cosa serve e come puoi chiedere di cancellarlo.</p>
<p class="small">Ultimo aggiornamento: 14 ottobre 2026</p>
<h2>Chi tratta i dati</h2>
<p>Il titolare del trattamento è Felice Mondo, persona fisica. Puoi scrivere a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>.</p>
<h2>Quali dati raccogliamo</h2>
<ul><li>Email</li><li>Se sei una coppia o una wedding planner</li><li>Provincia o regione</li><li>Il prezzo che ti sembra giusto</li><li>Per le planner: numero di matrimoni l'anno, strumenti usati e se vuoi una chiamata</li><li>La data dell'iscrizione</li></ul>
<p>Nella prima fase non raccogliamo dati su intolleranze alimentari o salute degli invitati. Per questo nel campo note degli invitati vi chiediamo di non scrivere dati sulla salute. Se in futuro li raccoglieremo, lo scriveremo qui e chiederemo un consenso specifico.</p>
<h2>Perché li raccogliamo</h2>
<p>Per avvisarti quando la prima versione è pronta e per capire quali funzioni e quali prezzi servono. La base è il tuo consenso, che puoi revocare in qualsiasi momento.</p>
<h2>Per quanto tempo</h2>
<p>Conserviamo i dati per 12 mesi dall'iscrizione, oppure fino a quando revochi il consenso se succede prima. Alla scadenza ti chiediamo se vuoi restare in lista; se non rispondi, li cancelliamo.</p>
<h2>I tuoi diritti</h2>
<p>Puoi chiedere accesso, correzione o cancellazione dei dati e revocare il consenso scrivendo a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>. Puoi anche rivolgerti al Garante per la protezione dei dati personali.</p>
<h2>Dove sono conservati e chi li gestisce</h2>
<p>Le iscrizioni sono salvate su Supabase, in un data center situato in Europa. Il sito è consegnato tramite Cloudflare, che gestisce anche l'inoltro delle email che arrivano a info@nozzeinordine.com. Alcuni di questi fornitori sono società con sede fuori dall'Unione Europea.</p>
<p>Come ogni sito, i server che consegnano le pagine registrano per breve tempo dati tecnici come l'indirizzo IP. I caratteri tipografici sono ospitati sul nostro stesso sito. In questa fase non usiamo cookie di profilazione né strumenti di analisi.</p>
<h2>Immagini</h2>
<p>Le fotografie del sito sono evocative e non rappresentano eventi organizzati da Nozze in Ordine. La foto del chiostro di Santa Chiara nella pagina di accesso è di Sailko, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, da <a href="https://commons.wikimedia.org/wiki/File:Chiostro_maiolicato_delle_clarisse_di_s._chiara,_1739-42,_01.jpg">Wikimedia Commons</a>.</p>
</div></div></section>
</main>` + foot);

console.log("pagine scritte in", OUT);
