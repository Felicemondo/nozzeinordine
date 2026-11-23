// Genera le pagine di site/ a partire dai contenuti qui sotto.  node build.mjs
// Struttura e testi seguono i mockup Figma "Website" (Home, Per le coppie, Per le planner, Prezzi).
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
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
  .replace(/href="(coppie|tableau|planner|prezzi|chi-siamo|scadenze-matrimonio|privacy|cookie|termini)\.html(#[^"]*)?"/g, (m, s, a) => `href="/${s}${a || ""}"`)
  .replace(/href="app\//g, 'href="/app/');
const write = (name, html) => {
  const slug = name === "index.html" ? "" : name.replace(/\.html$/, ""), url = SITE + "/" + slug;
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1] || "";
  const title = h1.replace(/<[^>]+>/g, "").replace(/\.$/, "");
  const trail = slug.startsWith("guide/") ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Nozze in Ordine", item: SITE + "/" }, { "@type": "ListItem", position: 2, name: "Guide", item: SITE + "/guide" }, { "@type": "ListItem", position: 3, name: title, item: url }] } : crumbs(title, slug);
  const blocks = (LD[name] || []).concat(slug ? [trail] : []);
  const seo = `<link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Nozze in Ordine"><meta property="og:locale" content="it_IT"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Nozze in Ordine: organizzare il matrimonio in un unico spazio"><meta name="twitter:image" content="${SITE}/${(html.match(/property="og:image" content="https:\/\/nozzeinordine\.com\/([^"]+)"/) || [])[1] || "og.png"}">${blocks.map(ld).join("")}`;
  mkdirSync(dirname(join(OUT, name)), { recursive: true });
  writeFileSync(join(OUT, name), cleanLinks(html).replace("</head>", seo + "</head>"));
};

const outer = (sx, sy) => {
  const m = (x, y) => [32 + sx * (x - 32), 32 + sy * (y - 32)];
  const flip = sx * sy > 0 ? 0 : 1, Y = 21.977;
  const [c0, c1, a, b, c2] = [m(0, 0), m(31, 0), m(31, 32 - Y), m(32 - Y, 31), m(0, 31)];
  const f = (p) => p.map((v) => v.toFixed(2)).join(",");
  return `M${f(c0)} L${f(c1)} L${f(a)} A22,22 0 0 ${flip} ${f(b)} L${f(c2)} Z`;
};
// Logo: solo ed esclusivamente brand/logo/nozzeinordine-logo.svg (richiesta di Felice, 2026-11-19)
const LOGO_D = "M75.5811 77.4424L72.2412 79.1143L43.3535 32.2061C42.8808 31.4386 41.7138 31.6393 41.5244 32.5205L37.917 49.3008C37.7225 50.2054 37.8676 51.1787 38.2744 52.0098C52.8835 81.848 25.4352 80.4472 17.2451 134.271C8.93708 188.871 52.1385 193.329 54.3545 195L0 194.442C0.0244547 194.25 7.79015 133.326 18.9512 89.1426C32.6872 34.7656 19.8745 7.05714 11.751 0H42.0479L75.5811 77.4424ZM170.813 0.557617C170.787 0.763793 163.022 61.6794 151.862 105.857C138.126 160.234 150.939 187.943 159.062 195H128.767L95.2324 117.558L98.5732 115.886L127.461 162.794C127.934 163.561 129.101 163.361 129.29 162.479L132.896 145.699C133.091 144.795 132.946 143.821 132.539 142.99C117.93 113.152 145.379 114.553 153.569 60.7285C161.877 6.12862 118.674 1.67143 116.459 0L170.813 0.557617ZM85.6592 83.1396C85.9281 83.1397 86.1905 83.2222 86.4111 83.376C86.6318 83.5299 86.8005 83.7476 86.8936 84L90.0537 92.5781C90.1195 92.7564 90.2231 92.9183 90.3574 93.0527C90.492 93.1873 90.6544 93.2916 90.833 93.3574L99.4102 96.5176C99.6626 96.6106 99.8812 96.7784 100.035 96.999C100.189 97.2198 100.271 97.4829 100.271 97.752C100.271 98.021 100.189 98.2841 100.035 98.5049C99.8812 98.7255 99.6626 98.8933 99.4102 98.9863L90.833 102.146C90.6545 102.212 90.492 102.316 90.3574 102.45C90.2229 102.585 90.1195 102.747 90.0537 102.926L86.8936 111.504C86.8005 111.756 86.6318 111.974 86.4111 112.128C86.1905 112.282 85.9281 112.364 85.6592 112.364C85.3901 112.364 85.127 112.282 84.9062 112.128C84.6857 111.974 84.5179 111.756 84.4248 111.504L81.2646 102.926C81.1989 102.747 81.0945 102.585 80.96 102.45C80.8254 102.316 80.6629 102.212 80.4844 102.146L71.9072 98.9863C71.6549 98.8933 71.4371 98.7254 71.2832 98.5049C71.1293 98.2841 71.0469 98.021 71.0469 97.752C71.0469 97.4829 71.1293 97.2198 71.2832 96.999C71.4371 96.7785 71.6549 96.6106 71.9072 96.5176L80.4844 93.3574C80.663 93.2916 80.8253 93.1873 80.96 93.0527C81.0944 92.9182 81.1989 92.7566 81.2646 92.5781L84.4248 84C84.5178 83.7477 84.6857 83.5298 84.9062 83.376C85.127 83.2221 85.3901 83.1396 85.6592 83.1396Z";
const MARK = `<svg viewBox="0 0 171 195" aria-hidden="true" focusable="false"><path d="${LOGO_D}"/></svg>`;

