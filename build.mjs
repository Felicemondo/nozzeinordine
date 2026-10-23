// Genera le pagine di site/ a partire dai contenuti qui sotto.  node build.mjs
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
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy], i) => `<path class="t t${i + 1}" d="${outer(sx, sy)}"/>`).join("") +
  `<path d="M20,32 A12,12 0 1 0 44,32 A12,12 0 1 0 20,32 Z"/></svg>`;

/* ---------- date: stesso calcolo di app.js, per la pagina senza script ---------- */
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const addMonths = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); return x.getDate() !== d.getDate() ? new Date(d.getFullYear(), d.getMonth() + n + 1, 0) : x; };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmt = (d) => `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
const PHASES = [
  ["12+ mesi prima", "Data, budget e location"],
  ["9-11 mesi prima", "Fornitori principali e preventivi"],
  ["6-8 mesi prima", "Save the date e abiti"],
  ["3-5 mesi prima", "Dettagli, menù e inviti"],
  ["1-2 mesi prima", "Conferme finali e saldi"],
  ["Settimana del sì", "Scaletta e responsabili"],
];
const WEDDING = new Date(2027, 5, 12);
const now = new Date(); const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const days = Math.max(0, Math.round((WEDDING - TODAY) / 86400000));
const bounds = [addMonths(WEDDING, -12), addMonths(WEDDING, -9), addMonths(WEDDING, -6), addMonths(WEDDING, -3), addDays(WEDDING, -7), WEDDING];
let cur = 0; while (cur < 5 && TODAY > bounds[cur]) cur++;
const floorTiles = PHASES.map(([t, d], i) => {
  const span = i === 0 ? `fino al ${fmt(bounds[0])}` : `${fmt(bounds[i - 1])} – ${fmt(bounds[i])}`;
  const st = i < cur ? "past" : i === cur ? "now" : "next";
  const cls = st === "now" ? " now" : st === "past" ? " laid" : "";
  const chip = st === "now" ? ["on", "In corso"] : st === "past" ? ["past", "Già passata"] : ["", "Da venire"];
  return `<li class="tile${cls}" data-phase><h3>${t}</h3><p>${d}</p><span class="chip ${chip[0]}">${chip[1]}</span><span class="when">${span}</span></li>`;
}).join("");
const iso = `${WEDDING.getFullYear()}-06-12`;
const FLOOR = `
<div class="stage" data-ui aria-label="Esempio: scadenze calcolate sulla data del matrimonio">
  <ol class="floor">
    <li class="tile calc">
      <div><label for="data-si">La data del sì</label><input type="date" id="data-si" value="${iso}"></div>
      <div><div class="count"><div><b id="cd-w">${Math.floor(days / 7)}</b><span>settimane</span></div><div><b id="cd-d">${days % 7}</b><span>giorni</span></div></div>
      <p class="small soft" id="cd-msg" role="status"></p></div>
      <p class="small soft">Cambia la data: le scadenze si ricalcolano.</p>
    </li>
    ${floorTiles}
  </ol>
