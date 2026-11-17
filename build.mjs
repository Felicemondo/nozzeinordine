// Genera le pagine di site/ a partire dai contenuti qui sotto.  node build.mjs
// Struttura e testi seguono i mockup Figma "Website" (Home, Per le coppie, Per le planner, Prezzi).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "site");
// ---- SEO: ogni pagina esce con indirizzo canonico, dati per i social, dati strutturati e collegamenti senza ".html"
const SITE = "https://nozzeinordine.com";
const LD = {}; // dati strutturati per pagina, riempiti più sotto dove nascono i contenuti
const ORG = { "@type": "Organization", "@id": SITE + "/#org", name: "Nozze in Ordine", url: SITE + "/", logo: SITE + "/apple-touch-icon.png", email: "info@nozzeinordine.com", areaServed: "IT" };
const crumbs = (name, slug) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Nozze in Ordine", item: SITE + "/" }, { "@type": "ListItem", position: 2, name, item: SITE + "/" + slug }] });
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const cleanLinks = (html) => html
  .replace(/href="index\.html(#[^"]*)?"/g, (m, a) => `href="/${a || ""}"`)
  .replace(/href="(coppie|planner|prezzi|privacy|cookie|termini)\.html(#[^"]*)?"/g, (m, s, a) => `href="/${s}${a || ""}"`)
  .replace(/href="app\/demo\.html/g, 'href="/app/demo').replace(/href="app\//g, 'href="/app/');
const write = (name, html) => {
  const slug = name === "index.html" ? "" : name.replace(/\.html$/, ""), url = SITE + "/" + slug;
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1] || "";
  const blocks = (LD[name] || []).concat(slug ? [crumbs(h1.replace(/<[^>]+>/g, "").replace(/\.$/, ""), slug)] : []);
  const seo = `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Nozze in Ordine"><meta property="og:locale" content="it_IT"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Nozze in Ordine: organizzare il matrimonio in un unico spazio"><meta name="twitter:image" content="${SITE}/og.png">${blocks.map(ld).join("")}`;
  writeFileSync(join(OUT, name), cleanLinks(html).replace("</head>", seo + "</head>"));
};

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

const IMG = {
  heroCoppie: ["sposi-valle", 1920, 1280, "Due sposi camminano mano nella mano su un'altura, con una valle di boschi alle spalle."],
  heroPlanner: ["cerimonia-prato", 1920, 1280, "Sedie bianche e un arco di legno pronti per una cerimonia su un prato, davanti agli alberi."],
  heroPrezzi: ["sposi-collina-sera", 1920, 1280, "Due sposi camminano su una collina al tramonto, piccoli contro il cielo."],
  home: ["sposi-campo-sole", 1920, 1280, "Due sposi in piedi in un campo di erba alta al tramonto, con le colline sullo sfondo."],
  scadenze: ["fedi-libro", 1440, 960, "Due fedi d'oro appoggiate su un libro aperto."],
  invitati: ["sposi-viale", 1440, 2160, "Due sposi di spalle su un viale alberato."],
  fiori: ["cortile-fiori", 1440, 1200, "Un cortile di pietra con un tavolo, sedie bianche, vasi di fiori e piante."],
  planner: ["cerimonia-lago", 1600, 1064, "Sedie bianche allineate lungo una navata all'aperto, davanti a un lago e alle montagne."],
  coord: ["navata-cerimonia", 1440, 958, "Una navata di fiori bianchi tra le sedie, in un giardino pronto per la cerimonia."],
  cambia: ["arco-mare", 1050, 1440, "Un arco di pietra che si apre su una scala bianca e sul mare."],
  prezzi: ["mani-fedi", 1440, 2156, "Le mani della sposa e dello sposo, con anello e fede."],
};