const IMG = {
  heroChi: ["sposi-prato-bacio", 1620, 1280, "Due sposi si baciano in un prato di erba alta, nella luce del pomeriggio."],
  bosco: ["sposi-bosco", 1000, 1332, "Due sposi camminano di spalle su un sentiero in un bosco."],
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

const PHOTO_CREDITS = [["cortile-fiori", "George Karelitsky", "https://unsplash.com/@georgekar?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-table-and-chairs-outside-6V7eOl67DM0?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["navata-cerimonia", "Jonathan Borba", "https://unsplash.com/@jonathanborba?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-floral-arch-and-green-arch-_a4OJrB5Q4A?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["arco-mare", "Karwin Luo", "https://unsplash.com/@karw1n?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/archway-view-to-a-spiral-staircase-and-ocean-zNOgrItIMiE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-campo-sole", "Phakphoom Srinorajan", "https://unsplash.com/@phakphoom?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/man-and-woman-walking-on-brown-grass-field-during-daytime-hN_kGla8yQU?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cerimonia-lago", "Matthew Essman", "https://unsplash.com/@thetruth23?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/white-folding-chair-in-front-of-body-of-water-jTnipV64uLo?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["fedi-libro", "Sandy Millar", "https://unsplash.com/@sandym10?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/two-gold-colored-rings-on-paper-YeJWDWeIZho?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-viale", "Martin Baron", "https://unsplash.com/@elmartinbaron?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-down-a-path-in-the-woods-ukpAsFhGrxY?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["mani-fedi", "CHUTTERSNAP", "https://unsplash.com/@chuttersnap?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/woman-wearing-gold-colored-and-silver-colored-rings-NYqEk7a42yc?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-bosco", "Jaakko Perälä | Norway Elopement Photographer", "https://unsplash.com/@jaakkoperala?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-through-the-woods-AZLuNOtsU8U?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-valle", "adrianna geo", "https://unsplash.com/@adrigeo_?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/man-and-woman-holding-hands-while-walking-on-brown-grass-field-during-daytime-c7M01ytrah8?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["cerimonia-prato", "Jose Marroquin", "https://unsplash.com/@josemarroquin?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-white-chairs-and-arch-_ObILA1XpSQ?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-collina-sera", "Foto Pettine", "https://unsplash.com/@fotopettine?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-bride-and-groom-walking-on-a-hill-IfjHaIoAoqE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"], ["sposi-prato-bacio", "Dallin Thueson", "https://unsplash.com/@dal_ly?utm_source=felice_mondo_progetti&amp;utm_medium=referral", "https://unsplash.com/photos/a-man-and-a-woman-are-standing-in-a-field-bMzdtwiCCkE?utm_source=felice_mondo_progetti&amp;utm_medium=referral"]];

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

// ---- Strumenti di misura: incollare qui gli ID. Vuoti = nessun banner, nessuno script, testi legali senza questi strumenti.
const TRACKING = { gtm: "GTM-PMMT44NV", ga4: "", clarity: "zf5lgqhpfx", pixel: "2090698578227221" }; // es. ga4: "G-XXXXXXX", clarity: "abcd1234", pixel: "1234567890"
const TRK_ON = !!(TRACKING.gtm || TRACKING.ga4 || TRACKING.clarity || TRACKING.pixel);
writeFileSync(join(OUT, "tracking.js"), "window.NIO_TRACKING = " + JSON.stringify(TRACKING) + ";\n");
{ // la Content Security Policy si allarga solo per gli strumenti attivi
  const extra = { script: [], connect: [], img: [] };
  if (TRACKING.ga4 || TRACKING.gtm) { extra.script.push("https://www.googletagmanager.com"); extra.connect.push("https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com"); extra.img.push("https://*.google-analytics.com", "https://www.googletagmanager.com"); }
  if (TRACKING.clarity) { extra.script.push("https://www.clarity.ms", "https://*.clarity.ms"); extra.connect.push("https://*.clarity.ms"); extra.img.push("https://*.clarity.ms", "https://c.bing.com"); }
  if (TRACKING.pixel) { extra.script.push("https://connect.facebook.net"); extra.connect.push("https://www.facebook.com", "https://connect.facebook.net"); extra.img.push("https://www.facebook.com"); }
  const csp = `  Content-Security-Policy: default-src 'self'; img-src 'self' data:${extra.img.map((x) => " " + x).join("")}; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'${extra.script.map((x) => " " + x).join("")}; connect-src 'self' https://msokhiezfsmkqsvzgmmi.supabase.co${extra.connect.map((x) => " " + x).join("")}; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
  const hp = join(OUT, "_headers"); const hs = readFileSync(hp, "utf8").replace(/^  Content-Security-Policy:.*$/m, csp); writeFileSync(hp, hs);
}
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
.nav__logo svg { width: auto; height: 30px; aspect-ratio: 171 / 195; fill: #702f43; flex: none; }
/* tutte le CTA primarie: pieno bordeaux #702F43 (richiesta di Felice, 2026-11-19) */
.btn--primary { --action: #702f43; --action-ink: #ffffff; }
.nav__logo { color: #702f43; }
.nav__toggle { border: 0 !important; background: none !important; width: 44px; height: 44px; color: var(--p-ink); }
.nav__toggle svg { width: 22px; height: 22px; }
.app-shot { object-position: left top; }
.steps-list { list-style: none; counter-reset: s; padding: 0; margin: var(--s-4) 0 0; display: grid; gap: var(--s-5); }
.steps-list li { counter-increment: s; display: grid; grid-template-columns: 40px 1fr; column-gap: var(--s-4); row-gap: 4px; }
.steps-list li::before { content: counter(s); grid-row: span 2; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--p-surface); color: #702f43; font: 400 20px/1 var(--font-display); }
.steps-list b { font-weight: 500; font-size: 18px; }
.steps-list span { color: var(--p-muted); }
/* sezioni alte quanto il contenuto, con spazi misurati  */
:root { --padt: 96px; --padb: 96px; }
main > :is(section, .section):not(.hero, [data-moment="pinned-chapters"]), footer.closing { height: auto !important; min-height: 0 !important; }
main > :is(section, .section):not(.hero) > .wrap { height: auto; }
main > :is(section, .section):not(.hero) :is(.fill, .grid.fill, .frame--fill) { flex: 0 0 auto; height: auto; }
main > :is(section, .section).g2 > .wrap { grid-template-rows: auto auto; row-gap: var(--s-8); }
footer.closing > .wrap { row-gap: var(--s-9); }
main > section:not(.hero) + section:not(.hero) { padding-top: calc(var(--padt) * .75); }
@media (max-width: 1023px) { :root { --padt: 72px; --padb: 64px; } }
/* telefono: sezioni alte quanto il loro contenuto, con spazi più stretti */
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
/* un solo raggio per tutte le foto e le schermate quello delle card */
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
.upgrade-line { margin-top: var(--s-6); text-align: center; font-weight: 500; }
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

const head = (title, desc, { moments = [], extra = "", robots = "", og = "og.png" } = {}) => `<!doctype html>
<html lang="it" data-type="service" data-radius="soft" data-buttons="block" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">${robots ? `\n<meta name="robots" content="${robots}">` : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://nozzeinordine.com/${og}">
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
<script src="/tracking.js"></script>
<script src="/consent.js" defer></script>
${moments.length ? `<link rel="modulepreload" href="/assets/moments/moments.js"><link rel="modulepreload" href="/assets/moments/lib.js">\n${moments.map((m) => `<link rel="modulepreload" href="/assets/moments/${m}/moment.js">`).join("")}` : ""}
${extra}
</head>
<body>`;

const NAV = [["coppie", "Coppie"], ["planner", "Planner"], ["prezzi", "Prezzi"], ["guide", "Guide"], ["chi-siamo", "Chi siamo"]];
const top = (cur) => `
<header class="nav nav--centre">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Vai al contenuto</a>
    <a class="nav__logo" href="/">${MARK}Nozze in Ordine</a>
    <nav class="nav__links" aria-label="Principale">
      ${NAV.map(([h, l]) => `<div class="nav__item"><a class="nav__link" href="/${h}"${cur === h ? ' aria-current="page"' : ""}>${l}</a></div>`).join("\n      ")}
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

const closeType = (h2 = "Organizzate il matrimonio", line = "Il piano gratuito non scade e non serve la carta di credito.") => `
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
        <div class="span-2 footer__col"><h3>Prodotto</h3><ul><li><a href="/coppie">Per le coppie</a></li><li><a href="/planner">Per le planner</a></li><li><a href="/prezzi">Prezzi</a></li><li><a href="/guide">Guide</a></li><li><a href="/scadenze-matrimonio">Scadenze del matrimonio</a></li><li><a href="/chi-siamo">Chi siamo</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Dashboard</h3><ul><li><a href="/app/">Accedi</a></li><li><a href="${SIGNUP}">Crea un account</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Regole</h3><ul><li><a href="/privacy">Privacy</a></li><li><a href="/cookie">Cookie</a></li>${TRK_ON ? `<li><a href="/cookie" data-cookie-prefs>Preferenze cookie</a></li>` : ""}<li><a href="/termini">Termini</a></li></ul></div>
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
    items: ["Scadenze sulla data", "Budget e pagamenti", "50 invitati, 3 fornitori", "Anteprima del tableau, fino a 3 tavoli", "Condiviso con il partner"] },
  tableau: { name: "Pass Tableau", who: "Per i tavoli, IVA inclusa", price: "19 €", per: "una volta sola", btn: "Prova il tableau gratis", href: SIGNUP,
    items: ["Invitati illimitati", "Tavoli e sala in pianta senza limiti", "Stampa del tableau per gli ospiti", "Scheda per catering e location, con menù e allergie"] },
  completo: { name: "Completo", who: "Per un matrimonio, IVA inclusa", price: "49 €", per: "una volta sola", btn: "Inizia gratis", href: SIGNUP, featured: true,
    items: ["Tutto il Pass Tableau", "Fornitori illimitati", "Preventivi affiancati", "Programma del giorno", "Dal Pass Tableau: 30 €"] },
  planner: { name: "Planner", who: "Per chi lavora in proprio", price: "29 €", per: "al mese + IVA", btn: "Prova Planner 7 giorni", href: SIGNUP,
    items: ["5 matrimoni attivi", "Portale per gli sposi", "Acconti e saldi per evento", "Note riservate"] },
  team: { name: "Team", who: "Per chi lavora con collaboratori", price: "59 €", per: "al mese + IVA", btn: "Prova Team 7 giorni", href: SIGNUP, featured: true,
    items: ["15 matrimoni attivi", "3 collaboratori", "Portale per gli sposi", "Assistenza prioritaria"] },
  studio: { name: "Studio", who: "Per gli studi con più persone", price: "Su misura", btn: "Scrivici per lo Studio", href: "mailto:info@nozzeinordine.com?subject=Piano%20Studio",
    items: ["Matrimoni concordati", "Collaboratori concordati", "Avvio assistito"] },
};
const faqList = (items) => `<div class="faq">${items.map(([q, a]) => `<div class="faq__item"><h3>${q}</h3><p>${a}</p></div>`).join("")}</div>`;
const rows = (items) => `<ul class="rows">${items.map(([n, s, v]) => `<li><span class="rows__name">${n}<small>${s}</small></span><span class="rows__value">${v}</span></li>`).join("")}</ul>`;

/* =========================================================== PREZZI (dati) */
const PREZZI = { tableau: "19 €", upgrade: "30 €", completo: "49 €", planner: "29 €", team: "59 €", eventiPlanner: 5, eventiTeam: 15, collabTeam: 3, prova: 7 };
const faq = [["Devo inserire una carta di credito per iniziare?", "No. Vi registrate con email e password. Il piano gratuito per le coppie non scade, e la prova per le planner non chiede la carta."],
  ["Il piano Completo è un abbonamento?", `No. Sono ${PREZZI.completo} una volta sola, per tutto il matrimonio: un matrimonio si organizza una volta.`],
  ["Il Pass Tableau è un abbonamento?", `No. Sono ${PREZZI.tableau} una volta sola, IVA inclusa, per il tableau di un matrimonio. Per le coppie non ci sono abbonamenti.`],
  ["Posso passare al Completo dopo il Pass Tableau?", `Sì. Dallo stesso account passate al Completo pagando la differenza: ${PREZZI.upgrade}. I tavoli e gli invitati restano dove sono.`],
  ["Posso usare il piano Completo per più matrimoni?", "No. Il Completo vale per un solo matrimonio e i nomi degli sposi si fissano all'attivazione, senza poterli cambiare. Chi organizza matrimoni per lavoro trova i piani per le wedding planner."],
  ["Cosa conta come matrimonio attivo?", "Un matrimonio la cui data non è ancora passata. Quelli conclusi restano consultabili e non occupano posti nel piano."],
  [`Cosa succede alla fine dei ${PREZZI.prova} giorni di prova?`, "Scegli un piano oppure ti fermi. Non parte nessun addebito senza il tuo consenso."],
  ["I prezzi comprendono l'IVA?", `Per le coppie sì: ${PREZZI.tableau} e ${PREZZI.completo} sono prezzi finali. Per le wedding planner i canoni sono IVA esclusa.`],
  ["Come si paga?", "I pagamenti online non sono ancora attivi: in questa fase di lancio l'accesso è gratuito. Prima di attivarli vi scriviamo per email, e nessun piano a pagamento parte senza il vostro consenso."],
  ["Cosa succede ai miei dati?", `Li usiamo per farvi funzionare lo spazio e per rispondervi. Non li vendiamo e non li cediamo. I dettagli sono nella <a href="privacy.html">pagina privacy</a>.`]];
const euro = (s) => s.replace(/[^0-9,]/g, "").replace(",", ".");

/* =========================================================== HOME */
LD["index.html"] = [{ "@context": "https://schema.org", "@graph": [ORG,
  { "@type": "WebSite", "@id": SITE + "/#site", url: SITE + "/", name: "Nozze in Ordine", inLanguage: "it-IT", publisher: { "@id": SITE + "/#org" } },
  { "@type": "SoftwareApplication", name: "Nozze in Ordine", applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "it-IT", url: SITE + "/",
    description: "Dashboard per organizzare il matrimonio: budget, fornitori, invitati, tavoli e scadenze in uno spazio condiviso, per coppie e wedding planner.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Piano gratuito per le coppie" }, publisher: { "@id": SITE + "/#org" } }] }];
write("index.html", head("Nozze in Ordine: l'app per organizzare il matrimonio", "Budget, fornitori, invitati, tavoli e scadenze del matrimonio in uno spazio condiviso, per coppie e wedding planner in tutta Italia. Gratis per iniziare.", { moments: ["picture-develops"] }) + top("") + `
<!-- type: service · deal: hero split, nav nav-centre, close close-type, footer footer-columns, rhythm space, buttons block, mark logo del cliente
     moments: pinned-chapters (#come), picture-develops (#planner) -->
<main id="top">${heroPhoto({ k: "home", pos: "70% 60%",
  h1: "L'app per organizzare il matrimonio",
  lead: "Budget, fornitori, invitati, tavoli e scadenze in un unico spazio, condiviso con il partner o con la wedding planner.",
  a: primary(), b: secondary("Vedi i prezzi", "/prezzi"),
  facts: [["Per chi", "Coppie e wedding planner"], ["Scadenze", "Calcolate sulla data"], ["Dove", "In tutta Italia"], ["Accesso", "Da telefono e computer"]] })}

  <section class="section g2" id="funzioni" aria-labelledby="funzioni-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head"><h2 id="funzioni-h">Tutto il matrimonio in un posto. <span class="muted">Ogni modifica la vedete in due.</span></h2></div>
        <div class="grid">${card("Tiene il budget voce per voce", "Previsto, pagato e da pagare per ogni fornitore, con la data del prossimo pagamento.", shot("budget"))}${card("Calcola le scadenze del matrimonio", "Inserite il giorno del sì e trovate le attività già ordinate, mese per mese.", shot("scadenze"))}
        </div>
      </div>
      <div class="grid">${card("Mette ai tavoli gli invitati del matrimonio", 'Gruppi, risposte e menù, poi la sala in pianta con un nome su ogni posto. <a class="link" href="/tableau">Il tableau</a>', shot("sala"))}${card("Prepara il programma del matrimonio", "Orari e responsabili della giornata, da stampare per fornitori e famiglie.", shot("scaletta"))}
      </div>
    </div>
  </section>

  <section class="section" id="come" aria-labelledby="come-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="come-h">Come si comincia, in 3 passi</h2>
          <ol class="steps-list">
            <li><b>Inserite la data del matrimonio</b><span>Le scadenze si calcolano da lì: sapete subito cosa viene prima e cosa può aspettare.</span></li>
            <li><b>Aggiungete fornitori e invitati</b><span>Uno alla volta o da un file CSV, con il budget voce per voce.</span></li>
            <li><b>Invitate il partner o la planner</b><span>Ognuno entra con il proprio accesso e lavora sulle stesse informazioni.</span></li>
          </ol>
        </div>
        <div class="frame frame--photo span-6 start-7">${pic("invitati")}</div>
      </div>
    </div>
  </section>


  <section class="section" id="planner" aria-labelledby="planner-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="planner-h">Per le wedding planner. <span class="muted">Tutti i matrimoni in una dashboard.</span></h2>
          <p>Acconti e saldi per evento, un portale per gli sposi e note che restano tue.</p>
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
        ["Quanto costa?", `Per le coppie si parte gratis, senza scadenza. Tutti i piani sono nella <a class="link" href="/prezzi">pagina prezzi</a>.`],
        ["Possiamo lavorare con la nostra planner?", "Sì: la invitate nel vostro spazio, oppure vi invita lei nel suo. Vedete le stesse scadenze e lo stesso budget."],
        ["Dove sono i nostri dati?", "Su server in Europa e nel Regno Unito. Non li vendiamo e non li cediamo."]])}</div>
        <div class="frame frame--photo span-6 start-7">${pic("fiori")}</div></div>
    </div>
  </section>
</main>` + foot());

/* =========================================================== COPPIE */
const PHASES = [["12+ mesi prima", "Data, budget e location"], ["9–11 mesi prima", "Fornitori principali e preventivi"], ["6–8 mesi prima", "Save the date e abiti"], ["3–5 mesi prima", "Dettagli, inviti e menù"], ["1–2 mesi prima", "Conferme finali e saldi"], ["Settimana del sì", "Scaletta e responsabili"]];
write("coppie.html", head("Nozze in Ordine per le coppie: il matrimonio in un unico spazio", `Budget, preventivi, invitati, tavoli e scadenze del matrimonio in un posto condiviso in due. Piano gratuito senza scadenza, Pass Tableau a ${PREZZI.tableau}, Completo a ${PREZZI.completo}.`, { extra: `<style>
#scadenze .calc { display: grid; gap: var(--s-4); align-content: start; }
#scadenze .calc, #scadenze .calc input { min-width: 0; width: 100%; }
#scadenze .calc input { min-height: 48px; padding: 0 var(--s-4); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--g-main, #fff); font: 400 16px/1.4 var(--font-text); color: inherit; }
#scadenze .count { display: flex; gap: var(--s-5); align-items: baseline; font: 400 var(--t-stat)/1 var(--font-display); }
#scadenze .count span { font: 400 var(--t-small)/1.4 var(--font-text); color: var(--muted); }
#scadenze .rows small { color: var(--muted); }
</style>` }) + top("coppie") + `
<main id="top">${heroPhoto({ k: "heroCoppie", pos: "62% 55%", posPhone: "72% 55%",
  h1: "Il vostro matrimonio in un'app",
  lead: `Budget, preventivi, invitati, tavoli e scadenze in uno spazio condiviso. Gratis, Pass Tableau a ${PREZZI.tableau} o Completo a ${PREZZI.completo}, una volta sola.`,
  a: primary(), b: secondary("Vedi i prezzi", "/prezzi"),
  facts: [["Gratis", "Senza scadenza"], ["Pass Tableau", `${PREZZI.tableau} una volta sola`], ["Completo", `${PREZZI.completo} una volta sola`], ["Invitati", "50 con il Gratis"]] })}

  <section class="section" id="scadenze" aria-labelledby="scadenze-h">
    <div class="wrap">
      <div class="section-head"><h2 id="scadenze-h">Le scadenze del matrimonio, sulla vostra data</h2><p>Scrivete il giorno del sì: vedete quanto manca e cosa conviene fare adesso.</p></div>
      <div class="grid grid--top fill" data-wedding="2027-06-12">
        <div class="calc span-5">
          <label class="t-label" for="data-si">La data del matrimonio</label>
          <input type="date" id="data-si" value="2027-06-12">
          <p class="count"><b data-weeks>32</b><span>settimane</span><b data-days>5</b><span>giorni</span></p>
          <p class="t-small muted" id="cd-msg" role="status"></p>
          <p><a class="link" href="/scadenze-matrimonio">Tutte le scadenze, attività per attività</a></p>
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

  <section class="section" id="tableau" aria-labelledby="tableau-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="tableau-h">Il tableau, anche con 150 invitati</h2>
          <p>Disegnate la sala con tavoli rotondi, rettangolari, imperiali e il tavolo degli sposi, poi toccate un posto per scegliere chi ci siede. Menù e allergie restano legati a ogni invitato.</p>
          <p>Quando avete finito stampate il tableau per gli ospiti e la scheda per catering e location. Con il piano Gratis lo provate fino a 3 tavoli; con il Pass Tableau, ${PREZZI.tableau} una volta sola, non ci sono limiti.</p>
          <p><a class="link" href="/tableau">Come funziona il tableau</a></p>
        </div>
        <div class="frame span-6 start-7">${shot("sala")}</div>
      </div>
    </div>
  </section>

  <section class="section is-pricing" id="piani" aria-labelledby="piani-h">
    <div class="wrap">
      <div class="section-head"><h2 id="piani-h">Gratis, Pass Tableau o Completo</h2><p>Si paga una volta sola, IVA inclusa, e vale per un matrimonio: i nomi degli sposi si fissano all'attivazione. <a class="link" href="/prezzi">Confronta i piani</a></p></div>
      <div class="grid grid--top">${planCard(PLAN.gratis)}${planCard(PLAN.tableau)}${planCard(PLAN.completo)}
      </div>
      <p class="upgrade-line">Avete già il Pass Tableau? Passate al Completo con ${PREZZI.upgrade}.</p>
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


/* =========================================================== TABLEAU (pagina d'arrivo dei reel: prima il telefono, una sola promessa, niente menu) */
const FAQ_TAB = [
  ["Che forme di tavolo posso usare?", "Rotondi e rettangolari da 6 a 12 posti, imperiali da 40 a 100 posti e il tavolo degli sposi. Ogni tavolo ha il suo nome, che finisce sul tableau stampato."],
  ["Posso segnare allergie e menù?", "Sì, per ogni invitato: menù (standard, vegetariano, vegano, senza carne, senza pesce), i 14 allergeni principali e una nota libera. La scheda per il catering li riporta tavolo per tavolo, con i totali."],
  ["Come si stampa il tableau?", "Dalla pagina dei tavoli scegliete «Stampa ed esporta»: il tableau per gli ospiti (tavolo per tavolo e in ordine alfabetico) oppure la scheda per catering e location con la pianta della sala. Dalla finestra di stampa potete salvarli come PDF."],
  ["Quanti invitati posso inserire?", `Con il piano Gratis fino a 50 invitati e 3 tavoli, per provare. Con il Pass Tableau invitati e tavoli sono illimitati.`],
  ["Il Pass Tableau è un abbonamento?", `No: ${PREZZI.tableau} una volta sola, IVA inclusa, per un matrimonio. Se poi volete anche fornitori, preventivi e programma del giorno, passate al Completo con ${PREZZI.upgrade}.`],
  ["Come si paga?", "I pagamenti online non sono ancora attivi: in questa fase di lancio l'accesso è gratuito. Prima di attivarli vi scriviamo per email, e nessun piano a pagamento parte senza il vostro consenso."]];
LD["tableau.html"] = [{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Nozze in Ordine · Tableau", applicationCategory: "LifestyleApplication", operatingSystem: "Web", url: SITE + "/tableau",
    offers: [{ "@type": "Offer", name: "Pass Tableau", price: euro(PREZZI.tableau), priceCurrency: "EUR", description: "Tavoli, sala in pianta e stampa del tableau, una volta sola, IVA inclusa" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ_TAB.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }];
const topMin = `
<header class="nav nav--centre nav--min">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Vai al contenuto</a>
    <a class="nav__logo" href="/">${MARK}Nozze in Ordine</a>
    <div class="nav__actions"><a class="btn btn--primary" href="${SIGNUP}">Prova gratis</a></div>
  </div>
</header>`;
write("tableau.html", head("Tableau del matrimonio: tavoli, sala e stampa in una sera", `Il tableau del matrimonio pronto stasera, anche con 150 invitati: importate la lista, trascinate i tavoli, stampate. Prova gratis, poi ${PREZZI.tableau} una volta sola.`, { og: "og-tableau.jpg", extra: `<style>
.nav--min .nav__bar { display: flex; justify-content: space-between; align-items: center; }
.tb-hero { padding-top: calc(var(--padt) * .6); }
.tb-hero h1 { font-size: clamp(36px, 5vw, 64px); line-height: 1.05; hyphens: none; }
.tb-hero .lead { font-size: 19px; color: var(--p-muted); max-width: 34ch; }
.tb-price { display: flex; gap: var(--s-3); align-items: baseline; flex-wrap: wrap; }
.tb-price b { font: 400 32px/1 var(--font-display); color: #702f43; }
.tb-price span { color: var(--p-muted); }
.tb-shot { border-radius: var(--r-lg); overflow: hidden; border: 1px solid rgba(0,0,0,.08); }
.tb-shot img { display: block; width: 100%; height: auto; }
.tb-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6); list-style: none; padding: 0; margin: 0; counter-reset: s; }
.tb-steps li { counter-increment: s; display: grid; gap: var(--s-2); }
.tb-steps li::before { content: counter(s); width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--p-surface); color: #702f43; font: 400 22px/1 var(--font-display); }
.tb-steps b { font-size: 20px; font-weight: 500; }
.tb-steps span { color: var(--p-muted); }
.tb-plan { max-width: 520px; }
.tb-hero .grid > *, #come .tb-steps > *, #pass .grid > * { min-width: 0; }
.tb-shot { max-width: 100%; }
@media (max-width: 639px) {
  .tb-hero h1 { font-size: 38px; }
  .tb-steps { grid-template-columns: 1fr; gap: var(--s-5); }
  .tb-steps li { grid-template-columns: 44px 1fr; column-gap: var(--s-4); }
  .tb-steps li::before { grid-row: span 2; }
}
</style>` }) + topMin + `
<main id="top">
  <section class="section tb-hero" aria-labelledby="hero-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h1 id="hero-h">Il tableau pronto stasera, anche con 150 invitati</h1>
          <p class="lead">Importate la lista, trascinate i tavoli, stampate. Menù e allergie di ogni invitato arrivano al catering già divisi per tavolo.</p>
          <div class="btn-row">${primary("Prova gratis")}</div>
          <p class="tb-price"><b>${PREZZI.tableau}</b><span>una volta sola, IVA inclusa. Prova gratis fino a 3 tavoli, senza carta.</span></p>
        </div>
        <div class="tb-shot span-7">${shot("sala", false)}</div>
      </div>
    </div>
  </section>

  <section class="section" id="come" aria-labelledby="come-h">
    <div class="wrap">
      <div class="section-head"><h2 id="come-h">Tre passaggi</h2></div>
      <ol class="tb-steps">
        <li><b>Importate</b><span>La lista da un file Excel salvato in CSV, oppure un invitato alla volta, con gruppo, menù e allergie.</span></li>
        <li><b>Trascinate</b><span>Disegnate la sala con i tavoli della location e toccate un posto per scegliere chi ci siede. Funziona anche dal telefono.</span></li>
        <li><b>Stampate</b><span>Il tableau per gli ospiti e la scheda per catering e location, con pianta, menù, allergie, bambini e seggiolini.</span></li>
      </ol>
    </div>
  </section>

  <section class="section is-pricing" id="pass" aria-labelledby="pass-h">
    <div class="wrap">
      <div class="section-head"><h2 id="pass-h">Un prezzo, una volta sola</h2></div>
      <div class="grid grid--top">${planCard({ ...PLAN.tableau, btn: "Prova gratis", featured: true, span: "span-6 tb-plan" })}
        <div class="span-5 start-8 stack-4"><p>Con il piano Gratis provate il tableau fino a 3 tavoli e 50 invitati, senza scadenza. Quando vi serve tutta la sala, il Pass Tableau sblocca invitati e tavoli illimitati e le stampe.</p>
          <p>Nessun abbonamento. Lo stesso account vale anche per budget e scadenze del matrimonio.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="domande" aria-labelledby="domande-h">
    <div class="wrap">
      <div class="section-head"><h2 id="domande-h">Domande sul tableau</h2></div>
      <div class="grid grid--top"><div class="span-6">${faqList(FAQ_TAB.slice(0, 3))}</div><div class="span-6">${faqList(FAQ_TAB.slice(3))}</div></div>
    </div>
  </section>
</main>
<footer class="footer closing" id="contact" aria-labelledby="close-h">
  <div class="wrap">${closeType("Il vostro tableau, stasera", `Prova gratis fino a 3 tavoli. Poi ${PREZZI.tableau} una volta sola.`).replace(MAIN + ARROW, "Prova gratis" + ARROW)}
    <div class="footer__legal">
      <span>&copy; 2026 Nozze in Ordine</span>
      <span><a href="/privacy">Privacy</a> · <a href="/cookie">Cookie</a>${TRK_ON ? ` · <a href="/cookie" data-cookie-prefs>Preferenze cookie</a>` : ""} · <a href="/termini">Termini</a></span>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Azioni rapide">
  <a class="btn btn--primary" href="${SIGNUP}">Prova gratis</a>
</nav>
<script type="module" src="/assets/system.js"></script>
<script type="module" src="/assets/motion/motion.js"></script>
<script type="module" src="/assets/layout/layout.js"></script>
</body></html>`);

/* =========================================================== SCADENZE (strumento gratuito, senza registrazione) */
// Le stesse attività che la dashboard crea sulla data (supabase seed_tasks): [titolo, fase, mesi prima, giorni prima]
const TASKS = [["Fissare la data e il tipo di rito", 0, 14, 0], ["Definire il budget complessivo", 0, 13, 0], ["Scegliere e prenotare la location", 0, 12, 0], ["Stilare la prima lista degli invitati", 0, 12, 0],
  ["Fotografo e video: confrontare e prenotare", 1, 10, 0], ["Catering: chiedere e confrontare i preventivi", 1, 10, 0], ["Musica e intrattenimento", 1, 9, 0], ["Prenotare il rito in comune o in parrocchia", 1, 9, 0],
  ["Inviare i save the date", 2, 8, 0], ["Scegliere gli abiti", 2, 7, 0], ["Fiori e allestimenti", 2, 6, 0], ["Ordinare partecipazioni e bomboniere", 2, 6, 0],
  ["Inviare le partecipazioni", 3, 5, 0], ["Definire il menù con il catering", 3, 4, 0], ["Documenti per le pubblicazioni", 3, 3, 0],
  ["Raccogliere le risposte degli invitati", 4, 2, 0], ["Saldi dei fornitori principali", 4, 1, 0], ["Confermare orari con tutti i fornitori", 4, 0, 14],
  ["Ultima conferma dei numeri al catering", 5, 0, 7], ["Condividere la scaletta con fornitori e testimoni", 5, 0, 5]];
const PHASE_TEXT = [
  "Prima le decisioni che bloccano tutte le altre: la data, il rito, quanto spendere e dove. La location fissa quante persone potete invitare, per questo la prima lista degli invitati si fa insieme a lei.",
  "Con data e location fissate si scelgono i fornitori che seguono un solo matrimonio al giorno: fotografo, catering, musica. Chiedete più preventivi e confrontateli voce per voce. Il rito, in comune o in parrocchia, si prenota adesso.",
  "I save the date a chi deve organizzarsi per tempo, gli abiti con le loro prove, fiori e allestimenti. Partecipazioni e bomboniere si ordinano ora, per averle pronte quando servono.",
  "Le partecipazioni partono, il menù si definisce con il catering e si preparano i documenti per le pubblicazioni. Le pubblicazioni valgono 180 giorni: anticiparle troppo vuol dire doverle rifare.",
  "Si raccolgono le risposte degli invitati, si saldano i fornitori principali e si confermano gli orari. Le date dei saldi le fissano i contratti: controllatele, il calendario è un'indicazione.",
  "I numeri finali al catering e la scaletta della giornata condivisa con fornitori e testimoni, così il giorno del sì nessuno deve chiedervi niente."];
const ago = (m, d) => m ? (m === 1 ? "1 mese prima" : `${m} mesi prima`) : d % 7 === 0 ? (d === 7 ? "1 settimana prima" : `${d / 7} settimane prima`) : `${d} giorni prima`;
const FAQ_SCAD = [
  ["Quanto tempo prima si organizza un matrimonio?", "Questo calendario parte 14 mesi prima, con la data e il rito. Si può fare in meno tempo: le prime decisioni (data, budget, location) restano le stesse e le altre si avvicinano. Se la vostra data è vicina, il calcolatore segna come «da recuperare» le attività già superate."],
  ["Quando si mandano le partecipazioni?", "Nel calendario le partecipazioni partono 5 mesi prima e i save the date 8 mesi prima, utili soprattutto per chi viene da lontano. Il calendario fa ordinare le partecipazioni un mese prima di spedirle: chiedete alla tipografia quanto tempo le serve. Tempi ed eccezioni nella <a href='/guide/quando-si-danno-le-partecipazioni'>guida alle partecipazioni</a>."],
  ["Quando si prenota la location?", "Dodici mesi prima, subito dopo aver fissato data e budget. È la scelta che decide il numero di invitati e molti dei fornitori, quindi conviene farla per prima."],
  ["Quando servono i documenti per le pubblicazioni?", "Tre mesi prima. Le pubblicazioni di matrimonio valgono 180 giorni: se il matrimonio non si celebra entro quel termine vanno rifatte. Per le date precise chiedete al comune o alla parrocchia."],
  ["Quando si saldano i fornitori?", "Nel calendario i saldi principali cadono un mese prima e la conferma dei numeri al catering una settimana prima. Valgono le date scritte nei contratti: se sono diverse, seguite quelle."],
  ["Le scadenze valgono per tutti i matrimoni?", "Sono un punto di partenza, non una regola. Nello spazio gratuito di Nozze in Ordine le stesse attività si spuntano, si spostano e si aggiungono, e se cambia la data si ricalcolano da sole."]];
const SCAD = "scadenze-matrimonio.html";
LD[SCAD] = [{ "@context": "https://schema.org", "@graph": [
  { "@type": "WebApplication", name: "Calcolatore delle scadenze del matrimonio", url: SITE + "/scadenze-matrimonio", applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "it-IT", isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, publisher: ORG },
  { "@type": "FAQPage", mainEntity: FAQ_SCAD.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) }] }];
write(SCAD, head("Scadenze del matrimonio: cosa fare mese per mese, sulla vostra data", "Inserite la data del matrimonio e vedete il giorno esatto delle 20 scadenze principali: location, fornitori, partecipazioni, documenti e saldi. Gratis, senza registrazione.", { extra: `<style>
#calcolo { padding-top: calc(var(--nav) + var(--s-8)); }
#calcolo h1 { margin: 0; }
.calc { display: grid; gap: var(--s-4); align-content: start; }
.calc, .calc input { min-width: 0; width: 100%; }
.calc input { min-height: 48px; padding: 0 var(--s-4); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--g-main, #fff); font: 400 16px/1.4 var(--font-text); color: inherit; }
.count { display: flex; gap: var(--s-5); align-items: baseline; font: 400 var(--t-stat)/1 var(--font-display); }
.count span { font: 400 var(--t-small)/1.4 var(--font-text); color: var(--muted); }
.rows .rows__value small { display: block; color: var(--muted); font-size: var(--t-small); }
.rows li.now .rows__name { color: var(--accent); }
.rows li.late .rows__value small { color: var(--action); }
.phase { display: grid; gap: var(--s-4); padding-block: var(--s-7) 0; }
.phase:first-child { padding-top: 0; }
.phase h3 { font: 400 var(--t-h3)/1.25 var(--font-display); margin: 0; }
.phase > p { max-width: 64ch; margin: 0; }
</style>` }) + top("guide") + `
<main id="top">
  <section class="section" id="calcolo" aria-labelledby="hero-h">
    <div class="wrap">
      <div class="grid grid--top" data-scad>
        <div class="span-5 stack-6">
          <h1 id="hero-h">Le scadenze del matrimonio, sulla vostra data</h1>
          <p class="t-lead">Scrivete il giorno del sì: vedete quanto manca, in che fase siete e la data esatta di ogni cosa da fare. Gratis, senza registrazione.</p>
          <div class="calc">
            <label class="t-label" for="data-si">La data del matrimonio</label>
            <input type="date" id="data-si">
            <p class="count"><b data-weeks>–</b><span>settimane</span><b data-days>–</b><span>giorni</span></p>
            <p class="t-small muted" id="cd-msg" role="status"></p>
          </div>
        </div>
        <div class="span-6 start-7"><ul class="rows">${PHASES.map(([t, d], i) => `<li data-phase="${i}"><span class="rows__name">${t}<small>${d}</small></span><span class="rows__value"><small>–</small></span></li>`).join("")}</ul></div>
      </div>
    </div>
  </section>

  <section class="section" id="elenco" aria-labelledby="elenco-h">
    <div class="wrap">
      <div class="section-head"><h2 id="elenco-h">Cosa fare, fase per fase</h2><p>Venti attività, dalla data al giorno del sì. Con la data inserita, accanto a ognuna compare il giorno entro cui farla.</p></div>
      <div class="grid grid--top"><div class="span-8">${PHASES.map(([t], i) => `
        <div class="phase"><h3>${t}</h3><p>${PHASE_TEXT[i]}</p>
          <ul class="rows">${TASKS.filter((x) => x[1] === i).map(([n, , m, d]) => `<li data-m="${m}" data-d="${d}"><span class="rows__name">${n}</span><span class="rows__value"><b data-when>${ago(m, d)}</b><small data-state></small></span></li>`).join("")}</ul>
        </div>`).join("")}
      </div></div>
    </div>
  </section>

  <section class="section" id="domande" aria-labelledby="domande-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-4 stack-6">
          <h2 id="domande-h">Domande sulle scadenze</h2>
          <p><a class="link" href="/coppie">Come funziona lo spazio per le coppie</a></p>
          <div class="frame frame--photo">${pic("scadenze", { sizes: "(min-width: 1024px) 30vw, 100vw" })}</div>
        </div>
        <div class="span-7 start-6">${faqList(FAQ_SCAD)}</div>
      </div>
    </div>
  </section>
</main>` + foot(closeType("Le vostre scadenze, nel vostro spazio", "Con l'account gratuito le stesse attività si spuntano e si spostano, e si ricalcolano se cambia la data.")) + `<script src="/scadenze.js" defer></script>`);

/* =========================================================== GUIDE */
// Ogni guida risponde a una ricerca reale e porta a una funzione dell'app. Felice le rivede prima che vadano su Google:
// finché GUIDE_LIVE è false le pagine sono online ma noindex, fuori dalla sitemap e senza link dal resto del sito.
const GUIDE_LIVE = true;
const GUIDE_ROBOTS = GUIDE_LIVE ? "" : "noindex, follow";
const guideCss = `<style>
.article { max-width: 68ch; display: grid; gap: var(--s-4); padding-block: calc(var(--nav) + var(--s-8)) var(--s-9); }
.article h1 { font: 400 var(--t-h2)/1.1 var(--font-display); letter-spacing: var(--display-tracking); margin: 0; }
.article h2 { font: 400 var(--t-h3)/1.25 var(--font-display); margin: var(--s-7) 0 0; }
.article :is(p, li, td, th) { font-size: 16px; line-height: 1.7; }
.article :is(ul, ol):not(.rows) { padding-left: 20px; display: grid; gap: var(--s-2); }
.article ul:not(.rows) { list-style: disc; }
.article ol { list-style: decimal; }
.article ul.rows { padding-left: 0; }
.article a:not(.btn) { color: var(--action); }
.article .crumb { display: flex; gap: var(--s-2); font-size: var(--t-small); color: var(--muted); }
.article .crumb a { color: inherit; }
.answer { padding: var(--s-5) var(--s-6); border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--surface, #fff); display: grid; gap: var(--s-2); }
.answer p { margin: 0; }
.table-wrap { overflow-x: auto; }
.article table { width: 100%; border-collapse: collapse; }
.article :is(th, td) { text-align: left; vertical-align: top; padding: var(--s-3) var(--s-4) var(--s-3) 0; border-bottom: 1px solid var(--line); }
.article th { font-weight: 500; }
.article table:has(th:nth-child(3)) td:nth-child(2) { white-space: nowrap; }
.article td:first-child { min-width: 11ch; }
.tool { display: grid; gap: var(--s-3); padding: var(--s-6); border-radius: var(--r-lg); background: var(--surface, #fff); border: 1px solid var(--line); margin-top: var(--s-6); }
.tool h2 { margin: 0; }
.tool p { margin: 0; }
.tool-shot { margin-top: var(--s-3); aspect-ratio: 1600 / 1074; }
.tool-shot img { width: 100%; height: 100%; object-fit: cover; object-position: left top; }
.related { display: grid; gap: var(--s-2); margin-top: var(--s-6); }
@media (max-width: 639px) { .answer, .tool { padding: var(--s-5); } .article table:has(th:nth-child(3)) td:nth-child(2) { white-space: normal; } }
</style>`;
const GUIDES = [];
const guide = ({ slug, cat, img, draft = false, title, desc, h1, answer, updated, updatedIso, published, body, faq, tool }) => {
  const name = `guide/${slug}.html`;
  if (!draft) GUIDES.push({ slug, cat, img, h1, desc }); // le bozze sono online solo all'indirizzo diretto, noindex, fuori da indice, sitemap e llms.txt
  LD[name] = [{ "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: h1, description: desc, inLanguage: "it-IT", datePublished: published, dateModified: updatedIso, mainEntityOfPage: SITE + "/guide/" + slug, author: ORG, publisher: ORG, image: SITE + "/og.png" },
    { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) }] }];
  write(name, head(title, desc, { extra: guideCss, robots: draft ? "noindex, follow" : GUIDE_ROBOTS }) + top("guide") + `
<main id="top"><div class="wrap"><article class="article">
<nav class="crumb" aria-label="Percorso"><a href="/guide">Guide</a><span aria-hidden="true">›</span><span>${h1.replace(/\?$/, "")}</span></nav>
<h1>${h1}</h1>
<p class="t-small muted">Aggiornata il ${updated}</p>
<div class="answer"><p class="t-label">In breve</p>${answer}</div>
${body}
<div class="tool"><h2>${tool.h}</h2><p>${tool.p}</p><p><a class="btn btn--primary" href="${tool.href}"${tool.download ? " download" : ""}>${tool.btn}${ARROW}</a></p>${tool.after || ""}</div>
<h2>Domande frequenti</h2>
${faqList(faq)}
</article></div></main>` + foot(closeType("Organizzate il matrimonio in un unico spazio", "Scadenze, invitati e risposte nello stesso posto. Il piano gratuito non scade e non serve la carta di credito.")));
};

guide({ slug: "quando-si-danno-le-partecipazioni", cat: "Tempi e scadenze", img: "fiori", published: "2026-11-17", updatedIso: "2026-11-17", updated: "17 novembre 2026",
  title: "Quando si danno le partecipazioni di matrimonio (e i save the date)",
  desc: "Partecipazioni 3–4 mesi prima, save the date 6–8 mesi prima, risposte entro 1–2 mesi dal matrimonio. Tempi, motivi ed eccezioni, con il calcolatore sulla vostra data.",
  h1: "Quando si danno le partecipazioni di matrimonio?",
  answer: `<p>Le partecipazioni si spediscono di solito <strong>3–4 mesi prima</strong> del matrimonio, anche prima per chi deve viaggiare. I save the date partono prima, <strong>6–8 mesi prima</strong>, e fino a un anno se molti invitati vengono da lontano. Sulla partecipazione chiedete una risposta entro <strong>1–2 mesi prima</strong>, in tempo per il catering e i tavoli.</p>`,
  body: `
<h2>Il calendario, in una tabella</h2>
<div class="table-wrap"><table>
<thead><tr><th>Cosa</th><th>Quando</th><th>Perché</th></tr></thead>
<tbody>
<tr><td>Save the date</td><td>6–8 mesi prima</td><td>Fissa la data nel calendario degli invitati prima che prendano altri impegni.</td></tr>
<tr><td>Save the date a chi viene da lontano</td><td>9–12 mesi prima</td><td>Serve tempo per ferie, viaggi e alloggi.</td></tr>
<tr><td>Ordinare le partecipazioni</td><td>Prima della spedizione</td><td>Stampa, buste e indirizzi richiedono settimane: chiedete i tempi alla tipografia.</td></tr>
<tr><td>Spedire o consegnare le partecipazioni</td><td>3–4 mesi prima</td><td>Abbastanza presto per organizzarsi, non così presto da essere dimenticate.</td></tr>
<tr><td>Data limite per le risposte</td><td>1–2 mesi prima</td><td>Il catering vuole i numeri e i tavoli si fanno sulle risposte.</td></tr>
</tbody></table></div>
<p>Sono le indicazioni più diffuse in Italia, non regole fisse. Nel <a href="/scadenze-matrimonio">calendario delle scadenze</a> di Nozze in Ordine i save the date cadono 8 mesi prima e le partecipazioni 5 mesi prima: si sta sul lato prudente, così resta margine per i ritardi.</p>

<h2>Save the date: a cosa servono e quando mandarli</h2>
<p>Il save the date è un avviso: comunica la data quando la partecipazione non è ancora pronta. Non è obbligatorio, ma è utile quando il matrimonio cade in alta stagione, in un giorno festivo, oppure quando una parte degli invitati deve prendere un aereo o chiedere le ferie.</p>
<p>Mandatelo solo a chi inviterete di sicuro: chi riceve un save the date si aspetta poi la partecipazione. Prima di spedirli conviene quindi avere almeno la data, la location e una lista degli invitati abbastanza stabile.</p>

<h2>Partecipazioni: quando spedirle</h2>
<p>La finestra più citata è 3–4 mesi prima. Per chi vive vicino si può stare verso i 3 mesi; per chi viaggia, o se avete mandato il save the date solo ad alcuni, conviene anticipare.</p>
<p>Se le consegnate a mano, mettete in conto il tempo delle visite: con molti invitati la consegna può durare settimane. In quel caso iniziate qualche settimana prima della data che avete scelto.</p>

<h2>La data per le risposte</h2>
<p>Scrivete sulla partecipazione entro quando volete una risposta e come darla (telefono, messaggio, email). È la data che usate per tutto il resto: il numero finale per il catering, la disposizione dei tavoli, le bomboniere.</p>
<p>Lasciate un margine prima delle scadenze dei fornitori: qualcuno risponderà in ritardo e andrà sollecitato. Nella dashboard di Nozze in Ordine le risposte si segnano invitato per invitato, e vedete subito chi manca.</p>

<h2>Se il matrimonio è vicino</h2>
<p>Con pochi mesi a disposizione si salta il save the date e si manda subito la partecipazione, anche in digitale, con una data di risposta chiara. Una telefonata a chi deve viaggiare vale più di qualsiasi biglietto.</p>

<h2>Cosa scrivere sulla partecipazione</h2>
<ul>
<li>i nomi degli sposi, e secondo l'uso anche dei genitori;</li>
<li>giorno, ora e luogo del rito;</li>
<li>il luogo del ricevimento, se è diverso;</li>
<li>entro quando rispondere e a chi;</li>
<li>la lista nozze o le indicazioni per il regalo, se volete darle.</li>
</ul>`,
  tool: { h: "Le date esatte sul vostro matrimonio", p: "Inserite il giorno del sì: il calcolatore vi dice quando mandare save the date e partecipazioni, e le altre 18 scadenze principali.", btn: "Calcola le scadenze", href: "/scadenze-matrimonio" },
  faq: [
    ["Il save the date è obbligatorio?", "No. È utile se il matrimonio cade in alta stagione o se molti invitati devono viaggiare; altrimenti basta la partecipazione, spedita in tempo."],
    ["Si possono mandare le partecipazioni su WhatsApp?", "Sì: conta che arrivino in tempo e che sia chiaro entro quando rispondere. Per i parenti che non usano il telefono, o per chi ci tiene, meglio anche la carta."],
    ["Chi riceve il save the date va invitato?", "Sì. Il save the date è una promessa di invito: mandatelo solo a chi riceverà di sicuro la partecipazione."],
    ["Quanto prima chiedere la risposta?", "Uno o due mesi prima del matrimonio. Controllate entro quando il catering vuole il numero definitivo e lasciatevi qualche settimana per sollecitare chi non ha risposto."]] });

guide({ slug: "documenti-matrimonio", cat: "Documenti", img: "coord", published: "2026-11-19", updatedIso: "2026-11-19", updated: "19 novembre 2026",
  title: "Documenti per il matrimonio civile e in chiesa: cosa serve e quando",
  desc: "Pubblicazioni in comune, documenti per la parrocchia, testimoni e casi particolari. Cosa preparare per il matrimonio civile e per quello in chiesa, e con quanto anticipo.",
  h1: "Quali documenti servono per sposarsi?",
  answer: `<p><strong>Matrimonio civile:</strong> si chiedono le pubblicazioni all'ufficio di stato civile del comune di residenza di uno dei due, con un documento di identità. Le pubblicazioni restano affisse 8 giorni; ci si può sposare dal 4° giorno successivo ed <strong>entro 180 giorni</strong>, altrimenti vanno rifatte.</p>
<p><strong>Matrimonio in chiesa con effetti civili:</strong> in parrocchia servono il certificato di battesimo (e di cresima, se non è annotata), l'attestato del corso prematrimoniale e i documenti civili. Dopo il colloquio, il parroco vi consegna la richiesta di pubblicazioni da portare in comune.</p>`,
  body: `
<p>Le regole di fondo valgono in tutta Italia, ma moduli, appuntamenti e tempi di attesa cambiano da comune a comune e da diocesi a diocesi. Usate questa guida per sapere cosa chiedere, e fatevi confermare i dettagli dall'ufficio di stato civile e dalla parrocchia.</p>

<h2>I passaggi, in una tabella</h2>
<div class="table-wrap"><table>
<thead><tr><th>Cosa</th><th>Quando</th><th>Dove</th></tr></thead>
<tbody>
<tr><td>Fissare la data della cerimonia</td><td>9–12 mesi prima</td><td>Comune (sala o luogo del rito) o parrocchia</td></tr>
<tr><td>Iscriversi al corso prematrimoniale</td><td>Appena fissata la data</td><td>Parrocchia o diocesi: i corsi hanno un calendario fisso</td></tr>
<tr><td>Raccogliere i documenti e fare il colloquio con il parroco</td><td>Circa 3 mesi prima</td><td>Parrocchia</td></tr>
<tr><td>Chiedere le pubblicazioni</td><td>Entro 180 giorni dal matrimonio</td><td>Comune di residenza</td></tr>
<tr><td>Affissione delle pubblicazioni</td><td>8 giorni</td><td>Albo del comune (di entrambi, se avete residenze diverse)</td></tr>
<tr><td>Celebrazione</td><td>Dal 4° giorno dopo la fine delle pubblicazioni</td><td>Comune o chiesa</td></tr>
</tbody></table></div>
<p>Nel <a href="/scadenze-matrimonio">calendario delle scadenze</a> di Nozze in Ordine la prenotazione del rito cade 9 mesi prima e i documenti per le pubblicazioni 3 mesi prima: abbastanza presto per non rincorrere gli uffici, abbastanza tardi da restare nei 180 giorni.</p>

<h2>Matrimonio civile</h2>
<p>Si comincia dall'ufficio di stato civile del comune dove risiede almeno uno dei due. Di solito si prende un appuntamento e ci si presenta insieme con un documento di identità valido. Gran parte dei dati (nascita, residenza, cittadinanza, stato libero) il comune li controlla da sé; chiedete comunque all'ufficio cosa portare, perché alcuni chiedono moduli o marche da bollo.</p>
<p>Dopo la richiesta, il comune affigge le pubblicazioni all'albo online per 8 giorni. Se abitate in comuni diversi, le pubblicazioni si fanno in entrambi. Da quel momento avete 180 giorni per sposarvi: se il termine passa, le pubblicazioni si considerano non avvenute e vanno rifatte (articolo 99 del Codice civile).</p>
<p>Ci si può sposare anche in un comune diverso da quello di residenza: le pubblicazioni si fanno comunque dove abitate, poi il vostro comune chiede a quello scelto di celebrare il matrimonio. Prenotate per tempo la sala o il luogo, perché le date più richieste finiscono presto.</p>

<h2>Matrimonio in chiesa (concordatario)</h2>
<p>È il matrimonio religioso che vale anche per lo Stato. Il primo passo è parlare con il parroco della parrocchia di uno dei due, anche se vi sposate altrove: è lui che segue la pratica.</p>
<ul>
<li><strong>Certificato di battesimo</strong> per uso matrimonio, da chiedere alla parrocchia dove siete stati battezzati. Molte diocesi lo vogliono recente: chiedete la validità.</li>
<li><strong>Certificato di cresima</strong>, solo se la cresima non risulta già annotata su quello di battesimo.</li>
<li><strong>Attestato del corso prematrimoniale</strong>, rilasciato alla fine del corso.</li>
<li><strong>Documenti civili</strong> richiesti dalla parrocchia, spesso un certificato contestuale di nascita, residenza, cittadinanza e stato libero.</li>
</ul>
<p>Con i documenti in regola si fa il colloquio con il parroco. Il parroco vi consegna la richiesta di pubblicazioni da portare in comune e, nello stesso periodo, fa le pubblicazioni canoniche in parrocchia. Finite quelle civili, il comune rilascia il certificato di avvenute pubblicazioni, che riportate al parroco.</p>
<p>Se vi sposate in una chiesa diversa dalla vostra parrocchia, il parroco trasmette la pratica a quella della celebrazione: avvisatelo subito di dove vi sposate.</p>

<h2>Testimoni</h2>
<p>Servono due testimoni, sia per il matrimonio civile sia per quello in chiesa, maggiorenni e con un documento di identità valido. Comunicate i loro dati al comune o alla parrocchia nei tempi che vi indicano.</p>

<h2>Casi particolari</h2>
<ul>
<li><strong>Uno dei due è straniero:</strong> di solito serve un nulla osta al matrimonio rilasciato dalle autorità del suo Paese, a volte tradotto e legalizzato. I tempi possono essere lunghi: muovetevi per primi su questo.</li>
<li><strong>Matrimonio precedente:</strong> chi è divorziato o vedovo deve indicarlo; per il rito religioso la situazione va discussa con il parroco prima di fissare la data.</li>
<li><strong>Residenza all'estero:</strong> le pubblicazioni passano dal consolato o dall'ultimo comune di residenza in Italia. Chiedete al consolato.</li>
</ul>`,
  tool: { h: "Le scadenze dei documenti sulla vostra data", p: "Inserite il giorno del sì: il calcolatore vi dice quando prenotare il rito, quando preparare i documenti e tutte le altre scadenze principali.", btn: "Calcola le scadenze", href: "/scadenze-matrimonio" },
  faq: [
    ["Quanto durano le pubblicazioni di matrimonio?", "Restano affisse all'albo del comune per 8 giorni. Dal quarto giorno dopo la fine ci si può sposare, ed entro 180 giorni: dopo vanno rifatte."],
    ["Quanto tempo prima si fanno le pubblicazioni?", "Non più di 180 giorni prima del matrimonio. Molti comuni chiedono un appuntamento qualche settimana prima: chiedete i tempi all'ufficio di stato civile e partite con i documenti circa 3 mesi prima."],
    ["Si possono fare le pubblicazioni in un comune diverso da quello di residenza?", "No: si fanno nel comune di residenza di uno dei due, o di entrambi. Ci si può però sposare in un altro comune, che riceve la richiesta di celebrazione dal vostro."],
    ["Quanti testimoni servono per sposarsi?", "Due, maggiorenni e con un documento di identità, sia per il matrimonio civile sia per quello in chiesa."],
    ["Il certificato di battesimo scade?", "Per il matrimonio molte diocesi chiedono un certificato recente, rilasciato da pochi mesi. Chiedete al vostro parroco la validità richiesta prima di farlo emettere."]] });

guide({ slug: "budget-matrimonio", cat: "Budget", img: "prezzi", published: "2026-11-19", updatedIso: "2026-11-19", updated: "19 novembre 2026",
  title: "Budget del matrimonio: come farlo, voce per voce",
  desc: "Come impostare il budget del matrimonio: il totale, gli invitati, le 12 voci di spesa, acconti e saldi con le date, e un margine per gli imprevisti.",
  h1: "Come fare il budget del matrimonio",
  answer: `<p>Partite da <strong>quanto potete spendere in tutto</strong>, non da una media. Poi fissate il <strong>numero degli invitati</strong>, che muove tutte le voci pagate a persona, e dividete il totale tra le voci di spesa. Per ogni voce segnate la cifra prevista, il preventivo scelto, gli acconti e le date dei saldi: così vedete sempre quanto avete pagato e quanto manca.</p>`,
  body: `
<h2>1. Il totale, prima di tutto</h2>
<p>Il budget parte da una cifra sola: quanto potete spendere senza indebitarvi o rinunciare ad altro. Decidetela insieme, e se le famiglie contribuiscono chiarite subito quanto e per cosa. Una cifra fissata all'inizio rende più semplici tutte le scelte dopo, perché ogni preventivo si confronta con quella.</p>
<p>Del costo «medio» di un matrimonio è meglio non fidarsi troppo: cambia moltissimo con la zona, la stagione, il giorno della settimana e il numero di invitati. Conta quello che potete spendere voi.</p>

<h2>2. Gli invitati muovono i conti</h2>
<p>Catering, bomboniere, torta e spesso le partecipazioni si pagano a persona: ogni invitato in più fa crescere più voci insieme. Per questo una prima lista degli invitati, anche approssimativa, va fatta prima di chiedere i preventivi. Separate adulti e bambini, perché molti catering hanno un prezzo diverso per i menù dei più piccoli.</p>

<h2>3. Le voci di spesa</h2>
<p>Sono le stesse voci che trovate già pronte nella dashboard di Nozze in Ordine. Non tutte servono a tutti: togliete quelle che non vi riguardano.</p>
<div class="table-wrap"><table>
<thead><tr><th>Voce</th><th>Cosa comprende</th></tr></thead>
<tbody>
<tr><td>Location e ricevimento</td><td>Affitto della sala o della villa, servizi compresi, eventuali costi di allestimento della sala.</td></tr>
<tr><td>Catering</td><td>Menù a persona, aperitivo, bevande, menù bambini e fornitori (fotografo, musicisti) se vanno sfamati.</td></tr>
<tr><td>Fotografo e video</td><td>Servizio del giorno, eventuali foto prima del matrimonio, album e copie.</td></tr>
<tr><td>Abiti e accessori</td><td>Abiti, modifiche, scarpe, accessori, trucco e capelli.</td></tr>
<tr><td>Fiori e allestimenti</td><td>Bouquet, fiori per il rito e per i tavoli, decorazioni.</td></tr>
<tr><td>Musica e intrattenimento</td><td>Musica per il rito e per la festa, animazione, eventuali diritti da pagare.</td></tr>
<tr><td>Partecipazioni e stampa</td><td>Save the date, partecipazioni, buste, segnaposto, tableau, libretti.</td></tr>
<tr><td>Bomboniere</td><td>Bomboniere, confetti, confezioni.</td></tr>
<tr><td>Trasporti</td><td>Auto degli sposi, navette per gli invitati.</td></tr>
<tr><td>Rito e documenti</td><td>Offerta alla parrocchia o tariffa del comune, marche da bollo, fedi. Vedi la <a href="/guide/documenti-matrimonio">guida ai documenti</a>.</td></tr>
<tr><td>Viaggio di nozze</td><td>Viaggio, alloggi, assicurazione.</td></tr>
<tr><td>Altre spese</td><td>Tutto il resto: regali ai testimoni, mance, imprevisti.</td></tr>
</tbody></table></div>

<h2>4. Previsto, preventivo, pagato</h2>
<p>Per ogni voce tenete tre cifre. Il <strong>previsto</strong> è la parte del totale che decidete di darle all'inizio. Il <strong>preventivo scelto</strong> è quanto vi costa davvero il fornitore che avete scelto. Il <strong>già pagato</strong> è la somma di acconti e pagamenti fatti. La differenza tra preventivo e già pagato è quello che resta da pagare.</p>
<p>Quando un preventivo supera il previsto, decidete subito da quale voce togliere la differenza. Se la rimandate, è facile sforare senza accorgersene.</p>

<h2>5. Acconti e saldi, con le date</h2>
<p>Quasi ogni fornitore chiede un acconto alla firma e il saldo vicino alla data o subito dopo. Segnate per ogni voce quanto è l'acconto, entro quando va pagato e la data del saldo, come scritto nel contratto. Mettendo in fila le date vedete in quali mesi si concentrano le uscite, e non vi trovate tre saldi nella stessa settimana.</p>

<h2>6. Un margine per gli imprevisti</h2>
<p>Qualcosa costerà più del previsto: un invitato in più, una modifica all'abito, un servizio dimenticato. Decidete all'inizio una quota del totale da tenere da parte e non assegnatela a nessuna voce. Se a fine matrimonio è avanzata, meglio.</p>`,
  tool: { h: "Il budget, già impostato", p: "Nella dashboard gratuita le 12 voci sono pronte: per ognuna previsto, preventivo, acconto e saldo con le date, e quanto resta da pagare. I pagamenti si vedono mese per mese e il budget è condiviso con il partner.", btn: "Crea il budget gratis", href: SIGNUP,
    after: `<div class="frame frame--photo tool-shot">${shot("budget")}</div>` },
  faq: [
    ["Quanto costa un matrimonio?", "Non c'è una cifra giusta: cambia con la zona, la stagione, il giorno, il numero di invitati e le vostre scelte. Partite da quanto potete spendere voi e dividetelo tra le voci, invece di inseguire una media."],
    ["Qual è la voce che pesa di più?", "Di solito location e catering insieme, perché crescono con il numero degli invitati. Per questo la prima lista degli invitati va fatta prima di chiedere i preventivi."],
    ["Quanto tenere da parte per gli imprevisti?", "Decidete una quota all'inizio e non assegnatela a nessuna voce. Più l'organizzazione è lunga e complessa, più conviene che sia ampia."],
    ["Meglio un foglio Excel o un'app per il budget?", "Un foglio va bene finché lo tiene una persona sola. Quando il budget è condiviso con il partner o con la wedding planner, un'app evita le versioni diverse dello stesso file, calcola da sola quanto resta da pagare e ricorda le date di acconti e saldi."],
    ["Come si gestiscono acconti e saldi?", "Segnate per ogni fornitore importo e data dell'acconto e data del saldo, come scritto nel contratto. Mettete le date in fila per vedere in quali mesi si concentrano le uscite."]] });

guide({ slug: "disposizione-tavoli-matrimonio", cat: "Invitati e tavoli", img: "invitati", published: "2026-11-19", updatedIso: "2026-11-19", updated: "19 novembre 2026",
  title: "Disposizione dei tavoli al matrimonio: come farla, passo per passo",
  desc: "Quando fare la disposizione dei tavoli del matrimonio, come dividere gli invitati, tavoli rotondi, rettangolari e imperiali, il tavolo degli sposi e il tableau.",
  h1: "Come fare la disposizione dei tavoli al matrimonio",
  answer: `<p>La disposizione dei tavoli si fa <strong>dopo la data limite per le risposte</strong>, quando sapete chi viene davvero. Partite dai <strong>gruppi</strong> (famiglie e amici di ciascuno), scegliete con la location <strong>forma e numero dei tavoli</strong>, sistemate prima il tavolo degli sposi e le famiglie, poi gli amici. Con menù e allergie segnati invitato per invitato, il catering sa cosa servire a ogni tavolo.</p>`,
  body: `
<h2>1. Quando farla</h2>
<p>Una bozza si può iniziare presto, ma la disposizione vera si fa sulle risposte: chi ha detto di no libera un posto, chi non ha ancora risposto va sollecitato. Fissate sulla partecipazione una data limite per le risposte (ne parliamo nella <a href="/guide/quando-si-danno-le-partecipazioni">guida alle partecipazioni</a>) e chiedete alla location e al catering entro quando vogliono la disposizione definitiva.</p>
<p>Tenetevi qualche giorno di margine: all'ultimo arrivano sempre un ritiro o un accompagnatore in più.</p>

<h2>2. Dividete gli invitati in gruppi</h2>
<p>Prima di pensare ai tavoli, mettete ogni invitato in un gruppo: famiglia della sposa, famiglia dello sposo, amici di ciascuno, amici comuni, colleghi. Tenete insieme i nuclei: una coppia o una famiglia con bambini siedono vicine. I gruppi diventano quasi da soli i primi tavoli.</p>

<h2>3. Forma e numero dei tavoli</h2>
<p>Quanti tavoli e di che forma ve lo dice la sala: chiedete alla location la pianta, quanti posti ha ogni tavolo e dove vanno pista, buffet e musica.</p>
<div class="table-wrap"><table>
<thead><tr><th>Tavolo</th><th>Quando sceglierlo</th></tr></thead>
<tbody>
<tr><td>Rotondo</td><td>Il più diffuso: tutti si vedono e si parla con l'intero tavolo. Si adatta bene a gruppi già formati.</td></tr>
<tr><td>Rettangolare</td><td>Sfrutta meglio sale lunghe e strette; si parla soprattutto con chi sta di fronte e di fianco.</td></tr>
<tr><td>Imperiale</td><td>Un unico tavolo lungo, o poche file, per un clima conviviale. Gli invitati si mescolano di più, ma conta molto chi siede accanto a chi.</td></tr>
<tr><td>Tavolo degli sposi</td><td>Solo gli sposi, oppure con i testimoni. Di solito i posti stanno su un lato, rivolti verso la sala.</td></tr>
</tbody></table></div>
<p>Contate anche seggioloni e passeggini: occupano spazio vicino al tavolo.</p>

<h2>4. Il tavolo degli sposi e le famiglie</h2>
<p>Sistemate prima il tavolo degli sposi, in una posizione da cui si vede tutta la sala. Accanto o di fronte mettete i genitori e i parenti più stretti; nonni e anziani lontano dalle casse della musica e vicino all'uscita o ai servizi.</p>
<p>Secondo il galateo più diffuso la sposa siede alla destra dello sposo. Se i genitori sono separati, o in famiglia ci sono tensioni, non c'è una regola: meglio due tavoli vicini che un tavolo scomodo per tutti.</p>

<h2>5. Gli amici, i colleghi, i bambini</h2>
<p>Per gli amici funziona chi si conosce già, con qualche persona di raccordo nei tavoli misti: chi viene da solo sta meglio accanto a qualcuno che conosce almeno di vista. I colleghi possono stare insieme.</p>
<p>Per i bambini ci sono due strade: con i genitori, oppure a un tavolo dei bambini con animazione, se la location lo prevede. In entrambi i casi segnate chi ha il menù bambini.</p>

<h2>6. Menù e allergie, tavolo per tavolo</h2>
<p>Il catering deve sapere non solo quanti menù vegetariani o senza glutine servire, ma anche a quali tavoli. Segnate menù, intolleranze e allergie per ogni invitato, non per famiglia, e consegnate al catering l'elenco tavolo per tavolo.</p>

<h2>7. Il tableau</h2>
<p>Il tableau è il cartellone all'ingresso della sala con i tavoli e i nomi di chi ci siede. Si prepara per ultimo, sulla disposizione definitiva: ogni cambio dopo la stampa costa tempo e denaro. Ordinate i nomi in modo che ognuno si trovi in fretta, per tavolo o in ordine alfabetico.</p>`,
  tool: { h: "La sala, in pianta", p: "Nella dashboard disegnate la sala con tavoli rotondi, rettangolari, imperiali e il tavolo degli sposi, e toccate un posto per scegliere chi ci siede. Gli invitati sono già divisi in gruppi con risposte, menù e allergie, e i posti di chi non ha ancora risposto restano provvisori. Con il piano gratuito provate la sala fino a 3 tavoli; con il Pass Tableau i tavoli sono illimitati e il tableau si stampa.", btn: "Iniziate gratis", href: SIGNUP,
    after: `<div class="frame frame--photo tool-shot">${shot("sala")}</div>` },
  faq: [
    ["Quando si fa la disposizione dei tavoli del matrimonio?", "Dopo la data limite per le risposte, quando sapete chi viene. Chiedete alla location e al catering entro quando la vogliono definitiva e tenetevi qualche giorno di margine."],
    ["Quante persone per tavolo al matrimonio?", "Dipende dai tavoli della location: chiedete la pianta e quanti posti ha ogni tavolo. Spesso i tavoli rotondi hanno da 8 a 12 posti, ma decide la sala."],
    ["Chi siede al tavolo degli sposi?", "Gli sposi da soli oppure con i testimoni, a seconda di come preferite. Genitori e parenti stretti stanno di solito ai tavoli più vicini."],
    ["Dove siede la sposa al tavolo degli sposi?", "Secondo il galateo più diffuso alla destra dello sposo. È un'usanza, non un obbligo."],
    ["Cosa fare con chi non ha ancora risposto?", "Sollecitatelo prima di chiudere la disposizione. Intanto potete dargli un posto provvisorio, da liberare se non viene."],
    ["Meglio tavoli rotondi o imperiali?", "I rotondi aiutano la conversazione in gruppi già formati; l'imperiale crea un clima più conviviale ma chiede più attenzione a chi siede accanto a chi. Decide anche la forma della sala."]] });

// Checklist: le stesse 20 attività del calendario (TASKS), con un rimando alle guide dove serve
const CHECK_LINKS = { "Definire il budget complessivo": "/guide/budget-matrimonio", "Inviare i save the date": "/guide/quando-si-danno-le-partecipazioni",
  "Inviare le partecipazioni": "/guide/quando-si-danno-le-partecipazioni", "Documenti per le pubblicazioni": "/guide/documenti-matrimonio",
  "Prenotare il rito in comune o in parrocchia": "/guide/documenti-matrimonio", "Raccogliere le risposte degli invitati": "/guide/disposizione-tavoli-matrimonio" };
guide({ slug: "checklist-matrimonio", cat: "Tempi e scadenze", img: "bosco", published: "2026-11-19", updatedIso: "2026-11-19", updated: "19 novembre 2026",
  title: "Checklist del matrimonio: tutte le cose da fare, fase per fase",
  desc: "La lista delle cose da fare per organizzare il matrimonio, da 14 mesi prima alla settimana del sì: data, budget, location, fornitori, inviti, documenti, saldi e conferme.",
  h1: "Checklist del matrimonio: cosa fare e quando",
  answer: `<p>Si parte <strong>12–14 mesi prima</strong> con data, rito, budget, location e prima lista degli invitati. Tra 9 e 11 mesi si prenotano fotografo, catering, musica e il rito; tra 6 e 8 mesi save the date, abiti, fiori, partecipazioni e bomboniere. Negli ultimi 5 mesi partono gli inviti, si fanno menù e pubblicazioni, si raccolgono le risposte, si saldano i fornitori e si conferma tutto.</p>`,
  body: `
<p>Sono le 20 attività che Nozze in Ordine usa per costruire il calendario di ogni matrimonio, divise in sei fasi. I tempi sono un punto di partenza: se il matrimonio è più vicino, le prime decisioni restano le stesse e le altre si stringono. Per avere il giorno preciso di ognuna sulla vostra data usate il <a href="/scadenze-matrimonio">calcolatore delle scadenze</a>.</p>
${PHASES.map(([when, what], i) => `
<h2>${when}: ${what.toLowerCase()}</h2>
<p>${PHASE_TEXT[i]}</p>
<ul>${TASKS.filter((x) => x[1] === i).map(([n, , m, d]) => `<li>${CHECK_LINKS[n] ? `<a href="${CHECK_LINKS[n]}">${n}</a>` : n} <span class="muted">· ${ago(m, d)}</span></li>`).join("")}</ul>`).join("")}

<h2>Le cose che si dimenticano più spesso</h2>
<ul>
<li>le fedi, da ordinare con il tempo per misure e incisioni;</li>
<li>il corso prematrimoniale, se vi sposate in chiesa: i corsi hanno un calendario fisso;</li>
<li>i dati dei testimoni per il comune o la parrocchia;</li>
<li>la prova di trucco e capelli;</li>
<li>la lista nozze o le indicazioni per il regalo;</li>
<li>gli alloggi per chi viene da lontano;</li>
<li>un piano in caso di pioggia, se rito o ricevimento sono all'aperto;</li>
<li>i pasti per i fornitori che lavorano tutto il giorno, da concordare con il catering.</li>
</ul>

<h2>Civile o in chiesa: cosa cambia</h2>
<p>La checklist è la stessa. Per il matrimonio in chiesa si aggiungono il corso prematrimoniale, i certificati di battesimo e cresima e il colloquio con il parroco; per entrambi servono le pubblicazioni in comune, che valgono 180 giorni. Tutti i passaggi sono nella <a href="/guide/documenti-matrimonio">guida ai documenti</a>.</p>`,
  tool: { h: "La checklist, da spuntare", p: "Nella dashboard gratuita le 20 attività compaiono già sulla vostra data. Si spuntano, si spostano e se ne aggiungono altre, e se cambia la data si ricalcolano da sole. Il partner vede la stessa lista.", btn: "Create la vostra checklist", href: SIGNUP,
    after: `<div class="frame frame--photo tool-shot">${shot("scadenze")}</div>` },
  faq: [
    ["Quanto tempo prima si inizia a organizzare un matrimonio?", "Il calendario di Nozze in Ordine parte 14 mesi prima, con la data e il rito. Si può fare in meno tempo: le prime decisioni (data, budget, location) restano le stesse e le altre si avvicinano."],
    ["Qual è la prima cosa da fare?", "Fissare la data e il tipo di rito, poi il budget complessivo e la location. La location decide quanti invitati potete avere e da lì dipendono quasi tutte le altre scelte."],
    ["Cosa fare nell'ultimo mese prima del matrimonio?", "Saldare i fornitori principali secondo i contratti, confermare gli orari con tutti, dare al catering i numeri definitivi e condividere la scaletta della giornata con fornitori e testimoni."],
    ["La checklist cambia per il matrimonio civile?", "Poco: senza il rito religioso non servono corso prematrimoniale e certificati della parrocchia. Le pubblicazioni in comune servono in entrambi i casi."],
    ["Come si tiene la checklist in due?", "Con una lista condivisa, in cui ognuno vede cosa è fatto e cosa manca. Nella dashboard di Nozze in Ordine la checklist è condivisa con il partner e, con il piano Completo, anche con la wedding planner."]] });

// Indice delle guide a card (scelta di Felice): etichetta, titolo, due righe, foto in fondo alla card; la card intera è il link
const guideCard = ({ href, cat, h, p, media, span }) => `
          <article class="card guide-card ${span}">
            <p class="t-label">${cat}</p>
            <h3><a href="${href}">${h}</a></h3>
            <p>${p}</p>
            <div class="guide-card__media">${media}</div>
          </article>`;
const HUB_CARDS = [{ href: "/scadenze-matrimonio", cat: "Strumento gratuito", h: "Calcolatore delle scadenze del matrimonio", p: "Inserite la data e vedete il giorno di 20 attività, dalla location ai saldi dei fornitori.", media: shot("scadenze") },
  ...GUIDES.map((g) => ({ href: `/guide/${g.slug}`, cat: g.cat, h: g.h1, p: g.desc, media: pic(g.img, { sizes: "(min-width: 1024px) 33vw, 100vw" }) }))];
const hubSpan = (n, i) => n % 3 === 0 ? "span-4" : n % 3 === 2 && i >= n - 2 ? "span-6" : n % 3 === 1 && i >= n - 4 ? "span-6" : "span-4";
write("guide.html", head("Guide per organizzare il matrimonio | Nozze in Ordine", "Guide pratiche per organizzare il matrimonio: tempi, documenti, budget, invitati e tavoli. Risposte dirette e strumenti gratuiti.", { robots: GUIDE_ROBOTS, extra: `<style>
#guide { padding-top: calc(var(--nav) + var(--s-8)); }
.guide-card .t-label { margin: 0 0 var(--s-3); color: var(--muted); }
.guide-card h3 a { color: inherit; text-decoration: none; }
.guide-card h3 a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.guide-card:has(a:focus-visible) { outline: 2px solid var(--accent); outline-offset: 3px; }
.guide-card:hover h3 a { color: var(--action); }
.guide-card__media { margin-top: auto; padding-top: var(--s-6); }
.guide-card__media img { display: block; width: 100%; aspect-ratio: 3 / 2; height: auto; object-fit: cover; border-radius: calc(var(--c-r) - 8px); }
@media (max-width: 1023px) { .guide-card { grid-column: 1 / -1; } }
@media (min-width: 640px) and (max-width: 1023px) { .guide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .guide-card { grid-column: auto; } }
</style>` }) + top("guide") + `
<main id="top">
  <section class="section" id="guide" aria-labelledby="hero-h">
    <div class="wrap">
      <div class="section-head"><h1 id="hero-h">Guide per organizzare il matrimonio</h1><p>Risposte dirette alle domande che arrivano mentre si organizza: quando, quanto, in che ordine. Ogni guida rimanda a uno strumento gratuito.</p></div>
      <div class="grid guide-grid">${HUB_CARDS.map((c, i) => guideCard({ ...c, span: hubSpan(HUB_CARDS.length, i) })).join("")}
      </div>
    </div>
  </section>
</main>` + foot());

/* =========================================================== PLANNER */
write("planner.html", head("Nozze in Ordine per le wedding planner: gestionale dei matrimoni", `Il gestionale per wedding planner: tutti i matrimoni in un unico spazio, con acconti, scadenze e portale per gli sposi. Da ${PREZZI.planner} € al mese.`.replace("€ €", "€")) + top("planner") + `
<main id="top">${heroPhoto({ k: "heroPlanner", pos: "60% 55%", posPhone: "70% 55%",
  h1: "Gestionale per wedding planner",
  lead: `Tutti i tuoi matrimoni in una dashboard, con un portale per gli sposi. Da ${PREZZI.planner} al mese, ${PREZZI.prova} giorni di prova.`,
  a: primary(), b: secondary("Vedi i piani", "#piani"),
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
      <div class="section-head"><h2 id="piani-h">Canoni per numero di matrimoni</h2><p>IVA esclusa. 7 giorni di prova su Planner e Team, senza carta di credito. Un matrimonio è attivo finché la sua data non è passata.</p></div>
      <div class="grid grid--top">${planCard(PLAN.planner)}${planCard(PLAN.team)}${planCard(PLAN.studio)}
      </div>
    </div>
  </section>

  <section class="section" id="lavoro" aria-labelledby="lavoro-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="lavoro-h">Dall'incarico firmato al giorno del sì</h2>
          <p>Nozze in Ordine non trova clienti e non organizza eventi: ti dà un posto ordinato in cui lavorare.</p>
        </div>
        <div class="frame frame--photo span-6 start-7">${pic("coord")}</div>
      </div>
    </div>
  </section>
</main>` + foot(closeType("Prova Nozze in Ordine sui tuoi matrimoni", `${PREZZI.prova} giorni di prova, poi da ${PREZZI.planner} al mese, IVA esclusa.`)));

/* =========================================================== PREZZI */
LD["prezzi.html"] = [{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Nozze in Ordine", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE + "/prezzi",
  offers: [{ "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "EUR", description: "Per le coppie, senza limiti di tempo" },
    { "@type": "Offer", name: "Pass Tableau", price: euro(PREZZI.tableau), priceCurrency: "EUR", description: "Per le coppie: tavoli, sala in pianta e stampa del tableau, una volta sola, IVA inclusa" },
    { "@type": "Offer", name: "Completo", price: euro(PREZZI.completo), priceCurrency: "EUR", description: "Per le coppie: una volta sola, per un matrimonio, IVA inclusa" },
    { "@type": "Offer", name: "Planner", price: euro(PREZZI.planner), priceCurrency: "EUR", description: `Per wedding planner: canone mensile IVA esclusa, fino a ${PREZZI.eventiPlanner} matrimoni attivi` },
    { "@type": "Offer", name: "Team", price: euro(PREZZI.team), priceCurrency: "EUR", description: `Per wedding planner: canone mensile IVA esclusa, fino a ${PREZZI.eventiTeam} matrimoni attivi e ${PREZZI.collabTeam} collaboratori` }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) }];
write("prezzi.html", head("Prezzi di Nozze in Ordine per coppie e wedding planner", `Coppie: gratis per iniziare, Pass Tableau a ${PREZZI.tableau} o Completo a ${PREZZI.completo}, una volta sola. Wedding planner: da ${PREZZI.planner} al mese, con ${PREZZI.prova} giorni di prova.`) + top("prezzi") + `
<main id="top">${heroPhoto({ k: "heroPrezzi", pos: "70% 60%", posPhone: "78% 60%",
  h1: "Prezzi per coppie e planner",
  lead: `Coppie: gratis, Pass Tableau a ${PREZZI.tableau} o Completo a ${PREZZI.completo}, una volta sola. Planner: da ${PREZZI.planner} al mese, IVA esclusa, con ${PREZZI.prova} giorni di prova.`,
  a: primary(), b: secondary("Confronta i piani", "#coppie"),
  facts: [["Gratis", "0 €, senza scadenza"], ["Pass Tableau", `${PREZZI.tableau} una volta`], ["Completo", `${PREZZI.completo} una volta`], ["Planner", `Da ${PREZZI.planner} al mese`]] })}

  <section class="section is-pricing" id="coppie" aria-labelledby="coppie-h">
    <div class="wrap">
      <div class="section-head"><h2 id="coppie-h">Per le coppie. <span class="muted">IVA inclusa.</span></h2><p>Un pagamento unico, mai un abbonamento: l'organizzazione dura il tempo che serve e poi finisce. Potete restare sul Gratis quanto volete. <a class="link" href="/coppie">Vedi la pagina per le coppie</a></p></div>
      <div class="grid grid--top">${planCard(PLAN.gratis)}${planCard(PLAN.tableau)}${planCard(PLAN.completo)}
      </div>
      <p class="upgrade-line">Avete già il Pass Tableau? Passate al Completo con ${PREZZI.upgrade}.</p>
    </div>
  </section>

  <section class="section is-pricing" id="planner" aria-labelledby="planner-h">
    <div class="wrap">
      <div class="section-head"><h2 id="planner-h">Per le wedding planner. <span class="muted">IVA esclusa.</span></h2><p>Un canone fisso al mese, scelto in base ai matrimoni che segui. ${PREZZI.prova} giorni di prova su Planner e Team.</p></div>
      <div class="grid grid--top">${planCard(PLAN.planner)}${planCard(PLAN.team)}${planCard(PLAN.studio)}
      </div>
    </div>
  </section>

  <section class="section" id="domande" style="--hm: 2" aria-labelledby="domande-h">
    <div class="wrap">
      <div class="section-head"><h2 id="domande-h">Domande sui prezzi</h2></div>
      <div class="grid grid--top fill"><div class="span-6">${faqList([faq[0], faq[2], faq[3], faq[1]])}${faqList([faq[7], faq[8]])}</div>
        <div class="frame frame--photo span-6 start-7">${pic("cambia")}</div></div>
    </div>
  </section>
</main>` + foot());



// Dati del titolare: completare indirizzo e partita IVA prima di attivare i pagamenti.
const TITOLARE = { nome: "Felice Mondo", sede: "Marcianise (CE), Italia", piva: "", email: "info@nozzeinordine.com" };
const AGGIORNATO = "15 novembre 2026";
const MAILTO = `<a href="mailto:${TITOLARE.email}">${TITOLARE.email}</a>`;
/* =========================================================== CHI SIAMO */
write("chi-siamo.html", head("Chi siamo: Nozze in Ordine, app per organizzare il matrimonio", "Nozze in Ordine è un'app per organizzare il matrimonio, progettata in Campania per coppie e wedding planner. Uno strumento, non un'agenzia: niente pubblicità e niente marketplace.") + top("chi-siamo") + `
<main id="top">${heroPhoto({ k: "heroChi", pos: "0% 55%", posPhone: "30% 55%", calm: "right",
  h1: "Chi c'è dietro Nozze in Ordine",
  lead: "Un'app per organizzare il matrimonio, progettata in Campania per coppie e wedding planner di tutta Italia.",
  a: primary(), b: secondary("Scrivici", "mailto:info@nozzeinordine.com"),
  facts: [["Dove", "Marcianise, Caserta"], ["Per chi", "Coppie e planner"], ["Coppie", "Gratis per iniziare"], ["Contatto", "info@nozzeinordine.com"]] })}

  <section class="section" id="perche" aria-labelledby="perche-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="perche-h">Perché esiste Nozze in Ordine</h2>
          <p>Organizzare un matrimonio vuol dire tenere insieme budget, fornitori, invitati e scadenze per molti mesi, spesso tra fogli di calcolo, chat e appunti sparsi.</p>
          <p>Nozze in Ordine mette tutto in un unico spazio, condiviso tra la coppia e chi la aiuta, con le scadenze calcolate sulla data del matrimonio.</p>
        </div>
        <div class="frame frame--photo span-6 start-7">${shot("panoramica")}</div>
      </div>
    </div>
  </section>

  <section class="section" id="regole" aria-labelledby="regole-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="span-5 stack-6">
          <h2 id="regole-h">Come lavora Nozze in Ordine</h2>
          ${rows([
            ["Uno strumento, non un'agenzia", "Non organizza matrimoni e non vende spazi ai fornitori: i fornitori li scegliete voi.", ""],
            ["Nessuna pubblicità", "Lo spazio è vostro. I dati servono a far funzionare l'app, non vengono venduti né ceduti.", ""],
            ["Prezzi scritti", "Coppie: gratis o 49 € una volta sola. Planner: un canone fisso, con una prova gratuita.", ""],
            ["Ognuno vede ciò che gli spetta", "Coppia, planner e collaboratori entrano con il proprio accesso. Le note della planner restano sue.", ""]])}
        </div>
        <div class="frame frame--photo span-6 start-7">${pic("bosco")}</div>
      </div>
    </div>
  </section>

</main>` + foot());

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
<li><strong>Google</strong> (Google Ireland Limited): casella di posta in cui leggiamo i vostri messaggi${TRACKING.ga4 || TRACKING.gtm ? " e, solo con il vostro consenso, Google Tag Manager e Google Analytics per contare le visite al sito" : ""}.</li>${TRACKING.clarity ? `
<li><strong>Microsoft</strong> (Microsoft Ireland Operations Limited): Microsoft Clarity, solo con il vostro consenso, per capire come viene usato il sito.</li>` : ""}${TRACKING.pixel ? `
<li><strong>Meta</strong> (Meta Platforms Ireland Limited): Meta Pixel, solo con il vostro consenso, per misurare le campagne su Facebook e Instagram.</li>` : ""}</ul>
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
<p>${TRK_ON ? "Strumenti di statistica e di marketing partono solo se li accettate dal banner, e potete cambiare idea in qualsiasi momento." : "Non usiamo cookie di profilazione né strumenti di analisi."} I dettagli sono nella <a href="cookie.html">pagina cookie</a>.</p>
<h2>14. Modifiche</h2>
<p>Se questa informativa cambia in modo sostanziale, lo scriviamo qui e avvisiamo per email chi ha un account.</p>
<h2 id="crediti">Immagini</h2>
<p>Le fotografie del sito sono evocative e non rappresentano eventi organizzati da Nozze in Ordine.</p>
<p>Le altre fotografie vengono da <a href="https://unsplash.com/?utm_source=felice_mondo_progetti&amp;utm_medium=referral">Unsplash</a>, con la <a href="https://unsplash.com/license">licenza Unsplash</a>:</p>
<ul class="credits">${PHOTO_CREDITS.map(([f, a, au, p]) => `<li><a href="${p}">${f.replace(/-/g, " ")}</a> di <a href="${au}">${a}</a></li>`).join("")}</ul>` });

legalPage({ file: "cookie.html", title: "Informativa sui cookie | Nozze in Ordine", desc: TRK_ON ? "Quali cookie usano il sito e la dashboard di Nozze in Ordine: quelli tecnici, sempre attivi, e gli strumenti di misura, solo con il vostro consenso." : "Quali cookie e strumenti simili usano il sito e la dashboard di Nozze in Ordine: solo quelli tecnici, necessari al funzionamento.", eb: "Informativa", h1: "Cookie.",
  lead: TRK_ON ? "Il sito usa cookie tecnici, sempre attivi, e alcuni strumenti di misura che partono solo se li accettate dal banner. Potete cambiare scelta in qualsiasi momento." : "Il sito e la dashboard usano soltanto strumenti tecnici, necessari al funzionamento. Per questo non compare un banner di consenso: la legge lo richiede solo per cookie di profilazione e strumenti di analisi non anonimi, che qui non ci sono.",
  body: `
<h2>Sul sito</h2>
${TRK_ON ? `<p>Con il vostro consenso, dato o negato dal banner e modificabile da <a href="/cookie" data-cookie-prefs>Preferenze cookie</a>, il sito usa:</p>
<ul>${TRACKING.ga4 || TRACKING.gtm ? `<li><strong>Google Analytics 4</strong>${TRACKING.gtm ? ", tramite Google Tag Manager," : ""} (statistiche): conta visite e pagine viste in forma aggregata. Cookie <em>_ga</em> e <em>_ga_*</em>, durata fino a 13 mesi. Fornitore: Google Ireland Limited.</li>` : ""}${TRACKING.clarity ? `<li><strong>Microsoft Clarity</strong> (statistiche): mostra come viene usata la pagina, con mappe dei clic e registrazioni anonime delle sessioni; i campi dei moduli sono oscurati. Cookie <em>_clck</em> e <em>_clsk</em>, durata fino a 12 mesi. Fornitore: Microsoft Ireland Operations Limited.</li>` : ""}${TRACKING.pixel ? `<li><strong>Meta Pixel</strong> (marketing): misura le campagne su Facebook e Instagram e le registrazioni che ne derivano. Cookie <em>_fbp</em>, durata fino a 3 mesi. Fornitore: Meta Platforms Ireland Limited.</li>` : ""}</ul>
<p>Se rifiutate, nessuno di questi strumenti viene caricato. La vostra scelta si conserva nel browser per 6 mesi.</p>` : ""}
<p>${TRK_ON ? "Oltre a questi, le pagine del sito non impostano cookie nostri." : "Le pagine del sito non impostano cookie nostri, non caricano contenuti da altri siti e non usano strumenti di analisi o pixel pubblicitari."} I caratteri tipografici e le immagini sono ospitati sul nostro stesso dominio.</p>
<p>Cloudflare, che consegna il sito, può impostare cookie tecnici di sicurezza per distinguere le visite reali dal traffico automatico. Sono strettamente necessari e non servono a riconoscervi tra siti diversi.</p>
<h2>Nella dashboard</h2>
<p>Quando accedete, il browser conserva nella propria memoria locale (<em>localStorage</em> e <em>sessionStorage</em>):</p>
<ul><li><strong>La sessione di accesso</strong>, che vi mantiene collegati senza reinserire la password a ogni pagina. Si cancella quando uscite dall'account.</li>
<li><strong>Le preferenze dell'interfaccia</strong>, per esempio l'ultima sezione aperta.</li></ul>
<p>Se lo consentite, la dashboard mostra le notifiche di scadenze e pagamenti sul vostro dispositivo. Il permesso si concede e si revoca dalle impostazioni del browser.</p>
<h2>Come cancellarli</h2>
<p>Potete cancellare in ogni momento cookie e dati dei siti dalle impostazioni del browser. Senza la sessione di accesso la dashboard vi chiederà di nuovo email e password.</p>
<h2>Se qualcosa cambia</h2>
<p>${TRK_ON ? "Se aggiungeremo altri strumenti che richiedono il consenso, li elencheremo qui e ve lo chiederemo di nuovo." : "Se in futuro useremo strumenti di analisi o di altro tipo che richiedono il consenso, li attiveremo solo dopo avervelo chiesto, e aggiorneremo questa pagina."}</p>
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
<li><strong>Pass Tableau</strong> (coppie): ${PREZZI.tableau}, IVA inclusa, una volta sola. Vale per un solo matrimonio e sblocca invitati illimitati, tavoli e sala senza limiti e le stampe dei tavoli. Si può passare al Completo pagando ${PREZZI.upgrade}. Valgono le stesse regole del Completo sui nomi degli sposi e sull'uso personale.</li>
<li><strong>Completo</strong> (coppie): ${PREZZI.completo}, IVA inclusa, una volta sola. Vale per un solo matrimonio. I nomi degli sposi si fissano all'attivazione e non possono essere cambiati. È riservato all'uso personale: non può essere usato da chi organizza matrimoni per lavoro.</li>
<li><strong>Planner</strong> e <strong>Team</strong> (professionisti): canone mensile di ${PREZZI.planner} e ${PREZZI.team}, IVA esclusa, con i limiti di matrimoni attivi e collaboratori indicati nella pagina prezzi. Un matrimonio è attivo finché la sua data non è passata. La prova gratuita dura ${PREZZI.prova} giorni.</li>
<li><strong>Studio</strong>: condizioni e prezzo concordati per iscritto.</li></ul>
<p>In questa fase di lancio i pagamenti non sono attivi e l'accesso è gratuito. Nessun piano a pagamento parte senza il vostro consenso espresso. Prima di attivare i pagamenti vi scriviamo per email; per i canoni mensili, ogni variazione di prezzo è comunicata con almeno 30 giorni di anticipo e potete disdire prima che si applichi.</p>
<h2>5. Recesso e disdetta</h2>
<p><strong>Coppie (consumatori).</strong> Avete 14 giorni dall'acquisto del Pass Tableau o del piano Completo per ripensarci, senza dare spiegazioni: scrivete a ${MAILTO} e rimborsiamo l'importo pagato entro 14 giorni, con lo stesso mezzo di pagamento. Restano fermi tutti i diritti che il Codice del consumo riconosce, compresa la garanzia legale di conformità.</p>
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

/* =========================================================== SITEMAP E LLMS.TXT (generati: ogni guida entra da sola) */
const PAGES = ["", "coppie", "tableau", "planner", "prezzi", "guide", "scadenze-matrimonio", "chi-siamo", "privacy", "cookie", "termini"]
  .concat(GUIDE_LIVE ? GUIDES.map((g) => "guide/" + g.slug) : []).filter((u) => GUIDE_LIVE || u !== "guide");
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(OUT, "llms.txt"), `# Nozze in Ordine

> App web per organizzare il matrimonio, per coppie e wedding planner in tutta Italia. Budget, fornitori e preventivi, invitati e risposte, tavoli, scadenze calcolate sulla data e scaletta del giorno, in uno spazio condiviso. È uno strumento, non un'agenzia: niente marketplace di fornitori e niente pubblicità.

- Lingua: italiano
- Progettata in Campania (Marcianise, Caserta)
- Accesso da telefono e computer, senza installare nulla
- Contatto: info@nozzeinordine.com

## Pagine principali

- [Per le coppie](${SITE}/coppie): budget, preventivi affiancati, invitati, tavoli e scadenze, condivisi con il partner e con la wedding planner.
- [Per le wedding planner](${SITE}/planner): gestionale per seguire più matrimoni, con acconti e saldi, scadenze, collaboratori e un portale per gli sposi.
- [Prezzi](${SITE}/prezzi): coppie gratis per iniziare (piano senza scadenza), Pass Tableau a ${PREZZI.tableau} o piano Completo a ${PREZZI.completo}, una volta sola, IVA inclusa; wedding planner da ${PREZZI.planner} al mese + IVA, con ${PREZZI.prova} giorni di prova.
- [Tableau del matrimonio](${SITE}/tableau): sala in pianta, invitati ai tavoli con menù e allergie, stampa del tableau e scheda per il catering. Prova gratuita fino a 3 tavoli, poi Pass Tableau a ${PREZZI.tableau} una volta sola.
- [Calcolatore delle scadenze del matrimonio](${SITE}/scadenze-matrimonio): strumento gratuito, senza registrazione. Dalla data del matrimonio calcola il giorno di 20 attività, dalla location ai saldi dei fornitori.
- [Chi siamo](${SITE}/chi-siamo)
${GUIDE_LIVE ? `
## Guide

- [Tutte le guide](${SITE}/guide)
${GUIDES.map((g) => `- [${g.h1}](${SITE}/guide/${g.slug}): ${g.desc}`).join("\n")}
` : ""}
## Regole

- [Privacy](${SITE}/privacy)
- [Termini](${SITE}/termini)
`);

console.log("pagine scritte in", OUT);