</div>
<p class="note">Esempio con il 12 giugno 2027. Le date sono calcolate sul tuo giorno e non vengono salvate.</p>`;

/* ---------- frammenti del prodotto (dati di esempio) ---------- */
const BUDGET = (() => {
  const rows = [["Location e ricevimento", 3000, 9800, 10500], ["Fotografo e video", 700, 2200, 2400], ["Abiti", 1450, 2900, 3600], ["Musica", 300, 1200, 1500], ["Fiori e allestimenti", 0, 0, 1800], ["Altre voci", 0, 0, 6200]];
  const n = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const tot = rows.reduce((a, r) => [a[0] + r[1], a[1] + r[2], a[2] + r[3]], [0, 0, 0]);
  const body = rows.map(([l, p, c, b]) => `<div class="r"><span>${l}</span><div class="bar" role="img" aria-label="Pagato ${n(p)} €, firmato ${n(c)} €, previsto ${n(b)} €"><i class="p" style="width:${(p / b * 100).toFixed(1)}%"></i><i class="c" style="width:${((c - p) / b * 100).toFixed(1)}%"></i></div><b>${n(p)} / ${n(c)} / ${n(b)}</b></div>`).join("");
  return `<div class="panel stage" data-ui aria-label="Esempio: budget per voce"><div class="bud">
  <div class="r head"><span>Voce</span><span>Pagato e firmato sul previsto</span><b>Pagato / firmato / previsto</b></div>${body}
  <div class="legend"><span class="k">Pagato</span><span class="k c">Firmato</span><span class="k f">Previsto</span></div>
  <div class="tot"><span>Budget<b>${n(tot[2])} €</b></span><span>Contratti firmati<b>${n(tot[1])} €</b></span><span>Pagato<b>${n(tot[0])} €</b></span><span>Ancora da pagare<b>${n(tot[1] - tot[0])} €</b></span></div></div></div>`;
})();

const QUOTES = `<div class="panel stage" data-ui aria-label="Esempio: due preventivi del catering a confronto"><div class="quotes">
  <div class="quote pick"><span class="chip ok">Scelto</span><p class="price">95 € <small>a persona</small></p><dl><dt>Catering · Preventivo A</dt><dd>Aperitivo incluso</dd><dt>Scade il</dt><dd>30 novembre 2026</dd><dt>Totale per 150 invitati</dt><dd>14.250 €</dd></dl></div>
  <div class="quote"><span class="chip">Da valutare</span><p class="price">82 € <small>a persona</small></p><dl><dt>Catering · Preventivo B</dt><dd>Aperitivo escluso</dd><dt>Scade il</dt><dd>15 dicembre 2026</dd><dt>Totale per 150 invitati</dt><dd>12.300 €</dd></dl></div>
  <div class="diff"><span>Differenza tra i due totali</span><b>1.950 €</b></div></div></div>`;

const RSVP = (() => {
  const tiles = [...Array(84).fill("ok"), ...Array(18).fill("no"), ...Array(48).fill("wait")].map((c) => `<i class="${c}"></i>`).join("");
  return `<div class="panel stage rsvp-panel" data-ui aria-label="Esempio: 150 inviti, 84 confermati, 18 rifiutati, 48 in attesa"><div class="rsvp"><div class="mosaic" role="img" aria-label="150 riggiole: 84 verdi, 18 cotto, 48 chiare">${tiles}</div>
  <div class="sum"><span class="chip ok">Confermati <b>84</b></span><span class="chip no">Rifiutati <b>18</b></span><span class="chip wait">In attesa <b>48</b></span><span class="soft">102 risposte su 150 inviti</span></div></div></div>`;
})();

const EVENTS = (() => {
  const ev = [["Chiara e Marco", "12 giu 2027", "7 di 9", 21], ["Anna e Luca", "4 lug 2027", "5 di 9", 34], ["Sara e Paolo", "18 set 2027", "2 di 8", 12], ["Giulia e Andrea", "2 ott 2027", "1 di 8", 5]];
  return `<div class="panel stage" data-ui aria-label="Esempio: eventi attivi di una wedding planner"><div class="tscroll"><table class="tbl"><thead><tr><th>Evento</th><th>Data</th><th>Fornitori</th><th>Pagato sul budget</th></tr></thead><tbody>` +
    ev.map(([n, d, f, p]) => `<tr><td>${n}</td><td class="n">${d}</td><td class="n">${f}</td><td><div class="pct"><div class="bar"><i style="width:${p}%"></i></div><span class="n">${p}%</span></div></td></tr>`).join("") +
    `</tbody></table></div></div>`;
})();

const WEEK = `<div class="panel stage" data-ui aria-label="Esempio: scaletta del giorno"><div class="week">
  <div class="r"><b>15:30</b><span>Arrivo degli invitati</span><span class="soft">Wedding planner</span></div>
  <div class="r on"><b>16:00</b><span>Cerimonia</span><span class="soft">Celebrante</span></div>
  <div class="r"><b>17:30</b><span>Foto di gruppo</span><span class="soft">Fotografo</span></div>
  <div class="r"><b>18:30</b><span>Aperitivo in giardino</span><span class="soft">Catering</span></div>
  <div class="r"><b>20:00</b><span>Cena</span><span class="soft">Catering</span></div>
  <div class="r"><b>23:30</b><span>Taglio della torta</span><span class="soft">Sposi</span></div></div></div>`;

const rv = (d = 0) => `data-rv style="--d:${d}ms"`;

/* ---------- immagini ---------- */
const IMG = {
  viale1: ["img/viale-1.jpg", 1500, 1000, "Il viale del chiostro maiolicato di Santa Chiara a Napoli: file di pilastri rivestiti di riggiole e panche decorate."],
  viale2: ["img/viale-2.jpg", 1500, 843, "Lo stesso viale del chiostro di Santa Chiara, visto con alcune persone che lo percorrono."],
  tenda: ["img/riggiole-tenda.jpg", 1500, 934, "Riggiole dipinte del chiostro di Santa Chiara: una scena di campagna con una tenda a strisce gialle e azzurre."],
  ravello: ["img/ravello.jpg", 1500, 995, "Un pino marittimo e due torrette di Villa Rufolo, sopra il mare della Costiera Amalfitana."],
  paesaggio: ["img/riggiole-paesaggio.jpg", 1500, 540, "Pannello di riggiole dipinte: un paesaggio con un fiume, alberi e una torre, incorniciato di giallo."],
};
const img = (k, extra = "") => `<img src="${IMG[k][0]}" width="${IMG[k][1]}" height="${IMG[k][2]}" alt="${IMG[k][3]}" ${extra}>`;

const LZ = 'loading="lazy" decoding="async"';
const xf = (a, b, extra = "") => `<div class="frame-img xfade drift"${extra}>${img(a, LZ)}${img(b, LZ)}</div>`;
const strip = (cap) => `<section class="section frame" aria-label="Riggiole"><figure class="pic strip" ${rv()}><div class="frame-img drift">${img("paesaggio", LZ)}</div><figcaption>${cap}</figcaption></figure></section>`;
const CREDITS = `Foto: Sailko, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, da Wikimedia Commons: <a href="https://commons.wikimedia.org/wiki/File:Chiostro_maiolicato_delle_clarisse_di_s._chiara,_1739-42,_01.jpg">chiostro maiolicato 01</a>, <a href="https://commons.wikimedia.org/wiki/File:Santa_chiara,_chiostro_maiolicato_02.JPG">chiostro maiolicato 02</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=83108541">riggiole, la tenda</a>, <a href="https://commons.wikimedia.org/w/index.php?curid=83108543">riggiole, il paesaggio</a>. Villa Rufolo: Leandro Neumann Ciuffo, <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>, da <a href="https://commons.wikimedia.org/wiki/File:Vista_da_Villa_Rufolo_-_1_(9704341704).jpg">Wikimedia Commons</a>. Ritagliate e ridimensionate.`;

/* ---------- struttura comune ---------- */
const NAV = [["coppie.html", "Per le coppie"], ["planner.html", "Per le planner"], ["prezzi.html", "Prezzi"]];
const head = (title, desc, file) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="${desc}"><meta name="theme-color" content="#F1F0EC"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="twitter:card" content="summary_large_image"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:image" content="https://nozzeinordine.com/og.png"><link rel="stylesheet" href="styles.css"></head><body>`;
const top = (cur, cta) => `<div class="frame"><header class="top"><a class="brand" href="index.html" aria-label="Nozze in Ordine, pagina iniziale">${MARK}<span>Nozze in Ordine</span></a><nav aria-label="Principale">${NAV.map(([h, l]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav><a class="btn sm" href="${cta}">Lista d'attesa</a></header></div>`;
const foot = (withCredits) => `<div class="frame"><footer class="foot"><div class="line"><span>Nozze in Ordine, dalla Campania</span><nav aria-label="Piè di pagina"><a href="coppie.html">Coppie</a><a href="planner.html">Planner</a><a href="prezzi.html">Prezzi</a><a href="index.html#lista">Lista d'attesa</a></nav><span>2026 · <a href="privacy.html">Privacy</a></span></div>${withCredits ? `<p class="credits">${CREDITS}</p>` : ""}</footer></div><script src="app.js"></script></body></html>`;