const PHOTO_CREDITS = [["cortile-fiori", "George Karelitsky", "https://unsplash.com/@georgekar?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-and-chairs-outside-6V7eOl67DM0?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["navata-cerimonia", "Jonathan Borba", "https://unsplash.com/@jonathanborba?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-floral-arch-and-green-arch-_a4OJrB5Q4A?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["arco-mare", "Karwin Luo", "https://unsplash.com/@karw1n?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/archway-view-to-a-spiral-staircase-and-ocean-zNOgrItIMiE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-campo-sole", "Phakphoom Srinorajan", "https://unsplash.com/@phakphoom?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/man-and-woman-walking-on-brown-grass-field-during-daytime-hN_kGla8yQU?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cerimonia-lago", "Matthew Essman", "https://unsplash.com/@thetruth23?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/white-folding-chair-in-front-of-body-of-water-jTnipV64uLo?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["fedi-libro", "Sandy Millar", "https://unsplash.com/@sandym10?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/two-gold-colored-rings-on-paper-YeJWDWeIZho?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-viale", "Martin Baron", "https://unsplash.com/@elmartinbaron?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-down-a-path-in-the-woods-ukpAsFhGrxY?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["mani-fedi", "CHUTTERSNAP", "https://unsplash.com/@chuttersnap?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/woman-wearing-gold-colored-and-silver-colored-rings-NYqEk7a42yc?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-bosco", "Jaakko Perälä | Norway Elopement Photographer", "https://unsplash.com/@jaakkoperala?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-through-the-woods-AZLuNOtsU8U?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-valle", "adrianna geo", "https://unsplash.com/@adrigeo_?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/man-and-woman-holding-hands-while-walking-on-brown-grass-field-during-daytime-c7M01ytrah8?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cerimonia-prato", "Jose Marroquin", "https://unsplash.com/@josemarroquin?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-white-chairs-and-arch-_ObILA1XpSQ?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-collina-sera", "Foto Pettine", "https://unsplash.com/@fotopettine?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-on-a-hill-IfjHaIoAoqE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"]];

/* =========================================================== SISTEMA (tasteskill 2.5)
   type: service (site-kind other: foto, colore piatto, tipografia; nessun effetto)
   deal: hero split, nav nav-centre, close close-type, footer footer-columns (footer-visit ridato: nessuna sede aperta al pubblico),
         rhythm space, buttons block, mark: il logo del cliente
   palette: i colori del marchio (start.mjs brand): avorio, inchiostro caldo, terracotta per l'azione
   caratteri: DM Serif Display e DM Sans, quelli della guida al marchio (prevale sulla coppia dealt)
   moments: picture-develops (home, sezione planner), pinned-chapters (home, i tre passi)
   voice: pratico e diretto; "voi" alle coppie, "tu" alle planner; nessuna parola di virtù; i nomi del prodotto sempre uguali */

const ARROW = `<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>`;
const MAIN = "Inizia gratis";
const SIGNUP = "/app/#/registrati";
const DEMO = "/app/demo";

// Foto: AVIF a due larghezze, JPEG come riserva dove serve <picture>
const src = (f, w) => `src="/img/${f}-l.avif" srcset="/img/${f}-m.avif 800w, /img/${f}-l.avif ${w}w"`;
const pic = (k, { lazy = true, cls = "frame__img", sizes = "(min-width: 1024px) 50vw, 100vw", pos = "" } = {}) => {
  const [f, w, h, alt] = IMG[k];
  return `<img class="${cls}" ${src(f, w)} sizes="${sizes}" width="${w}" height="${h}" alt="${alt}"${pos ? ` style="--ly-pos: ${pos}; object-position: ${pos}"` : ""}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
};
const heroPic = (k, pos) => { const [f, w, h, alt] = IMG[k]; return `<picture><source type="image/avif" srcset="/img/${f}-m.avif 800w, /img/${f}-l.avif ${w}w" sizes="(min-width: 1024px) 45vw, 100vw"><img src="/img/${f}.jpg" width="${w}" height="${h}" alt="${alt}" style="--ly-pos: ${pos}" fetchpriority="high"></picture>`; };
// Schermate vere della dashboard (demo, con dati di esempio)
const APPSHOT = {
  budget: "La dashboard di Nozze in Ordine: budget e pagamenti, con costo, già pagato e prossimo pagamento per ogni voce.",
  scadenze: "La dashboard di Nozze in Ordine: le attività da fare, ordinate per mese prima del matrimonio.",
  sala: "La dashboard di Nozze in Ordine: invitati e tavoli, con i conteggi delle risposte e la sala in pianta.",
  scaletta: "La dashboard di Nozze in Ordine: il programma del giorno con orari e responsabili.",
  panoramica: "La dashboard di Nozze in Ordine: la panoramica del matrimonio con data, budget, pagamenti e invitati.",
  eventi: "La dashboard di una wedding planner: due matrimoni in corso con giorni mancanti, attività e ritardi.",
  portale: "La dashboard di una wedding planner aperta su un matrimonio: priorità, budget e prossimi pagamenti.",
};
const shot = (k, lazy = true) => `<img class="frame__img app-shot" src="/img/app-${k}-l.avif" srcset="/img/app-${k}-m.avif 800w, /img/app-${k}-l.avif 1600w" sizes="(min-width: 1024px) 50vw, 100vw" width="1600" height="1074" alt="${APPSHOT[k]}"${lazy ? ' loading="lazy" decoding="async"' : ""}>`;

const pageCss = `<style>
@font-face { font-family: "DM Serif Display"; font-weight: 400; font-style: normal; font-display: swap; src: url("/fonts/dm-serif-display-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "DM Sans"; font-weight: 400; font-style: normal; font-display: swap; src: url("/fonts/dm-sans-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "DM Sans"; font-weight: 500; font-style: normal; font-display: swap; src: url("/fonts/dm-sans-latin-500-normal.woff2") format("woff2"); }
@font-face { font-family: "DM Sans"; font-weight: 600; font-style: normal; font-display: swap; src: url("/fonts/dm-sans-latin-600-normal.woff2") format("woff2"); }
:root {
  --p-bg: #f5f0e7; --p-surface: #ebe4d7; --p-ink: #2b2a24; --p-muted: #5a5650;
  --p-accent: #a85339; --p-accent-ink: #f5f0e7; --p-action: #a85339; --p-action-ink: #f5f0e7;
  --p-inv-bg: #2b2a24; --p-inv-surface: #37362f; --p-inv-ink: #f5f0e7; --p-inv-muted: #a8a49c;
  --p-inv-accent: #f5f0e7; --p-inv-accent-ink: #2b2a24; --p-inv-action: #f5f0e7; --p-inv-action-ink: #2b2a24;
  --font-display: "DM Serif Display", Georgia, serif;
  --font-text: "DM Sans", "Helvetica Neue", Arial, sans-serif;
  --display-weight: 400;
  --display-tracking: -0.012em;
  --display-tracking-xl: -0.018em;
}
.nav__logo svg { width: 26px; height: 26px; fill: #702f43; flex: none; }
.nav__logo { color: #702f43; }
.nav__toggle { border: 0 !important; background: none !important; width: 44px; height: 44px; margin-right: -10px; color: var(--p-ink); }
.nav__toggle svg { width: 22px; height: 22px; }
.app-shot { object-position: left top; }
/* telefono: sezioni alte quanto il loro contenuto, con spazi più stretti (scelta di Felice: la schermata intera per sezione lasciava troppo vuoto) */
@media (max-width: 639px) {
  :root { --padt: 56px; --padb: 32px; }
  main > :is(section, .section):not(.hero, .section--hero), footer.closing { min-height: 0 !important; }
  main > :is(section, .section).g2 > .wrap, main > :is(section, .section).g2m > .wrap, footer.closing.g2m > .wrap { grid-template-rows: auto auto; row-gap: var(--s-7); }
  footer.closing > .wrap { row-gap: var(--s-8); }
  main > :is(section, .section):not(.hero) > .wrap { height: auto; min-height: 0; }
  main > :is(section, .section):not(.hero, .section--hero) { padding-bottom: var(--padb) !important; }
  main > :is(section, .section):not(.hero) :is(.fill, .grid.fill, .frame--fill) { flex: 0 0 auto !important; height: auto !important; min-height: 0; }
  .mo-pc__step { min-height: 0 !important; height: auto !important; padding-block: var(--s-2); }
  .mo-pc__grid, .mo-pc__text, .mo-pc__steps { min-height: 0 !important; height: auto !important; }
  .frame, .develop { height: auto !important; min-height: 0 !important; }
  .frame--photo:has(> .frame__img), .develop { aspect-ratio: 4 / 3; }
  .frame--photo:has(> .app-shot) { aspect-ratio: 1600 / 1074; }
}
/* un solo raggio per tutte le foto e le schermate (scelta di Felice): quello delle card */
.hero__media, .frame, .develop, .mo-pc__visuals, .mo-pc__visual, .panel, .menu-card .panel { border-radius: var(--r-lg); overflow: hidden; }
:is(.hero__media, .frame, .develop, .mo-pc__visuals, .mo-pc__visual, .panel) img { border-radius: inherit; }
.rows__name small { display: block; margin-top: var(--s-1); font: 400 var(--t-small)/1.5 var(--font-text); color: var(--muted); }
.rows__value { text-align: right; }
.panel:has(> .app-shot) { --p-h: 340px; }
@media (max-width: 1279px) { .panel:has(> .app-shot) { --p-h: 280px; } }
.develop { aspect-ratio: 1; }
.frame--photo:has(> .frame__img) { aspect-ratio: 1; }
#prezzi .frame--photo, #domande .frame--photo { aspect-ratio: 4 / 3; }
@media (min-width: 640px) and (max-width: 1023px) { #prezzi .frame--photo { aspect-ratio: 3 / 2; } }
@media (max-width: 639px) {
  #prezzi .section-head p, #prezzi .rows > li:nth-child(n+3), #domande .faq__item:nth-child(n+3) { display: none; }
  #prezzi .frame--photo, #domande .frame--photo { aspect-ratio: 3 / 2; }
}
#eventi .frame--photo { aspect-ratio: 1600 / 1074; }
#portale .frame--photo, #planner .frame--photo:has(> .app-shot) { aspect-ratio: 1; }
#spazio .panel:has(> .app-shot) { --p-h: 440px; }
@media (max-width: 639px) { #spazio .panel:has(> .app-shot) { --p-h: 240px; } }
.hero--split h1, .hero--photo h1 { font-size: clamp(36px, 4.2vw, 60px); hyphens: none; -webkit-hyphens: none; }
#piani .frame--photo, #coppie .frame--photo, #domande .frame--photo { aspect-ratio: 4 / 3; }
.card--plan { display: grid; grid-template-rows: auto auto auto 1fr auto; align-content: stretch; gap: var(--s-3); padding: var(--s-5) var(--s-6); }
.card--plan .price { margin-block: var(--s-1); }
.card--plan .price .t-stat { font-family: var(--font-display); }
.card--plan .checks { list-style: none; padding: 0; margin: var(--s-2) 0 var(--s-4); display: grid; gap: var(--s-2); align-content: start; }
.card--plan .checks li { font-size: 15px; line-height: 1.5; }
.cards-foot { margin-top: var(--s-6); }
/* in home le card sono il riassunto: chi e il quarto punto stanno nella pagina prezzi */
.pricing-pic { aspect-ratio: 4 / 3; margin-top: var(--s-4); }
@media (max-width: 1023px) { .pricing-pic { display: none; } }
@media (max-width: 639px) { .section.is-pricing:has(.card--plan:nth-child(3)):not(#prezzi) { --hm: 2; } }
#prezzi .card--plan > p.muted, #prezzi .card--plan .checks li:nth-child(n+4) { display: none; }
@media (max-width: 639px) { #planner .stack-6 { padding-bottom: var(--s-6); } .hero--photo .hero__facts { display: none; } }

@media (max-width: 639px) {
  .card--plan { gap: var(--s-3); padding: var(--s-5); }
  .section.is-pricing .section-head p { display: none; }
  #prezzi .card--plan:nth-child(3) { display: none; }
}
@media (min-width: 640px) and (max-width: 1023px) { .card--plan.span-4 { grid-column: span 6; } .card--plan.span-4:last-child:nth-child(odd) { grid-column: 1 / -1; } }
@media (max-width: 1023px) { #piani .frame--photo, #planner .frame--photo:has(> .app-shot), #portale .frame--photo { aspect-ratio: 3 / 2; } }
@media (max-width: 639px) { .panel:has(> .app-shot) { --p-h: 220px; } }
</style>`;

const head = (title, desc, { moments = [], extra = "" } = {}) => `<!doctype html>
<html lang="it" data-type="service" data-radius="soft" data-buttons="block" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://nozzeinordine.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#f5f0e7">
<meta name="site-kind" content="other">
<meta name="page-type" content="service">
<link rel="preload" href="/fonts/dm-serif-display-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/system.css">
<link rel="stylesheet" href="/assets/ui/cards.css">
<link rel="stylesheet" href="/assets/motion/motion.css">
<link rel="stylesheet" href="/assets/layout/layout.css">
${moments.map((m) => `<link rel="stylesheet" href="/assets/moments/${m}/moment.css">`).join("\n")}
${pageCss}
<script src="/assets/boot.js"></script>
${moments.length ? `<link rel="modulepreload" href="/assets/moments/moments.js"><link rel="modulepreload" href="/assets/moments/lib.js">\n${moments.map((m) => `<link rel="modulepreload" href="/assets/moments/${m}/moment.js">`).join("")}` : ""}
${extra}
</head>
<body>`;

const NAV = [["coppie", "Coppie"], ["planner", "Planner"], ["prezzi", "Prezzi"]];
const top = (cur) => `
<header class="nav nav--centre">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Vai al contenuto</a>
    <a class="nav__logo" href="/">${MARK}Nozze in Ordine</a>
    <nav class="nav__links" aria-label="Principale">
      <div class="nav__item">
        <a class="nav__link" href="/coppie"${cur === "coppie" ? ' aria-current="page"' : ""}>Coppie <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        <div class="nav__menu">
          <div class="wrap grid">
            <div class="menu-col span-3">
              <p class="t-label">Per le coppie</p>
              <a href="/coppie#scadenze">Scadenze<span>Calcolate sulla data del sì</span></a>
              <a href="/coppie#spazio">Budget e invitati<span>Un elenco condiviso in due</span></a>
              <a href="/coppie#piani">Gratis o Completo<span>Cosa cambia tra i due piani</span></a>
            </div>
            <div class="menu-col span-3">
              <p class="t-label">Per le planner</p>
              <a href="/planner#eventi">Più matrimoni<span>Tutti gli eventi in una vista</span></a>
              <a href="/planner#portale">Portale sposi<span>La coppia vede ciò che condividi</span></a>
              <a href="/planner#piani">Planner, Team e Studio<span>Canoni per numero di matrimoni</span></a>
            </div>
            <a class="menu-card span-3 start-10" href="${DEMO}">
              <div class="panel">${shot("panoramica")}</div>
              <span class="t-card">La demo della dashboard</span>
              <span class="t-small muted">Si apre senza account</span>
            </a>
          </div>
        </div>
      </div>
      ${NAV.slice(1).map(([h, l]) => `<div class="nav__item"><a class="nav__link" href="/${h}"${cur === h ? ' aria-current="page"' : ""}>${l}</a></div>`).join("\n      ")}
      <div class="nav__item"><a class="nav__link" href="${DEMO}">Demo</a></div>
    </nav>
    <div class="nav__actions">
      <a class="nav__link" href="/app/">Accedi</a>
      <a class="btn btn--primary" href="${SIGNUP}">${MAIN}</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>`;

const closeType = (h2 = "Organizzate il matrimonio", line = `Il piano gratuito non scade. Il Completo costa ${"49 €"}, una volta sola.`) => `
    <div class="closing__cta close--type">
      <div class="section-head">
        <h2 id="close-h">${h2}</h2>
        <p>${line}</p>
      </div>
      <a class="btn btn--primary btn--xl btn--wide" href="${SIGNUP}">${MAIN}${ARROW}</a>
    </div>`;

const foot = (close = closeType()) => `
<footer class="footer closing" id="contact" aria-labelledby="close-h">
  <div class="wrap">${close}
    <div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4">
          <a class="nav__logo" href="/">${MARK}Nozze in Ordine</a>
          <p class="footer__lede">Un'app per organizzare il matrimonio, per coppie e wedding planner, in tutta Italia.</p>
        </div>
        <div class="span-2 footer__col"><h3>Prodotto</h3><ul><li><a href="/coppie">Per le coppie</a></li><li><a href="/planner">Per le planner</a></li><li><a href="/prezzi">Prezzi</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Dashboard</h3><ul><li><a href="/app/">Accedi</a></li><li><a href="${DEMO}">Demo</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Regole</h3><ul><li><a href="/privacy">Privacy</a></li><li><a href="/cookie">Cookie</a></li><li><a href="/termini">Termini</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Contatti</h3><ul><li><a href="mailto:info@nozzeinordine.com">Scrivici</a></li></ul></div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 Nozze in Ordine</span>
        <div class="socials"></div>
        <a class="credits" href="/privacy#crediti">Fotografie via Unsplash</a>
      </div>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Azioni rapide">
  <a class="btn btn--primary" href="${SIGNUP}">${MAIN}</a>
</nav>
<script type="module" src="/assets/system.js"></script>
<script type="module" src="/assets/motion/motion.js"></script>
<script type="module" src="/assets/layout/layout.js"></script>
</body>
</html>`;

const heroSplit = ({ k, pos, h1, lead, a, b, float }) => `
  <section class="hero hero--split" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="hero__text span-5">
        <h1 id="hero-h">${h1}</h1>
        <p class="hero__lead">${lead}</p>
        <div class="btn-row">${a}${b}</div>
      </div>
      <div class="hero__media span-6 start-7">
        ${heroPic(k, pos)}
        <div class="ly-float">
          <div class="ly-float__row"><span class="ly-live">${float[0]}</span><span>${float[1]}</span></div>
          <div class="ly-float__title">${float[2]}</div>
        </div>
      </div>
    </div></div>
  </section>`;
// Apertura a tutta pagina (scelta di Felice): la foto come livello, le parole in un riquadro sul lato calmo, quattro fatti in fondo
const heroPhoto = ({ k, pos, posPhone = pos, calm = "left", h1, lead, a, b, facts }) => { const [f, w, h, alt] = IMG[k]; return `
  <section class="hero hero--photo" data-enter data-calm="${calm}" aria-labelledby="hero-h">
    <img class="hero__bg" src="/img/${f}-l.avif" width="${w}" height="${h}" alt="${alt}" style="--ly-pos: ${pos}; --ly-pos-phone: ${posPhone}" fetchpriority="high">
    <div class="wrap"><div class="hero-text">
      <div class="hero__text">
        <h1 id="hero-h">${h1}</h1>
        <p class="hero__lead">${lead}</p>
        <div class="btn-row">${a}${b}</div>
      </div>
      <dl class="hero__facts">${facts.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}</dl>
    </div></div>
  </section>`; };
const primary = (label = MAIN, href = SIGNUP) => `<a class="btn btn--primary" href="${href}">${label}${ARROW}</a>`;
const secondary = (label, href) => `<a class="btn btn--secondary" href="${href}">${label}</a>`;
const card = (h, p, panel) => `
          <article class="card card--row card--open span-6">
            <h3>${h}</h3>
            <p>${p}</p>
            <div class="panel">${panel}</div>
          </article>`;
const planCard = ({ name, who, price, per = "", items, btn, href, featured = false, badge = "", span = "span-4" }) => `
          <article class="card card--plan ${span}${featured ? " is-featured" : ""}">
            <h3>${name}${badge ? `<span class="badge">${badge}</span>` : ""}</h3>
            <p class="muted">${who}</p>
            <p class="price"><span class="t-stat">${price}</span>${per ? `<span class="muted">${per}</span>` : ""}</p>
            <ul class="checks">${items.map((i) => `<li>${i}</li>`).join("")}</ul>
            <a class="btn ${featured ? "btn--primary" : "btn--secondary"}" href="${href}">${btn}${featured ? ARROW : ""}</a>
          </article>`;
const PLAN = {
  gratis: { name: "Gratis", who: "Per iniziare a mettere ordine", price: "0 €", per: "senza scadenza", btn: "Apri lo spazio gratuito", href: SIGNUP,
    items: ["Scadenze sulla data", "Budget e pagamenti", "50 invitati, 3 fornitori", "Condiviso con il partner"] },
  completo: { name: "Completo", who: "Per un matrimonio, IVA inclusa", price: "49 €", per: "una volta sola", btn: "Inizia gratis", href: SIGNUP, featured: true,
    items: ["Invitati e fornitori illimitati", "Preventivi affiancati", "Tavoli e sala in pianta", "Programma del giorno"] },
  planner: { name: "Planner", who: "Per chi lavora in proprio", price: "29 €", per: "al mese + IVA", btn: "Prova Planner 30 giorni", href: SIGNUP,
    items: ["5 matrimoni attivi", "Portale per gli sposi", "Acconti e saldi per evento", "Note riservate"] },
  team: { name: "Team", who: "Per chi lavora con collaboratori", price: "59 €", per: "al mese + IVA", btn: "Prova Team 30 giorni", href: SIGNUP, featured: true,
    items: ["15 matrimoni attivi", "3 collaboratori", "Portale per gli sposi", "Assistenza prioritaria"] },
  studio: { name: "Studio", who: "Per gli studi con più persone", price: "Su misura", btn: "Scrivici per lo Studio", href: "mailto:info@nozzeinordine.com?subject=Piano%20Studio",
    items: ["Matrimoni concordati", "Collaboratori concordati", "Avvio assistito"] },
};
const faqList = (items) => `<div class="faq">${items.map(([q, a]) => `<div class="faq__item"><h3>${q}</h3><p>${a}</p></div>`).join("")}</div>`;
const rows = (items) => `<ul class="rows">${items.map(([n, s, v]) => `<li><span class="rows__name">${n}<small>${s}</small></span><span class="rows__value">${v}</span></li>`).join("")}</ul>`;

/* =========================================================== PREZZI (dati) */
const PREZZI = { completo: "49 €", planner: "29 €", team: "59 €", eventiPlanner: 5, eventiTeam: 15, collabTeam: 3, prova: 30 };
const faq = [["Devo inserire una carta di credito per iniziare?", "No. Vi registrate con email e password. Il piano gratuito per le coppie non scade, e la prova per le planner non chiede la carta."],
  ["Il piano Completo è un abbonamento?", `No. Sono ${PREZZI.completo} una volta sola, per tutto il matrimonio: un matrimonio si organizza una volta.`],
  ["Posso usare il piano Completo per più matrimoni?", "No. Il Completo vale per un solo matrimonio e i nomi degli sposi si fissano all'attivazione, senza poterli cambiare. Chi organizza matrimoni per lavoro trova i piani per le wedding planner."],
  ["Cosa conta come matrimonio attivo?", "Un matrimonio la cui data non è ancora passata. Quelli conclusi restano consultabili e non occupano posti nel piano."],
  [`Cosa succede alla fine dei ${PREZZI.prova} giorni di prova?`, "Scegli un piano oppure ti fermi. Non parte nessun addebito senza il tuo consenso."],
  ["I prezzi comprendono l'IVA?", `Per le coppie sì: ${PREZZI.completo} è il prezzo finale. Per le wedding planner i canoni sono IVA esclusa.`],
  ["Come si paga?", "I pagamenti online non sono ancora attivi: in questa fase di lancio l'accesso è gratuito. Prima di attivarli vi scriviamo per email, e nessun piano a pagamento parte senza il vostro consenso."],
  ["Cosa succede ai miei dati?", `Li usiamo per farvi funzionare lo spazio e per rispondervi. Non li vendiamo e non li cediamo. I dettagli sono nella <a href="privacy.html">pagina privacy</a>.`]];
const euro = (s) => s.replace(/[^0-9,]/g, "").replace(",", ".");

/* =========================================================== HOME */
LD["index.html"] = [{ "@context": "https://schema.org", "@graph": [ORG,
  { "@type": "WebSite", "@id": SITE + "/#site", url: SITE + "/", name: "Nozze in Ordine", inLanguage: "it-IT", publisher: { "@id": SITE + "/#org" } },
  { "@type": "SoftwareApplication", name: "Nozze in Ordine", applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "it-IT", url: SITE + "/",
    description: "Dashboard per organizzare il matrimonio: budget, fornitori, invitati, tavoli e scadenze in uno spazio condiviso, per coppie e wedding planner.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Piano gratuito per le coppie" }, publisher: { "@id": SITE + "/#org" } }] }];
write("index.html", head("Nozze in Ordine: l'app per organizzare il matrimonio", "Budget, fornitori, invitati, tavoli e scadenze del matrimonio in uno spazio condiviso, per coppie e wedding planner in tutta Italia. Gratis per iniziare.", { moments: ["pinned-chapters", "picture-develops"] }) + top("") + `
<!-- type: service · deal: hero split, nav nav-centre, close close-type, footer footer-columns, rhythm space, buttons block, mark logo del cliente
     moments: pinned-chapters (#come), picture-develops (#planner) -->
<main id="top">${heroPhoto({ k: "home", pos: "70% 60%",
  h1: "L'app per organizzare il matrimonio",
  lead: "Budget, fornitori, invitati, tavoli e scadenze in un unico spazio condiviso. Gratis per iniziare, Completo a 49 € una volta sola.",
  a: primary(), b: secondary("Guarda la demo", DEMO),
  facts: [["Coppie", "Gratis, senza scadenza"], ["Completo", "49 € una volta sola"], ["Planner", "Da 29 € al mese"], ["Dove", "In tutta Italia"]] })}

  <section class="section g2" id="funzioni" aria-labelledby="funzioni-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head"><h2 id="funzioni-h">Tutto il matrimonio in un posto. <span class="muted">Ogni modifica la vedete in due.</span></h2></div>
        <div class="grid">${card("Tiene il budget voce per voce", "Previsto, pagato e da pagare per ogni fornitore, con la data del prossimo pagamento.", shot("budget"))}${card("Calcola le scadenze del matrimonio", "Inserite il giorno del sì e trovate le attività già ordinate, mese per mese.", shot("scadenze"))}
        </div>
      </div>
      <div class="grid">${card("Mette ai tavoli gli invitati del matrimonio", "Gruppi, risposte e menù, poi la sala in pianta con un nome su ogni posto.", shot("sala"))}${card("Prepara il programma del matrimonio", "Orari e responsabili della giornata, da stampare per fornitori e famiglie.", shot("scaletta"))}
      </div>
    </div>
  </section>

  <section class="section" id="come" style="--h: 2" data-moment="pinned-chapters" aria-labelledby="come-h">
    <div class="wrap mo-pc__grid">
      <div class="mo-pc__text">
        <h2 id="come-h">Come si comincia, in 3 passi</h2>
        <ol class="mo-pc__steps">
          <li class="mo-pc__step">
            <h3>Inserite la data del matrimonio</h3>
            <p>Le scadenze si calcolano da lì: sapete subito cosa viene prima e cosa può aspettare.</p>
            <figure class="mo-pc__visual">${pic("scadenze", { cls: "", sizes: "(min-width: 1024px) 50vw, 100vw" })}</figure>
          </li>
          <li class="mo-pc__step">
            <h3>Aggiungete i fornitori del matrimonio</h3>
            <p>Uno alla volta o da un file CSV. Il piano gratuito tiene 50 invitati e 3 fornitori.</p>
            <figure class="mo-pc__visual">${pic("prezzi", { cls: "", sizes: "(min-width: 1024px) 50vw, 100vw" })}</figure>
          </li>
          <li class="mo-pc__step">
            <h3>Invitate il partner o la planner</h3>
            <p>Ognuno entra con il proprio accesso e lavora sulle stesse informazioni.</p>
            <figure class="mo-pc__visual">${pic("invitati", { cls: "", sizes: "(min-width: 1024px) 50vw, 100vw" })}</figure>
          </li>
        </ol>
      </div>
      <div class="mo-pc__visuals frame"></div>
    </div>
  </section>

  <section class="section is-pricing" id="prezzi" aria-labelledby="prezzi-h">
    <div class="wrap">
      <div class="section-head"><h2 id="prezzi-h">Prezzi per coppie e planner</h2><p>Coppie: un pagamento unico, IVA inclusa. Planner: un canone mensile, con 30 giorni di prova.</p></div>
      <div class="grid grid--top">${planCard(PLAN.gratis)}${planCard(PLAN.completo)}${planCard(PLAN.planner)}
      </div>
    </div>
  </section>

  <section class="section" id="planner" aria-labelledby="planner-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="planner-h">Per le wedding planner. <span class="muted">Tutti i matrimoni in una dashboard.</span></h2>
          <p>Acconti e saldi per evento, un portale per gli sposi e note che restano tue. Da ${PREZZI.planner} al mese, con ${PREZZI.prova} giorni di prova.</p>
        </div>
        <figure class="develop span-6 start-7" data-moment="picture-develops">${pic("planner", { cls: "", sizes: "(min-width: 1024px) 50vw, 100vw" })}</figure>
      </div>
    </div>
  </section>

  <section class="section" id="domande" aria-labelledby="domande-h">
    <div class="wrap">
      <div class="section-head"><h2 id="domande-h">Domande sui piani e sui dati</h2></div>
      <div class="grid grid--top fill"><div class="span-6">${faqList([
        ["Serve la carta di credito per iniziare?", "No. Vi registrate con email e password, e il piano gratuito resta tale finché volete."],
        ["Il Completo è un abbonamento?", `No. Sono ${PREZZI.completo} una volta sola, per un matrimonio.`],
        ["Possiamo lavorare con la nostra planner?", "Sì: la invitate nel vostro spazio, oppure vi invita lei nel suo. Vedete le stesse scadenze e lo stesso budget."],
        ["Dove sono i nostri dati?", "Su server in Europa e nel Regno Unito. Non li vendiamo e non li cediamo."]])}</div>
        <div class="frame frame--photo span-6 start-7">${pic("fiori")}</div></div>
    </div>
  </section>
</main>` + foot());

/* =========================================================== COPPIE */
const PHASES = [["12+ mesi prima", "Data, budget e location"], ["9–11 mesi prima", "Fornitori principali e preventivi"], ["6–8 mesi prima", "Save the date e abiti"], ["3–5 mesi prima", "Dettagli, inviti e menù"], ["1–2 mesi prima", "Conferme finali e saldi"], ["Settimana del sì", "Scaletta e responsabili"]];
write("coppie.html", head("Nozze in Ordine per le coppie: il matrimonio in un unico spazio", `Budget, preventivi, invitati, tavoli e scadenze del matrimonio in un posto condiviso in due. Piano gratuito senza scadenza, Completo a ${PREZZI.completo} una volta sola.`, { extra: `<style>
#scadenze .calc { display: grid; gap: var(--s-4); align-content: start; }
#scadenze .calc, #scadenze .calc input { min-width: 0; width: 100%; }
#scadenze .calc input { min-height: 48px; padding: 0 var(--s-4); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--g-main, #fff); font: 400 16px/1.4 var(--font-text); color: inherit; }
#scadenze .count { display: flex; gap: var(--s-5); align-items: baseline; font: 400 var(--t-stat)/1 var(--font-display); }
#scadenze .count span { font: 400 var(--t-small)/1.4 var(--font-text); color: var(--muted); }
#scadenze .rows small { color: var(--muted); }
</style>` }) + top("coppie") + `
<main id="top">${heroPhoto({ k: "heroCoppie", pos: "62% 55%", posPhone: "72% 55%",
  h1: "Il vostro matrimonio in un'app",
  lead: `Budget, preventivi, invitati, tavoli e scadenze in uno spazio condiviso. Gratis, o Completo a ${PREZZI.completo} una volta sola.`,
  a: primary(), b: secondary("Guarda la demo", DEMO),
  facts: [["Gratis", "Senza scadenza"], ["Completo", `${PREZZI.completo} una volta sola`], ["Invitati", "50 con il Gratis"], ["Dove", "In tutta Italia"]] })}

  <section class="section" id="scadenze" aria-labelledby="scadenze-h">
    <div class="wrap">
      <div class="section-head"><h2 id="scadenze-h">Le scadenze del matrimonio, sulla vostra data</h2><p>Scrivete il giorno del sì: vedete quanto manca e cosa conviene fare adesso.</p></div>
      <div class="grid grid--top fill" data-wedding="2027-06-12">
        <div class="calc span-5">
          <label class="t-label" for="data-si">La data del matrimonio</label>
          <input type="date" id="data-si" value="2027-06-12">
          <p class="count"><b data-weeks>32</b><span>settimane</span><b data-days>5</b><span>giorni</span></p>
          <p class="t-small muted" id="cd-msg" role="status"></p>
        </div>
        <div class="span-6 start-7"><ul class="rows phases">${PHASES.map(([t, d], i) => `<li data-step="${i}"><span class="rows__name">${t}<small>${d}</small></span><span class="rows__value"><small>Da avviare</small></span></li>`).join("")}</ul></div>
      </div>
    </div>
  </section>

  <section class="section" id="spazio" aria-labelledby="spazio-h">
    <div class="wrap">
      <div class="section-head"><h2 id="spazio-h">Budget e invitati in un elenco condiviso</h2></div>
      <div class="grid">${card("Confronta i preventivi", "Due o tre preventivi per fornitore, affiancati, con quanto avete già versato.", shot("budget"))}${card("Raccoglie le risposte", "Famiglia e amici di ciascuno, risposte e menù, e l'elenco si importa da un file.", shot("sala"))}
      </div>
    </div>
  </section>

  <section class="section is-pricing" id="piani" aria-labelledby="piani-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-4 stack-6">
          <h2 id="piani-h">Gratis o Completo</h2>
          <p>Il Completo costa 49 € una volta sola, IVA inclusa, e vale per un matrimonio: i nomi degli sposi si fissano all'attivazione.</p>
          <p><a class="link" href="/prezzi">Confronta i piani</a></p>
          <div class="frame frame--photo pricing-pic">${pic("scadenze", { sizes: "(min-width: 1024px) 30vw, 100vw" })}</div>
        </div>${planCard({ ...PLAN.gratis, span: "span-4 start-5" })}${planCard({ ...PLAN.completo, span: "span-4 start-9" })}
      </div>
    </div>
  </section>

  <section class="section" id="insieme" aria-labelledby="insieme-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="insieme-h">Con la vostra wedding planner</h2>
          <p>Potete invitarla nel vostro spazio, oppure vi invita lei nel suo. Vedete le stesse scadenze e lo stesso budget, senza scambiarvi file.</p>
          <p><a class="link" href="/planner">Vedi la pagina per le planner</a></p>
        </div>
        <div class="frame frame--photo span-6 start-7">${pic("invitati")}</div>
      </div>
    </div>
  </section>
</main>` + foot() + `<script src="/calc.js" defer></script>`);

/* =========================================================== PLANNER */
write("planner.html", head("Nozze in Ordine per le wedding planner: gestionale dei matrimoni", `Il gestionale per wedding planner: tutti i matrimoni in un unico spazio, con acconti, scadenze e portale per gli sposi. Da ${PREZZI.planner} € al mese.`.replace("€ €", "€")) + top("planner") + `
<main id="top">${heroPhoto({ k: "heroPlanner", pos: "60% 55%", posPhone: "70% 55%",
  h1: "Gestionale per wedding planner",
  lead: `Tutti i tuoi matrimoni in una dashboard, con un portale per gli sposi. Da ${PREZZI.planner} al mese, ${PREZZI.prova} giorni di prova.`,
  a: primary(), b: secondary("Guarda la demo", DEMO + "?ruolo=planner"),
  facts: [["Planner", `${PREZZI.planner} al mese + IVA`], ["Team", `${PREZZI.team} al mese + IVA`], ["Prova", `${PREZZI.prova} giorni, senza carta`], ["Matrimoni", `Fino a ${PREZZI.eventiTeam} attivi`]] })}

  <section class="section" id="eventi" aria-labelledby="eventi-h">
    <div class="wrap">
      <div class="section-head"><h2 id="eventi-h">Tutti i matrimoni in una vista</h2><p>Per ogni evento vedi quanti giorni mancano, le attività fatte e quelle in ritardo.</p></div>
      <div class="frame frame--photo fill">${shot("eventi")}</div>
    </div>
  </section>

  <section class="section" id="portale" aria-labelledby="portale-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="portale-h">Un portale per gli sposi</h2>
          <p>Inviti la coppia nel suo matrimonio: vede budget, scadenze e programma senza chiederti un file. Le note riservate restano tue.</p>
        </div>
        <div class="frame frame--photo span-6 start-7">${shot("portale")}</div>
      </div>
    </div>
  </section>

  <section class="section is-pricing" id="piani" aria-labelledby="piani-h">
    <div class="wrap">
      <div class="section-head"><h2 id="piani-h">Canoni per numero di matrimoni</h2><p>IVA esclusa. 30 giorni di prova su Planner e Team, senza carta di credito. Un matrimonio è attivo finché la sua data non è passata.</p></div>
      <div class="grid grid--top">${planCard(PLAN.planner)}${planCard(PLAN.team)}${planCard(PLAN.studio)}
      </div>
    </div>
  </section>

  <section class="section" id="lavoro" aria-labelledby="lavoro-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="lavoro-h">Dall'incarico firmato al giorno del sì</h2>
          <p>Nozze in Ordine non trova clienti e non organizza eventi: ti dà un posto ordinato in cui lavorare. Lo progetta in Campania Felice Mondo, UX/UI designer.</p>
        </div>
        <div class="frame frame--photo span-6 start-7">${pic("coord")}</div>
      </div>
    </div>
  </section>
</main>` + foot(closeType("Prova Nozze in Ordine sui tuoi matrimoni", `${PREZZI.prova} giorni di prova, poi da ${PREZZI.planner} al mese, IVA esclusa.`)));

/* =========================================================== PREZZI */
LD["prezzi.html"] = [{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Nozze in Ordine", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE + "/prezzi",
  offers: [{ "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "EUR", description: "Per le coppie, senza limiti di tempo" },
    { "@type": "Offer", name: "Completo", price: euro(PREZZI.completo), priceCurrency: "EUR", description: "Per le coppie: una volta sola, per un matrimonio, IVA inclusa" },
    { "@type": "Offer", name: "Planner", price: euro(PREZZI.planner), priceCurrency: "EUR", description: `Per wedding planner: canone mensile IVA esclusa, fino a ${PREZZI.eventiPlanner} matrimoni attivi` },
    { "@type": "Offer", name: "Team", price: euro(PREZZI.team), priceCurrency: "EUR", description: `Per wedding planner: canone mensile IVA esclusa, fino a ${PREZZI.eventiTeam} matrimoni attivi e ${PREZZI.collabTeam} collaboratori` }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) }];
write("prezzi.html", head("Prezzi di Nozze in Ordine per coppie e wedding planner", `Coppie: gratis per iniziare, ${PREZZI.completo} una volta sola per il piano Completo. Wedding planner: da ${PREZZI.planner} al mese, con ${PREZZI.prova} giorni di prova.`) + top("prezzi") + `
<main id="top">${heroPhoto({ k: "heroPrezzi", pos: "70% 60%", posPhone: "78% 60%",
  h1: "Prezzi per coppie e planner",
  lead: `Coppie: gratis o ${PREZZI.completo} una volta sola. Planner: da ${PREZZI.planner} al mese, IVA esclusa, con ${PREZZI.prova} giorni di prova.`,
  a: primary(), b: secondary("Guarda la demo", DEMO),
  facts: [["Gratis", "0 €, senza scadenza"], ["Completo", `${PREZZI.completo} una volta`], ["Planner", `Da ${PREZZI.planner} al mese`], ["Studio", "Su richiesta"]] })}

  <section class="section is-pricing" id="coppie" aria-labelledby="coppie-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-4 stack-6">
          <h2 id="coppie-h">Per le coppie. <span class="muted">IVA inclusa.</span></h2>
          <p>Un pagamento unico per matrimonio, perché l'organizzazione dura il tempo che serve e poi finisce. Potete restare sul Gratis quanto volete.</p>
          <p><a class="link" href="/coppie">Vedi la pagina per le coppie</a></p>
          <div class="frame frame--photo pricing-pic">${pic("prezzi", { sizes: "(min-width: 1024px) 30vw, 100vw" })}</div>
        </div>${planCard({ ...PLAN.gratis, span: "span-4 start-5" })}${planCard({ ...PLAN.completo, span: "span-4 start-9" })}
      </div>
    </div>
  </section>

  <section class="section is-pricing" id="planner" aria-labelledby="planner-h">
    <div class="wrap">
      <div class="section-head"><h2 id="planner-h">Per le wedding planner. <span class="muted">IVA esclusa.</span></h2><p>Un canone fisso al mese, scelto in base ai matrimoni che segui. 30 giorni di prova su Planner e Team.</p></div>
      <div class="grid grid--top">${planCard(PLAN.planner)}${planCard(PLAN.team)}${planCard(PLAN.studio)}
      </div>
    </div>
  </section>

  <section class="section" id="domande" style="--hm: 2" aria-labelledby="domande-h">
    <div class="wrap">
      <div class="section-head"><h2 id="domande-h">Domande sui prezzi</h2></div>
      <div class="grid grid--top fill"><div class="span-6">${faqList([faq[0], faq[1], faq[5], faq[6]])}</div>
        <div class="frame frame--photo span-6 start-7">${pic("cambia")}</div></div>
    </div>
  </section>
</main>` + foot());



// Dati del titolare: completare indirizzo e partita IVA prima di attivare i pagamenti.
const TITOLARE = { nome: "Felice Mondo", sede: "Marcianise (CE), Italia", piva: "", email: "info@nozzeinordine.com" };
const AGGIORNATO = "15 novembre 2026";
const MAILTO = `<a href="mailto:${TITOLARE.email}">${TITOLARE.email}</a>`;
/* =========================================================== PAGINE LEGALI */
const legalPage = ({ file, title, desc, eb, h1, lead, body }) => write(file, head(title, desc, { extra: `<style>
.legal { max-width: 68ch; display: grid; gap: var(--s-4); padding-block: calc(var(--nav) + var(--s-8)) var(--s-9); }
.legal h1 { font: 400 var(--t-h2)/1.1 var(--font-display); letter-spacing: var(--display-tracking); margin: 0; }
.legal h2 { font: 400 var(--t-h3)/1.25 var(--font-display); margin: var(--s-6) 0 0; }
.legal :is(p, li) { font-size: 16px; line-height: 1.7; }
.legal ul { padding-left: 20px; display: grid; gap: var(--s-2); }
.legal a { color: var(--action); }
</style>` }) + top("") + `
<main id="top"><div class="wrap"><article class="legal">
<p class="t-label muted">${eb}</p><h1>${h1}</h1>
<p class="t-lead">${lead}</p>
<p class="t-small muted">Ultimo aggiornamento: ${AGGIORNATO}</p>
${body}
</article></div></main>` + foot(closeType()));

legalPage({ file: "privacy.html", title: "Informativa privacy | Nozze in Ordine", desc: "Come Nozze in Ordine tratta i dati personali sul sito e nella dashboard, ai sensi del Regolamento (UE) 2016/679.", eb: "Informativa", h1: "Privacy.",
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
<h2 id="crediti">Immagini</h2>
<p>Le fotografie del sito sono evocative e non rappresentano eventi organizzati da Nozze in Ordine.</p>
<p>Le altre fotografie vengono da <a href="https://unsplash.com/?utm_source=felice_mondo_progetti&amp;utm_medium=referral">Unsplash</a>, con la <a href="https://unsplash.com/license">licenza Unsplash</a>:</p>
<ul class="credits">${PHOTO_CREDITS.map(([f, a, au, p]) => `<li><a href="${p}">${f.replace(/-/g, " ")}</a> di <a href="${au}">${a}</a></li>`).join("")}</ul>` });

legalPage({ file: "cookie.html", title: "Informativa sui cookie | Nozze in Ordine", desc: "Quali cookie e strumenti simili usano il sito e la dashboard di Nozze in Ordine: solo quelli tecnici, necessari al funzionamento.", eb: "Informativa", h1: "Cookie.",
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