/* ---------- modulo lista d'attesa ---------- */
const COMUNE_OPTS = `<option value="caserta">Provincia di Caserta</option><option value="napoli">Provincia di Napoli</option><option value="salerno">Provincia di Salerno</option><option value="avellino">Provincia di Avellino</option><option value="benevento">Provincia di Benevento</option><option value="altra">Altra regione</option>`;
const FORM_COUPLE = `<form id="waitlist" data-profile="coppia" novalidate>
<div class="fld"><label for="zona">Dove?</label><select id="zona" name="zona">${COMUNE_OPTS}</select></div>
<fieldset><legend id="prezzo-legend">Quale prezzo ti sembrerebbe giusto per la versione completa?</legend><div class="opts" id="prezzi" role="radiogroup" aria-labelledby="prezzo-legend"></div></fieldset>
<div class="fld"><label for="email">La tua email</label><input type="email" id="email" name="email" autocomplete="email" placeholder="nome@esempio.it" required></div>
<label class="consent" for="consenso"><input type="checkbox" id="consenso" name="consenso"><span>Acconsento a ricevere un'email quando la prima versione è pronta. Uso l'indirizzo solo per questo e puoi chiedere di cancellarlo quando vuoi. <a href="privacy.html">Leggi l'informativa</a>.</span></label>
<div><button class="btn" type="submit" id="invia">Iscrivimi alla lista <span class="arrow" aria-hidden="true">→</span></button><p id="status" role="status" aria-live="polite"></p></div></form>`;
const FORM_PLANNER = `<form id="waitlist" data-profile="planner" novalidate>
<div class="fld"><label for="eventi">Quanti matrimoni segui in un anno?</label><select id="eventi" name="eventi"><option value="1-4">Da 1 a 4</option><option value="5-10" selected>Da 5 a 10</option><option value="11-20">Da 11 a 20</option><option value="20+">Più di 20</option></select></div>
<div class="fld"><label for="strumenti">Cosa usi oggi per organizzare?</label><select id="strumenti" name="strumenti"><option value="fogli-whatsapp">Fogli di calcolo e WhatsApp</option><option value="gestionale">Un software gestionale</option><option value="carta">Quaderno e carta</option><option value="altro">Altro</option></select></div>
<div class="fld"><label for="zona">Dove?</label><select id="zona" name="zona">${COMUNE_OPTS}</select></div>
<fieldset><legend id="prezzo-legend">Quale prezzo ti sembrerebbe giusto per la versione completa?</legend><div class="opts" id="prezzi" role="radiogroup" aria-labelledby="prezzo-legend"></div></fieldset>
<div class="fld"><label for="email">La tua email</label><input type="email" id="email" name="email" autocomplete="email" placeholder="nome@esempio.it" required></div>
<label class="consent" for="chiamata"><input type="checkbox" id="chiamata" name="chiamata"><span>Mi farebbe piacere una chiamata di 25 minuti per raccontare come lavoro.</span></label>
<label class="consent" for="consenso"><input type="checkbox" id="consenso" name="consenso"><span>Acconsento a ricevere un'email quando la prima versione è pronta. Uso l'indirizzo solo per questo e puoi chiedere di cancellarlo quando vuoi. <a href="privacy.html">Leggi l'informativa</a>.</span></label>
<div><button class="btn" type="submit" id="invia">Iscrivimi alla lista <span class="arrow" aria-hidden="true">→</span></button><p id="status" role="status" aria-live="polite"></p></div></form>`;
const formSection = (h, p, form, aside) => `<div class="rig" aria-hidden="true"></div>
<section class="field" id="lista" aria-labelledby="lst"><div class="frame"><div class="grid"><h2 id="lst" ${rv()}>${h}</h2><p class="lead after" ${rv(80)}>${p}</p></div>
<div class="form-wrap"><div class="form-card" style="grid-column:1 / span 7" ${rv(120)}>${form}</div><div class="form-aside" ${rv(200)}>${aside}</div></div></div></section>`;

/* =========================================================== HOME */
write("index.html", head("Nozze in Ordine | Il tuo sì, un tassello alla volta", "Budget, fornitori, invitati e scadenze del matrimonio in un solo posto, per coppie e wedding planner. Partiamo dalla Campania.", "index") + top("", "#lista") + `
<main>
<section class="hero frame" aria-labelledby="h1"><div class="grid"><h1 id="h1" class="t-long">Il tuo sì, un tassello alla volta.</h1>
<div class="intro"><p class="sub">Tutto il matrimonio, finalmente in ordine.</p><p>Budget, fornitori, invitati e scadenze in uno spazio condiviso, per organizzare ogni dettaglio con maggiore tranquillità. Provalo subito: scrivi la data del sì.</p><div class="actions"><a class="btn" href="coppie.html#lista">Sono una coppia <span class="arrow" aria-hidden="true">→</span></a><a class="btn alt" href="planner.html#lista">Sono una wedding planner <span class="arrow" aria-hidden="true">→</span></a></div></div>
<figure class="pic photo" ${rv(120)}><div class="frame-img xfade drift">${img("viale1", 'decoding="async"')}${img("viale2", LZ)}</div><figcaption>Il chiostro maiolicato di Santa Chiara, a Napoli: da qui viene l'idea delle tessere.</figcaption></figure>
<div class="stage-wrap" id="scadenze" ${rv(200)}>${FLOOR}</div></div></section>

<section class="section frame" aria-labelledby="cose"><div class="grid"><p class="secno" aria-hidden="true">N° 01</p><h2 class="sec-head" id="cose" ${rv()}>Ogni cosa al suo posto.</h2>
<div class="overview" ${rv()}>
<a class="ov big" href="#budget"><h3>Budget</h3><p class="fig">26.000 €<small>previsto · 5.450 € già pagati</small></p><p>Previsto, firmato, pagato e residuo per ogni voce di spesa.</p><span class="go">Vedi un esempio →</span></a>
<a class="ov a" href="#invitati"><h3>Invitati</h3><p class="fig">84 su 150<small>hanno confermato</small></p><span class="go">Vedi un esempio →</span></a>
<a class="ov b" href="#scadenze"><h3>Scadenze</h3><p class="fig">6 fasi<small>sulla tua data</small></p><span class="go">Provale qui sopra ↑</span></a>
<a class="ov c" href="#preventivi"><h3>Fornitori</h3><p class="fig">2 preventivi<small>a confronto, con il totale</small></p><p>Scheda, contatti e stato della decisione.</p><span class="go">Vedi un esempio →</span></a></div>
<p class="note" style="grid-column:1 / -1" ${rv()}>Cifre di esempio: servono a mostrare come sarà, non sono dati reali.</p></div></section>

<section class="section frame" aria-labelledby="caos"><div class="grid"><p class="secno" aria-hidden="true">N° 02</p><h2 class="sec-head" id="caos" ${rv()}>Meno caos. Più controllo.</h2>
<p class="lead sec-lead" ${rv()}>Pianifica le scadenze, confronta i preventivi, coordina il giorno. Cinque schermate d'esempio, con dati finti dichiarati.</p>
<div class="grid mod" style="grid-column:1 / -1" id="budget"><div style="--span:7;grid-column:1 / span 7" ${rv()}>${BUDGET}</div><div class="words" ${rv(120)}><h3>Quanto hai speso, voce per voce</h3><p>Previsto, firmato, pagato e residuo per ogni voce. Il totale torna sempre, senza rifare i conti ogni sera.</p></div></div>
<div class="grid mod" style="grid-column:1 / -1" id="preventivi"><div style="grid-column:1 / span 6" ${rv()}>${QUOTES}</div><div class="words" ${rv(120)}><h3>I preventivi, uno accanto all'altro</h3><p>PDF, email e messaggi finiscono nella scheda del fornitore. Confronti le offerte e segni quale hai scelto.</p></div></div>
<div class="grid mod" style="grid-column:1 / -1" id="invitati"><div style="grid-column:1 / span 6" ${rv()}>${RSVP}</div><div class="words" ${rv(120)}><h3>Chi viene e chi deve ancora rispondere</h3><p>Nuclei familiari, risposte e menù. Un invito, una riggiola: vedi subito quante ne mancano.</p></div></div>
<div class="grid mod" style="grid-column:1 / -1" id="eventi"><div style="grid-column:1 / span 7" ${rv()}>${EVENTS}</div><div class="words" ${rv(120)}><h3>Tutti i matrimoni, un solo sguardo</h3><p>Per le wedding planner: ogni evento con la sua data, i suoi fornitori e gli acconti da incassare.</p></div></div>
<div class="grid mod" style="grid-column:1 / -1" id="scaletta"><div style="grid-column:1 / span 5" ${rv()}>${WEEK}</div><div class="words" ${rv(120)}><h3>La giornata, minuto per minuto</h3><p>Orari, luoghi e responsabili, da mandare a fornitori e collaboratori.</p></div></div>
<p class="note" style="grid-column:1 / -1" ${rv()}>Tutti i dati nei riquadri sono di esempio.</p></div></section>

<section class="section frame why" aria-labelledby="qui"><div class="grid">
<figure class="pic big" ${rv()}><div class="frame-img drift">${img("ravello", LZ)}</div><figcaption>I giardini di Villa Rufolo, a Ravello, sulla Costiera Amalfitana: uno dei luoghi in cui si celebrano i matrimoni di qui.</figcaption></figure>
<div class="col"><p class="secno" aria-hidden="true">N° 03</p><h2 id="qui" ${rv(80)}>Pensato per i matrimoni di qui.</h2>
<p ${rv(140)}><b>Un solo posto.</b> Budget, fornitori, invitati e scadenze non stanno più tra fogli, email e messaggi.</p>
<p ${rv(200)}><b>Lo stesso spazio per sposi e planner.</b> La planner lavora e condivide con gli sposi sugli stessi dati, senza PDF inoltrati.</p>
<p ${rv(260)}><b>Pensato per l'Italia.</b> Riti civili e religiosi, voci di spesa e scadenze come le conosciamo. Il nome viene dalle riggiole del chiostro di Santa Chiara: tanti tasselli, ognuno al suo posto, che insieme fanno un disegno. Partiamo dalla Campania.</p>
</div></div>
<figure class="pic strip" ${rv()}><div class="frame-img drift">${img("paesaggio", LZ)}</div><figcaption>Un pannello di riggiole: nessuna è uguale alle altre, tutte sono nel posto giusto.</figcaption></figure></section>

<section class="section frame how" aria-labelledby="come"><div class="grid"><p class="secno" aria-hidden="true">N° 04</p><h2 id="come" ${rv()}>Come lo stiamo costruendo</h2>
<div class="steps">
<div class="step" data-i="0"><h3>Ascoltiamo.</h3><p>Parliamo con coppie e wedding planner campane, 25 minuti a testa e niente da vendere, per capire cosa fa perdere tempo e denaro.</p></div>
<div class="step" data-i="1"><h3>Proviamo.</h3><p>Un prototipo cliccabile con dati finti, e uno spazio gestito a mano con le prime persone che vorranno provarlo.</p></div>
<div class="step" data-i="2"><h3>Costruiamo.</h3><p>La prima versione nasce da ciò che chi la prova usa davvero ogni settimana. Solo se serve davvero.</p></div>
</div>
<div class="pin"><div class="stage" data-ui>
<div class="state on" data-s="0"><h4>Le domande che facciamo</h4><ul class="qs"><li>Raccontami come avete tenuto traccia di spese, fornitori e invitati finora.</li><li>Ripensa all'ultima volta che hai dovuto ritrovare un preventivo o un pagamento. Cos'è successo?</li><li>C'è stata una scadenza o una spesa che avete scoperto tardi?</li><li>Avete provato app o modelli già pronti? Cosa ha funzionato o no?</li></ul></div>
<div class="state" data-s="1"><h4>La prova a mano</h4><ul class="qs plain"><li><span>Planner con un evento reale</span><b>3</b></li><li><span>Coppie con un loro spazio</span><b>5</b></li><li><span>Uso richiesto</span><b>ogni settimana</b></li><li class="out">Il prototipo usa solo dati finti.</li></ul></div>
<div class="state" data-s="2"><h4>Cosa entra nella prima versione</h4><ul class="qs"><li>Budget e pagamenti</li><li>Fornitori e preventivi</li><li>Checklist con scadenze</li><li>Invitati e RSVP</li><li>Scaletta del giorno</li><li class="out">Per ora no: marketplace di fornitori, app per telefono, chat interna, piantina dei tavoli, pagamenti ai fornitori.</li></ul></div>
</div></div></div></section>

<div class="rig" aria-hidden="true"></div>
<section class="field" id="lista" aria-labelledby="lst"><div class="frame"><div class="grid"><h2 id="lst" ${rv()}>Comincia a mettere tutto in ordine.</h2><p class="lead after" ${rv(100)}>Una lista d'attesa per le coppie, una per le planner. Non chiediamo pagamenti: ti scriviamo solo quando la prima versione è pronta.</p>
<div class="actions" ${rv(180)}><a class="btn on-field" href="coppie.html#lista">Sono una coppia <span class="arrow" aria-hidden="true">→</span></a><a class="btn on-field" href="planner.html#lista">Sono una wedding planner <span class="arrow" aria-hidden="true">→</span></a></div></div></div></section>
</main>` + foot(true));

/* =========================================================== COPPIE */
write("coppie.html", head("Per le coppie | Nozze in Ordine", "Budget, preventivi, invitati e scadenze nello stesso posto, da condividere con il partner e con chi vi aiuta.", "coppie") + top("coppie.html", "#lista") + `
<main>
<section class="hero frame page-hero" aria-labelledby="h1"><div class="grid"><h1 id="h1" class="t-long">Il matrimonio, sotto controllo.</h1>
<div class="intro"><p>Budget, preventivi, invitati e scadenze nello stesso posto, da condividere con il partner e con chi vi aiuta.</p><div class="actions"><a class="btn" href="#lista">Iscrivetevi alla lista <span class="arrow" aria-hidden="true">→</span></a><a class="link" href="#funzioni">Cosa include <span class="arrow" aria-hidden="true">→</span></a></div></div>
<div style="grid-column:1 / -1" ${rv(200)}>${FLOOR}</div></div></section>

<section class="section frame" aria-labelledby="prob"><div class="grid"><h2 class="sec-head" id="prob" ${rv()}>Tre cose da togliervi dalla testa.</h2>
<div class="lines"><div class="ln" ${rv()}><h3>Il budget che sfugge</h3><p>Quanto è previsto, quanto firmato e quanto già pagato, per ogni voce, senza rifare i conti ogni sera.</p></div><div class="ln" ${rv(90)}><h3>Preventivi sparsi</h3><p>PDF, email e messaggi in un solo posto, affiancati per confrontarli.</p></div><div class="ln" ${rv(180)}><h3>Scadenze dimenticate</h3><p>Acconti, saldi e conferme con la loro data, e un promemoria prima che passino.</p></div></div></div></section>

<section class="section frame" id="funzioni" aria-labelledby="funz"><div class="grid"><h2 class="sec-head" id="funz" ${rv()}>Cosa troverete nella prima versione.</h2>
<dl class="defs" ${rv()}>
<div><dt>Budget e pagamenti</dt><dd>Previsto, contrattualizzato, pagato e saldo residuo per ogni voce di spesa.</dd></div>
<div><dt>Fornitori e preventivi</dt><dd>Scheda, contatti, allegati e stato della decisione, con i preventivi affiancati.</dd></div>
<div><dt>Checklist con scadenze</dt><dd>Le attività si calcolano a partire dalla data del matrimonio.</dd></div>
<div><dt>Invitati e RSVP</dt><dd>Nuclei familiari, risposte e menù, con esportazione.</dd></div>
<div><dt>Scaletta del giorno</dt><dd>Orari, luoghi, responsabili e contatti per la giornata, da condividere.</dd></div>
<div><dt>Ruoli e documenti</dt><dd>Sposi, planner e collaboratori con i loro permessi, e un archivio unico dei contratti.</dd></div></dl>
<div class="side-pic" ${rv(120)}><figure class="pic">${xf("viale1", "viale2", ' style="aspect-ratio:4/5"')}<figcaption>Il chiostro di Santa Chiara, a Napoli: pilastri, panche e viale, tutto in fila.</figcaption></figure></div>
<p class="later" style="grid-column:1 / span 8">Per ora non ci sono marketplace di fornitori, app per telefono, chat interna, piantina dei tavoli e pagamenti ai fornitori. Prima vogliamo capire cosa serve a chi organizza un matrimonio.</p></div></section>

<section class="section frame" aria-labelledby="inv"><div class="grid"><h2 class="sec-head" id="inv" ${rv()}>Chi viene e chi deve ancora rispondere.</h2>
<div style="grid-column:1 / span 6" ${rv()}>${RSVP}</div><div class="words" style="grid-column:9 / span 4;display:grid;gap:16px;align-content:start" ${rv(120)}><h3>Un invito, una riggiola</h3><p class="soft">Nuclei familiari, risposte e menù: vedi subito quanti inviti sono confermati, rifiutati o ancora in attesa. Dati di esempio.</p></div></div></section>

<section class="section frame" aria-labelledby="pl"><div class="grid"><h2 class="sec-head" id="pl" ${rv()}>E se vi segue una wedding planner?</h2>
<p class="lead soft" style="grid-column:1 / span 6" ${rv()}>Potrà invitarvi nel suo spazio. Vedrete budget, scadenze e documenti condivisi, senza rifare nulla e senza scambiarvi file.</p>
<div class="actions" style="grid-column:1 / span 6;margin-top:28px" ${rv(100)}><a class="link" href="planner.html">Scopri la parte per le planner <span class="arrow" aria-hidden="true">→</span></a></div>
<figure class="pic beside" ${rv(160)}><div class="frame-img drift" style="aspect-ratio:4/3">${img("tenda", LZ)}</div><figcaption>Riggiole del chiostro: ogni tassello fa la sua parte nel disegno.</figcaption></figure></div></section>

${strip("Un pannello di riggiole del chiostro di Santa Chiara: nessuna è uguale alle altre, tutte sono nel posto giusto.")}

${formSection("Entrate in lista d'attesa.", "Stiamo parlando con coppie e planner prima di costruire, a partire dalla Campania. Dicci quale prezzo ti sembra giusto: ci aiuta a decidere.", FORM_COUPLE, `<h3>Nessun pagamento</h3><p class="small">I prezzi indicati sono ipotesi per capire cosa ha senso. Non verrà addebitato nulla. Usiamo l'email solo per avvisarti quando la prima versione è pronta.</p>`)}
</main>` + foot(true));

/* =========================================================== PLANNER */
write("planner.html", head("Per le wedding planner | Nozze in Ordine", "Tutti i matrimoni che segui, ciascuno con budget, fornitori, scadenze e documenti, e un portale condiviso con gli sposi.", "planner") + top("planner.html", "#lista") + `
<main>
<section class="hero frame page-hero" aria-labelledby="h1"><div class="grid"><h1 id="h1" class="t-long">Tutti i matrimoni, in un posto.</h1>
<div class="intro"><p>Ogni evento con budget, fornitori, scadenze e documenti, e un portale condiviso con gli sposi. Cerchiamo le prime planner in Campania.</p><div class="actions"><a class="btn" href="#lista">Racconta come lavori <span class="arrow" aria-hidden="true">→</span></a><a class="link" href="#risparmio">Cosa cambia <span class="arrow" aria-hidden="true">→</span></a></div></div>
<div style="grid-column:1 / span 8;margin-top:clamp(32px,4vw,64px)" ${rv(200)}>${EVENTS}<p class="note">Dati di esempio.</p></div>
<div style="grid-column:9 / span 4;margin-top:clamp(32px,4vw,64px)" ${rv(280)}>${WEEK}</div></div></section>

<section class="section frame" id="risparmio" aria-labelledby="perdi"><div class="grid"><h2 class="sec-head" id="perdi" ${rv()}>Dove si perde tempo oggi.</h2>
<p class="lead soft" style="grid-column:1 / span 7;margin-top:-48px;margin-bottom:48px" ${rv()}>Sono le cose che ci hanno raccontato di più. Stiamo verificando con le planner campane quanto pesano davvero.</p>
<div class="lines"><div class="ln" ${rv()}><h3>Aggiornamenti a mano</h3><p>Rispondere alle stesse domande e rimandare file su WhatsApp, email e telefono.</p></div><div class="ln" ${rv(90)}><h3>Un foglio per ogni evento</h3><p>Budget, scaletta e fornitori ricreati da zero a ogni matrimonio.</p></div><div class="ln" ${rv(180)}><h3>Acconti e saldi</h3><p>Ricostruire chi ha pagato cosa e quando, evento per evento.</p></div></div></div></section>

<section class="section frame" aria-labelledby="cambia"><div class="grid"><h2 class="sec-head" id="cambia" ${rv()}>Cosa cambia con uno spazio condiviso.</h2>
<dl class="defs" ${rv()}>
<div><dt>Tutti gli eventi in un posto</dt><dd>Ogni matrimonio con il suo budget, i suoi fornitori e le sue scadenze, senza fogli separati.</dd></div>
<div><dt>Template duplicabili</dt><dd>Checklist, budget e scaletta da riusare a ogni nuovo evento.</dd></div>
<div><dt>Portale per gli sposi</dt><dd>Gli sposi vedono ciò che condividi, con budget, scadenze e documenti nello stesso spazio.</dd></div>
<div><dt>Acconti e saldi per evento</dt><dd>Chi ha pagato cosa e cosa scade questa settimana, su tutti gli eventi.</dd></div>
<div><dt>Scaletta condivisa</dt><dd>Orari e responsabili del giorno, da mandare a fornitori e collaboratori.</dd></div>
<div><dt>Collaboratori con ruoli</dt><dd>Ognuno vede e modifica solo ciò che gli compete.</dd></div></dl>
<div class="side-pic" ${rv(120)}><figure class="pic">${xf("viale2", "viale1", ' style="aspect-ratio:4/5"')}<figcaption>Il chiostro di Santa Chiara, a Napoli: tutto in fila, tutto al suo posto.</figcaption></figure></div>
<p class="later" style="grid-column:1 / span 8">Non c'è un CRM per i contratti con i clienti né la firma elettronica: per ora lavoriamo su ciò che succede dopo che l'incarico è firmato.</p></div></section>

<section class="section frame" aria-labelledby="chi"><div class="grid"><h2 class="sec-head" id="chi" ${rv()}>Chi vede e modifica cosa.</h2>
<p class="lead soft" style="grid-column:1 / span 7;margin-top:-48px;margin-bottom:40px" ${rv()}>Un'ipotesi di partenza per i permessi, da correggere con chi organizza davvero.</p>
<div class="compare" style="grid-column:1 / -1" ${rv()}><div class="tscroll"><table class="tbl"><thead><tr><th>Voce</th><th>Wedding planner</th><th>Sposi</th></tr></thead><tbody>
<tr><td class="y">Budget</td><td>Modifica tutto</td><td>Vedono previsto, contratti e pagato</td></tr>
<tr><td class="y">Preventivi</td><td>Li carica e li gestisce</td><td>Li confrontano e approvano</td></tr>
<tr><td class="y">Scadenze</td><td>Le assegna</td><td>Completano le loro</td></tr>
<tr><td class="y">Documenti</td><td>Li carica</td><td>Li leggono e scaricano</td></tr>
<tr><td class="y">Note interne</td><td>Le scrive e le legge</td><td>Non le vedono</td></tr></tbody></table></div></div></div></section>

<section class="section frame" aria-labelledby="part"><div class="grid"><h2 class="sec-head" id="part" ${rv()}>Come partiamo.</h2>
<p class="lead" style="grid-column:1 / span 7" ${rv()}>Cerchiamo le prime wedding planner della Campania per provare un prototipo con un evento reale. Ci serve soprattutto il vostro parere: cosa usereste ogni settimana e cosa no. Alle prime planner proporremo condizioni dedicate, da concordare insieme.</p>
<figure class="pic beside" ${rv(160)}><div class="frame-img drift" style="aspect-ratio:4/3">${img("tenda", LZ)}</div><figcaption>Riggiole del chiostro: una scena di campagna, tassello dopo tassello.</figcaption></figure></div></section>

${strip("Un pannello di riggiole del chiostro di Santa Chiara: nessuna è uguale alle altre, tutte sono nel posto giusto.")}

${formSection("Raccontaci come lavori.", "Rispondi a poche domande e, se ti va, fissiamo una chiamata di 25 minuti. Ci aiuta a decidere cosa costruire e a che prezzo.", FORM_PLANNER, `<h3>Nessun pagamento</h3><p class="small">I prezzi indicati sono ipotesi per capire cosa ha senso. Non verrà addebitato nulla. Usiamo l'email solo per avvisarti quando la prima versione è pronta.</p>`)}
</main>` + foot(true));

/* =========================================================== PREZZI */
const planBtn = (h) => `<a class="btn" href="${h}">Entra in lista <span class="arrow" aria-hidden="true">→</span></a>`;
write("prezzi.html", head("Prezzi | Nozze in Ordine", "Prezzi indicativi per coppie e wedding planner. Gratis per iniziare; i prezzi definitivi dipendono dal tuo feedback.", "prezzi") + top("prezzi.html", "index.html#lista") + `
<main>
<section class="frame page-head" aria-labelledby="h1"><div class="grid"><h1 id="h1">Quanto costerà.</h1>
<p class="lead">Non abbiamo ancora fissato i prezzi. Le cifre qui sotto sono ipotesi che decideremo con chi si iscrive e, per ora, non addebitiamo nulla.</p>
<dl class="defs quick" style="grid-column:1 / span 6" ${rv(100)}><div><dt>Per le coppie</dt><dd>Un pagamento unico per matrimonio, tra 29 e 69 € (ipotesi).</dd></div><div><dt>Per le planner</dt><dd>Un abbonamento mensile, tra 19 e 49 € (ipotesi).</dd></div></dl>
<figure class="pic" ${rv(120)}>${xf("viale1", "viale2", ' style="aspect-ratio:4/5"')}<figcaption>Il chiostro di Santa Chiara, a Napoli.</figcaption></figure></div></section>

<section class="section frame" aria-labelledby="pc"><div class="grid"><h2 class="sec-head" id="pc" ${rv()}>Per le coppie.</h2>
<p class="lead soft" style="grid-column:1 / span 7;margin-top:-48px;margin-bottom:48px" ${rv()}>Un pagamento unico per matrimonio, perché l'organizzazione dura il tempo che serve e poi finisce.</p>
<div class="plans" ${rv()}>
<div class="plan" ${rv()}><h3>Gratis</h3><p class="big">0 €</p><p class="note">per iniziare a mettere ordine</p><ul><li>Checklist con scadenze</li><li>Budget sintetico</li><li>Fino a 50 invitati</li><li>Fino a 3 fornitori</li><li>Collaborazione con il partner</li></ul>${planBtn("coppie.html#lista")}</div>
<div class="plan full" ${rv(90)}><h3>Completo</h3><p class="big">Tra 29 e 69 €</p><p class="note">una tantum per matrimonio, da definire</p><ul><li>Invitati illimitati e RSVP</li><li>Preventivi affiancati e pagamenti</li><li>Documenti e contratti</li><li>Scaletta del giorno</li><li>Esportazione dei dati</li></ul>${planBtn("coppie.html#lista")}</div></div>
<div class="compare" style="grid-column:1 / -1" ${rv()}><div class="tscroll"><table class="tbl"><thead><tr><th>Funzione</th><th>Gratis</th><th>Completo</th></tr></thead><tbody>
<tr><td class="y">Checklist con scadenze</td><td>Incluso</td><td>Incluso</td></tr><tr><td class="y">Budget</td><td class="m">Sintetico</td><td>Con pagamenti e residuo</td></tr><tr><td class="y">Invitati</td><td class="m">Fino a 50</td><td>Illimitati</td></tr><tr><td class="y">RSVP e menù</td><td class="m">No</td><td>Incluso</td></tr><tr><td class="y">Fornitori e preventivi</td><td class="m">Fino a 3</td><td>Illimitati, con confronto</td></tr><tr><td class="y">Scaletta del giorno</td><td class="m">No</td><td>Incluso</td></tr><tr><td class="y">Documenti e contratti</td><td class="m">No</td><td>Incluso</td></tr><tr><td class="y">Esportazione</td><td class="m">No</td><td>Incluso</td></tr></tbody></table></div></div></div></section>

<section class="section frame" aria-labelledby="pp"><div class="grid"><h2 class="sec-head" id="pp" ${rv()}>Per le wedding planner.</h2>
<p class="lead soft" style="grid-column:1 / span 7;margin-top:-48px;margin-bottom:48px" ${rv()}>Un abbonamento mensile, con tutti i matrimoni che segui nello stesso spazio.</p>
<div class="plans" ${rv()}>
<div class="plan" ${rv()}><h3>Solo</h3><p class="big">Tra 19 e 29 € al mese</p><p class="note">ipotesi, da definire</p><ul><li>Eventi illimitati</li><li>Portale per gli sposi</li><li>Template duplicabili</li><li>Scadenze e acconti per evento</li></ul>${planBtn("planner.html#lista")}</div>
<div class="plan full" ${rv(90)}><h3>Studio</h3><p class="big">Tra 39 e 49 € al mese</p><p class="note">ipotesi, da definire</p><ul><li>Tutto il piano Solo</li><li>Più collaboratori con ruoli</li><li>Report economici per evento</li><li>Marchio personalizzato (in arrivo)</li></ul>${planBtn("planner.html#lista")}</div></div>
<div class="compare" style="grid-column:1 / -1" ${rv()}><div class="tscroll"><table class="tbl"><thead><tr><th>Funzione</th><th>Solo</th><th>Studio</th></tr></thead><tbody>
<tr><td class="y">Eventi attivi</td><td>Illimitati</td><td>Illimitati</td></tr><tr><td class="y">Portale per gli sposi</td><td>Incluso</td><td>Incluso</td></tr><tr><td class="y">Template duplicabili</td><td>Incluso</td><td>Incluso</td></tr><tr><td class="y">Collaboratori</td><td class="m">Uno</td><td>Più persone, con ruoli</td></tr><tr><td class="y">Report economici per evento</td><td class="m">No</td><td>Incluso</td></tr><tr><td class="y">Marchio personalizzato</td><td class="m">No</td><td>In arrivo</td></tr></tbody></table></div></div></div></section>

<section class="section frame" aria-labelledby="faq"><div class="grid"><h2 class="sec-head" id="faq" ${rv()}>Domande frequenti.</h2>
<div class="faq" ${rv()}>
<details ${rv()}><summary>Devo pagare adesso?</summary><p>No. Iscriversi alla lista d'attesa è gratis e non chiediamo dati di pagamento.</p></details>
<details ${rv()}><summary>Perché i prezzi hanno un intervallo?</summary><p>Perché li stiamo ancora definendo. Nel modulo ci dici quale cifra ti sembra giusta e usiamo le risposte per decidere.</p></details>
<details ${rv()}><summary>Il piano per le coppie è un abbonamento?</summary><p>Nelle nostre ipotesi no. È un pagamento unico per matrimonio, perché un matrimonio si organizza una volta sola.</p></details>
<details ${rv()}><summary>Se sono una planner, posso seguire più matrimoni?</summary><p>Sì, è lo scopo del piano per planner: più eventi nello stesso spazio, ognuno con i suoi dati.</p></details>
<details ${rv()}><summary>Cosa succede ai miei dati?</summary><p>Per la lista d'attesa raccogliamo email, zona, profilo e prezzo scelto. I dettagli sono nella <a href="privacy.html" style="color:var(--accent)">pagina privacy</a>.</p></details></div>
<figure class="pic beside" style="grid-row:2" ${rv(160)}><div class="frame-img drift" style="aspect-ratio:4/3">${img("tenda", LZ)}</div><figcaption>Riggiole del chiostro: una scena di campagna, tassello dopo tassello.</figcaption></figure></div></section>

${strip("Un pannello di riggiole del chiostro di Santa Chiara: nessuna è uguale alle altre, tutte sono nel posto giusto.")}
<div class="rig" aria-hidden="true"></div></main>` + foot(true));

/* =========================================================== PRIVACY */
write("privacy.html", head("Privacy | Nozze in Ordine", "Come trattiamo i dati della lista d'attesa di Nozze in Ordine.", "privacy") + top("", "index.html#lista") + `
<main>
<section class="frame page-head" aria-labelledby="h1"><div class="grid"><h1 id="h1">Privacy.</h1>
<p class="lead">Cosa raccogliamo quando ti iscrivi alla lista d'attesa, a cosa serve e come puoi chiedere di cancellarlo.</p>
<dl class="defs quick" style="grid-column:1 / span 6" ${rv(100)}><div><dt>Cosa raccogliamo</dt><dd>Email, profilo, zona e prezzo che ti sembra giusto.</dd></div><div><dt>Per quanto tempo</dt><dd>12 mesi, o finché non revochi il consenso.</dd></div></dl>
<figure class="pic" ${rv(120)}>${xf("viale2", "viale1", ' style="aspect-ratio:4/5"')}<figcaption>Il chiostro di Santa Chiara, a Napoli.</figcaption></figure></div></section>
<section class="section frame"><div class="grid"><div class="legal">
<p class="small soft">Ultimo aggiornamento: 14 ottobre 2026</p>
<h2 ${rv()}>Chi tratta i dati</h2>
<p ${rv()}>Il titolare del trattamento è Felice Mondo, persona fisica. Puoi scrivere a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>.</p>
<h2 ${rv()}>Quali dati raccogliamo</h2>
<ul ${rv()}><li>Email</li><li>Se sei una coppia o una wedding planner</li><li>Provincia o regione</li><li>Il prezzo che ti sembra giusto</li><li>Per le planner: numero di matrimoni l'anno, strumenti usati e se vuoi una chiamata</li><li>La data dell'iscrizione</li></ul>
<p ${rv()}>Nella prima fase non raccogliamo dati su intolleranze alimentari o salute degli invitati. Se in futuro lo faremo, lo scriveremo qui e chiederemo un consenso specifico.</p>
<h2 ${rv()}>Perché li raccogliamo</h2>
<p ${rv()}>Per avvisarti quando la prima versione è pronta e per capire quali funzioni e quali prezzi servono. La base è il tuo consenso, che puoi revocare in qualsiasi momento.</p>
<h2 ${rv()}>Per quanto tempo</h2>
<p ${rv()}>Conserviamo i dati per 12 mesi dall'iscrizione, oppure fino a quando revochi il consenso se succede prima. Alla scadenza ti chiediamo se vuoi restare in lista; se non rispondi, li cancelliamo.</p>
<h2 ${rv()}>I tuoi diritti</h2>
<p ${rv()}>Puoi chiedere accesso, correzione o cancellazione dei dati e revocare il consenso scrivendo a <a href="mailto:info@nozzeinordine.com">info@nozzeinordine.com</a>. Puoi anche rivolgerti al Garante per la protezione dei dati personali.</p>
<h2 ${rv()}>Dove sono conservati e chi li gestisce</h2>
<p ${rv()}>Le iscrizioni sono salvate su Supabase, in un data center situato in Europa. Il sito è consegnato tramite Cloudflare, che gestisce anche l'inoltro delle email che arrivano a info@nozzeinordine.com. Alcuni di questi fornitori sono società con sede fuori dall'Unione Europea.</p>
<p ${rv()}>Come ogni sito, i server che consegnano le pagine registrano per breve tempo dati tecnici come l'indirizzo IP. I caratteri tipografici sono ospitati sul nostro stesso sito. In questa fase non usiamo cookie di profilazione né strumenti di analisi.</p>
</div><figure class="pic beside" style="grid-row:1" ${rv(160)}><div class="frame-img drift" style="aspect-ratio:4/3">${img("tenda", LZ)}</div><figcaption>Riggiole del chiostro: una scena di campagna, tassello dopo tassello.</figcaption></figure></div></section>

${strip("Un pannello di riggiole del chiostro di Santa Chiara: nessuna è uguale alle altre, tutte sono nel posto giusto.")}
<div class="rig" aria-hidden="true"></div></main>` + foot(true));

console.log("pagine scritte in", OUT);
