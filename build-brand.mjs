// Genera brand/brand-guide.html e brand/tokens.css.  node build-brand.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "brand");

/* ---- contrasto WCAG ---- */
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(1).replace(".", ","); };

const C = {
  calce: "#F1F0EC", inchiostro: "#1E1417", muted: "#4B4044", aglianico: "#6E1B2F", bianco: "#FFFFFF",
  tessera: "#F7F7F5", posata: "#E7E6E2", fuga: "#D8D5CD",
  verde: "#5E8C3A", limone: "#E7B72F", celeste: "#7EA4D6", cotto: "#C4694D",
};

const TOKENS = `:root {
  --ground: ${C.calce};      /* calce */
  --ink: ${C.inchiostro};         /* inchiostro */
  --muted: ${C.muted};
  --accent: ${C.aglianico};      /* aglianico */
  --accent-ink: ${C.bianco};
  --tile: ${C.tessera};        /* tessera */
  --tile-laid: ${C.posata};   /* tessera già posata */
  --grout: ${C.fuga};        /* fuga */
  --verde: ${C.verde};  --limone: ${C.limone};  --celeste: ${C.celeste};  --cotto: ${C.cotto};   /* smalti: solo stati */
  --font: "Hanken Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif;
  --joint: 4px;   /* la fuga */
}
`;
writeFileSync(join(OUT, "tokens.css"), TOKENS);

const sw = (name, hex, role, ink = "#1E1417") => `<li class="sw" style="--c:${hex};--i:${ink}"><b>${name}</b><span>${hex}</span><em>${role}</em></li>`;

const pairs = [
  ["Inchiostro su calce", C.inchiostro, C.calce, "testo"],
  ["Testo secondario su calce", C.muted, C.calce, "note, didascalie"],
  ["Aglianico su calce", C.aglianico, C.calce, "numeri, link, stato attivo"],
  ["Bianco su aglianico", C.bianco, C.aglianico, "pulsanti, sezioni a campo pieno"],
  ["Inchiostro su limone", C.inchiostro, C.limone, "solo se serve testo sullo smalto"],
  ["Inchiostro su celeste", C.inchiostro, C.celeste, "solo se serve testo sullo smalto"],
  ["Bianco su inchiostro", C.bianco, C.inchiostro, "totali, tessera selezionata"],
];

const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Identità visiva | Nozze in Ordine</title><meta name="description" content="Guida al marchio di Nozze in Ordine: idea, logo, colori, carattere, immagini, movimento e voce."><link rel="icon" href="logo/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../site/styles.css"><style>
.g-hero { padding-top: clamp(28px, 4.4vw, 72px); align-items: stretch; }
.g-hero h1 { grid-column: 1 / span 7; }
.g-hero .lead { grid-column: 1 / span 6; margin-top: clamp(20px, 2.4vw, 36px); }
.g-hero .big { grid-column: 8 / span 5; grid-row: 1 / span 3; background: var(--accent); display: grid; place-items: center; min-height: 340px; }
.g-hero .big svg { width: min(62%, 300px); height: auto; fill: #fff; }
.g-head { grid-column: 1 / span 8; margin-bottom: clamp(32px, 4vw, 64px); }
.g-text { grid-column: 1 / span 6; display: grid; gap: 18px; }
.g-text p { max-width: 62ch; }
.g-text h3 { margin-top: 10px; }
.g-side { grid-column: 8 / span 5; display: grid; gap: 14px; align-content: start; }
.fields { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap: var(--joint); margin-top: clamp(32px, 4vw, 56px); }
.field-tile { display: grid; place-items: center; min-height: 260px; padding: 28px; }
.field-tile svg, .field-tile img { max-width: 100%; height: auto; }
.field-tile small { margin-top: 14px; display: block; text-align: center; font-size: var(--step-small); }
.t-ground { background: var(--ground); outline: var(--joint) solid var(--grout); outline-offset: calc(var(--joint) * -1); }
.t-accent { background: var(--accent); color: #fff; }
.t-ink { background: var(--ink); color: #fff; }
.t-laid { background: var(--tile-laid); }
.s4 { grid-column: span 4; } .s5 { grid-column: span 5; } .s6 { grid-column: span 6; } .s7 { grid-column: span 7; } .s8 { grid-column: span 8; } .s12 { grid-column: span 12; } .s3 { grid-column: span 3; }
.swatches { grid-column: 1 / -1; list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: var(--joint); background: var(--grout); padding: var(--joint); }
.sw { background: var(--c); color: var(--i); min-height: 190px; padding: 18px; display: grid; align-content: end; gap: 2px; font-size: var(--step-small); }
.sw b { font-size: var(--step-lead); letter-spacing: -0.025em; font-weight: 600; }
.sw span { font-variant-numeric: tabular-nums; }
.sw em { font-style: normal; opacity: .9; }
.sw.dark { --i: #fff; }
.prop { grid-column: 1 / -1; display: flex; gap: var(--joint); margin-top: clamp(24px, 3vw, 40px); height: 72px; }
.prop i { display: block; height: 100%; }
.prop-cap { grid-column: 1 / -1; margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px 24px; font-size: var(--step-small); }
.spec { grid-column: 1 / span 5; background: var(--tile-laid); padding: clamp(24px, 3vw, 44px); display: grid; align-content: space-between; min-height: 360px; }
.spec .aa { font-size: clamp(6rem, 14vw, 13rem); font-weight: 600; letter-spacing: -0.06em; line-height: .85; }
.spec p { font-size: var(--step-lead); letter-spacing: -0.02em; }
.scale { grid-column: 7 / span 6; display: grid; gap: var(--joint); }
.scale div { background: var(--tile-laid); padding: 16px 20px; display: grid; gap: 4px; }
.scale small { color: var(--muted); font-size: var(--step-small); }
.tbl td.y { font-weight: 600; }
.misuse { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: var(--joint); margin-top: var(--joint); }
.misuse div { background: var(--tile-laid); padding: 18px; display: grid; gap: 12px; justify-items: start; align-content: space-between; min-height: 190px; font-size: var(--step-small); }
.misuse svg { width: 64px; height: 64px; fill: var(--accent); }
.states { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: var(--joint); }
.states div { background: var(--tile); padding: 20px; display: grid; gap: 8px; align-content: start; min-height: 150px; font-size: var(--step-small); }
.photos { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap: var(--joint); background: var(--grout); padding: var(--joint); }
.photos figure { margin: 0; background: var(--tile); display: grid; }
.photos figcaption { padding: 10px 14px 14px; font-size: var(--step-small); color: var(--muted); }
.photos img { width: 100%; height: 100%; object-fit: cover; }
.voice { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: var(--joint); }
.voice div { padding: 20px 24px; display: grid; gap: 6px; align-content: start; }
.voice .si { background: var(--tile-laid); }
.voice .no { background: var(--tile); color: var(--muted); }
.voice b { font-size: var(--step-small); }
.code { grid-column: 1 / -1; margin: 0; background: var(--ink); color: #fff; padding: clamp(20px, 3vw, 40px); font-size: var(--step-small); line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.code code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.g-text.small { max-width: 78ch; }
.notes { grid-column: 1 / span 8; display: grid; gap: 14px; }
.notes li { list-style: square; margin-left: 20px; }
.motion-demo { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--joint); width: 120px; }
.motion-demo i { aspect-ratio: 1; background: var(--accent); display: block; animation: lay 2.4s cubic-bezier(.2,.8,.2,1) infinite; }
.motion-demo i:nth-child(2) { animation-delay: .1s; } .motion-demo i:nth-child(3) { animation-delay: .2s; } .motion-demo i:nth-child(4) { animation-delay: .3s; }
@keyframes lay { 0%, 18% { transform: rotate(180deg); } 45%, 100% { transform: rotate(0); } }
@media (max-width: 940px) {
  .g-hero h1, .g-hero .lead, .g-head, .g-text, .g-side, .spec, .scale, .notes { grid-column: 1 / -1; }
  .g-hero .big { grid-column: 1 / -1; grid-row: auto; margin-top: 28px; min-height: 260px; }
  .g-side, .scale { margin-top: 24px; }
  .s3, .s4, .s5, .s6, .s7, .s8 { grid-column: span 12; }
  .swatches, .states { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .misuse { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .voice { grid-template-columns: minmax(0,1fr); }
  .photos figure { grid-column: span 12 !important; }
}
@media (prefers-reduced-motion: reduce) { .motion-demo i { animation: none; } }
</style></head><body>
<div class="frame"><header class="top"><a class="brand" href="#"><svg viewBox="0 0 64 64" aria-hidden="true">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg><span>Nozze in Ordine</span></a><nav aria-label="Indice"><a href="#idea">Idea</a><a href="#marchio">Marchio</a><a href="#colore">Colore</a><a href="#carattere">Carattere</a><a href="#fuga">La fuga</a><a href="#immagini">Immagini</a><a href="#voce">Voce</a></nav></header></div>
<main>
<section class="frame g-hero" aria-labelledby="h1"><div class="grid"><h1 id="h1">Identità visiva.</h1>
<p class="lead">Guida al marchio di Nozze in Ordine. Versione 1.0, 23 ottobre 2026. Cosa abbiamo deciso, perché, e come usarlo senza doverci chiedere ogni volta.</p>
<div class="big" aria-hidden="true"><svg viewBox="0 0 64 64">${readFileSync(join(OUT, "logo/mark-white.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg></div></div></section>

<section class="section frame" id="idea" aria-labelledby="idea-h"><div class="grid"><h2 data-rv class="g-head" id="idea-h">Le riggiole, posate in ordine.</h2>
<div class="g-text"><p class="lead">Nel chiostro maiolicato di Santa Chiara, a Napoli, ogni tassello dipinto sta al suo posto. In napoletano si chiamano riggiole. Un matrimonio si organizza allo stesso modo: budget, fornitori, invitati, scadenze, tante tessere piccole che devono stare insieme.</p>
<p>Il marchio e il prodotto lavorano su questa immagine: tessere quadrate, una fuga stretta tra l'una e l'altra, un solo colore forte, un solo carattere. Niente corsivi, fiori, oro o sigilli: è il linguaggio di quasi tutti i servizi per matrimoni, e non dice nulla di noi.</p>
<h3>Cosa abbiamo guardato</h3>
<p>Le riggiole del chiostro di Santa Chiara (1739-42) sono descritte dalle fonti con celeste, giallo e verde, in linea con cielo, vite e limoni del giardino; la ceramica di Vietri sul Mare con blu, giallo, verde e rosso. Da qui i quattro smalti del prodotto. Le tendenze 2026 della cartoleria nuziale spostano l'attenzione su tipografia, date in grande e sistemi coerenti: ci siamo mossi in quella direzione, senza ornamenti.</p>
<p class="small soft">Fonti: <a href="https://fondoambiente.it/luoghi/complesso-monumentale-di-santa-chiara-napoli">FAI, Complesso monumentale di Santa Chiara</a> · <a href="https://www.comune.napoli.it/flex/cm/pages/ServeBLOB.php/L/EN/IDPagina/2227">Comune di Napoli</a> · <a href="https://www.italia.it/it/campania/salerno/vietri-sul-mare-cosa-vedere">italia.it, Vietri sul Mare</a> · <a href="https://www.stationeryhq.com/pages/wedding-stationery-trends-2026-what-designers-need-to-know">StationeryHQ, tendenze 2026</a> (fonte di un fornitore di stampa: da leggere con cautela). Le date del chiostro non coincidono del tutto tra le fonti.</p></div>
<div class="g-side"><h3>Prima e dopo</h3>
<table class="tbl"><thead><tr><th>Prima</th><th>Ora</th></tr></thead><tbody>
<tr><td>Corsivo Pinyon Script</td><td>Un solo carattere, Hanken Grotesk</td></tr>
<tr><td>Bodoni Moda per i titoli</td><td>Titoli in semibold stretto</td></tr>
<tr><td>Filetti oro e sigillo</td><td>La fuga di 4px, niente linee</td></tr>
<tr><td>Icone in cerchio</td><td>Frammenti reali del prodotto</td></tr>
<tr><td>Scheda cruscotto con ombra</td><td>Pavimento di tessere, senza ombre</td></tr>
<tr><td>Bordeaux e avorio</td><td>Aglianico e calce</td></tr></tbody></table></div></div></section>

<section class="section frame" id="marchio" aria-labelledby="mk-h"><div class="grid"><h2 data-rv class="g-head" id="mk-h">Quattro riggiole e un anello.</h2>
<div class="g-text"><p>Il marchio è un quadrato di quattro tessere, separate da una fuga di due unità, con un anello tagliato al centro e un sasso pieno dentro. Si legge come una tessera posata, come un anello, come un'<em>O</em> di ordine. Quando il sito si apre, le quattro tessere ruotano e si mettono al loro posto: è l'unico movimento del marchio.</p>
<p><b>Spazio di rispetto:</b> metà dell'altezza del marchio su ogni lato.<br><b>Misure minime:</b> marchio 20 px, lockup 120 px di larghezza.<br><b>Colori:</b> aglianico su calce o su bianco; bianco su aglianico o su inchiostro; inchiostro solo per stampa monocromatica.</p></div>
<div class="g-side"><h3>File</h3><ul class="small"><li><a href="logo/lockup.svg">lockup.svg</a>, <a href="logo/lockup-ink.svg">ink</a>, <a href="logo/lockup-white.svg">bianco</a></li><li><a href="logo/mark.svg">mark.svg</a>, <a href="logo/mark-ink.svg">ink</a>, <a href="logo/mark-white.svg">bianco</a></li><li><a href="logo/wordmark.svg">wordmark.svg</a>, <a href="logo/wordmark-ink.svg">ink</a>, <a href="logo/wordmark-white.svg">bianco</a></li><li><a href="logo/mark-scrambled.svg">mark-scrambled.svg</a> (solo per l'animazione)</li><li><a href="logo/favicon.svg">favicon.svg</a>, <a href="avatar.png">avatar.png</a>, <a href="og.png">og.png</a></li></ul></div>
<div class="fields">
<div class="field-tile t-ground s7"><div><img src="logo/lockup.svg" alt="Lockup di Nozze in Ordine in aglianico" width="460"><small class="soft">Lockup, su calce</small></div></div>
<div class="field-tile t-accent s5"><div><img src="logo/lockup-white.svg" alt="Lockup di Nozze in Ordine in bianco" width="360"><small>Lockup, su aglianico</small></div></div>
<div class="field-tile t-laid s4"><div><img src="logo/mark.svg" alt="Il marchio in aglianico" width="170"><small class="soft">Marchio</small></div></div>
<div class="field-tile t-ink s4"><div><img src="logo/mark-white.svg" alt="Il marchio in bianco" width="170"><small>Su inchiostro</small></div></div>
<div class="field-tile t-ground s4"><div class="motion-demo" aria-hidden="true"><i></i><i></i><i></i><i></i></div><small class="soft">Le tessere si posano</small></div>
</div>
<h3 style="grid-column:1 / -1;margin-top:clamp(40px,5vw,72px)">Non farlo</h3>
<div class="misuse">
<div><svg viewBox="0 0 64 64" style="transform:rotate(18deg)">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg><span><span class="chip no">Non ruotarlo</span></span></div>
<div><svg viewBox="0 0 64 64" style="transform:scaleX(1.6);transform-origin:left">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg><span><span class="chip no">Non stirarlo</span></span></div>
<div><svg viewBox="0 0 64 64" style="fill:#7EA4D6">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "").replace(/fill="#6E1B2F"/g, "")}</svg><span><span class="chip no">Non cambiare colore</span></span></div>
<div><svg viewBox="0 0 64 64" style="filter:drop-shadow(4px 6px 5px rgba(0,0,0,.45))">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg><span><span class="chip no">Niente ombre</span></span></div>
<div style="background:#C4694D"><svg viewBox="0 0 64 64">${readFileSync(join(OUT, "logo/mark.svg"), "utf8").replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "")}</svg><span class="small"><span class="chip no">Non su colori di stato</span></span></div>
<div><b style="font-size:1.6rem;font-style:italic;font-family:Georgia,serif;color:var(--accent)">Nozze in Ordine</b><span><span class="chip no">Niente corsivi o serif</span></span></div>
</div></div></section>

<section class="section frame" id="colore" aria-labelledby="co-h"><div class="grid"><h2 data-rv class="g-head" id="co-h">Un fondo, un inchiostro, un colore forte.</h2>
<div class="g-text"><p class="lead">L'aglianico è il vino rosso scuro della Campania, e il bordeaux che il progetto aveva già scelto. Lo teniamo come unico colore d'accento: pulsanti, numeri importanti, la tessera "in corso" e le sezioni a campo pieno. Il fondo non è più avorio ma una calce neutra, perché l'avorio con il bordeaux è la coppia più usata del settore.</p></div>
<ul class="swatches">
${sw("Calce", C.calce, "Fondo della pagina")}
${sw("Inchiostro", C.inchiostro, "Testo e totali", "#fff")}
<li class="sw dark" style="--c:${C.aglianico}"><b>Aglianico</b><span>${C.aglianico}</span><em>Accento: azione e campo pieno</em></li>
${sw("Tessera", C.tessera, "Tessere non ancora posate")}
${sw("Tessera posata", C.posata, "Tessere già passate, righe")}
${sw("Fuga", C.fuga, "La fuga tra le tessere")}
${sw("Testo secondario", C.muted, "Note e didascalie", "#fff")}
${sw("Bianco", C.bianco, "Testo su aglianico e inchiostro")}
</ul>
<h3 style="grid-column:1 / -1;margin-top:clamp(32px,4vw,56px)">Gli smalti: solo stati del prodotto</h3>
<ul class="swatches">
${sw("Verde vite", C.verde, "Confermato, pagato")}
${sw("Limone", C.limone, "In corso")}
${sw("Celeste", C.celeste, "Da venire")}
${sw("Cotto", C.cotto, "Rifiutato, in ritardo")}
</ul>
<div class="prop" role="img" aria-label="Proporzioni: calce e tessere 70 per cento, inchiostro 18, aglianico 10, smalti 2"><i style="flex:70;background:${C.calce};outline:var(--joint) solid ${C.fuga};outline-offset:calc(var(--joint) * -1)"></i><i style="flex:18;background:${C.inchiostro}"></i><i style="flex:10;background:${C.aglianico}"></i><i style="flex:2;background:${C.limone}"></i></div>
<p class="prop-cap"><span>70% calce e tessere</span><span>18% inchiostro</span><span>10% aglianico</span><span>2% smalti</span></p>
<h3 style="grid-column:1 / -1;margin-top:clamp(32px,4vw,56px)">Contrasto (WCAG 2)</h3>
<div style="grid-column:1 / -1" class="tscroll"><table class="tbl"><thead><tr><th>Coppia</th><th>Rapporto</th><th>Uso</th></tr></thead><tbody>
${pairs.map(([n, a, b, u]) => `<tr><td class="y">${n}</td><td class="n">${ratio(a, b)} : 1</td><td>${u}</td></tr>`).join("")}</tbody></table></div>
<p class="small soft" style="grid-column:1 / -1;margin-top:12px">Gli smalti non sono mai colore del testo e non si usano per decorare: ogni colore ha un solo significato, sempre accompagnato da una parola.</p></div></section>

<section class="section frame" id="carattere" aria-labelledby="ca-h"><div class="grid"><h2 data-rv class="g-head" id="ca-h">Un solo carattere, preciso come un registro.</h2>
<div class="spec"><span class="aa" aria-hidden="true">Aa</span><div><p><b>Hanken Grotesk</b></p><p class="small soft">400, 500, 600, 700. Licenza SIL Open Font License, quindi ospitabile sul nostro sito. Caratteri senza grazie, cifre lining e tabulari per budget e date: 26.000 €.</p></div></div>
<div class="scale">
<div><span style="font-size:clamp(2.2rem,5vw,4.4rem);font-weight:600;letter-spacing:-0.04em;line-height:.98">Il matrimonio, tutto in ordine.</span><small>Display · 600 · -0,04em · interlinea 0,98 · una sola volta per pagina</small></div>
<div><span style="font-size:2.4rem;font-weight:600;letter-spacing:-0.035em;line-height:1">Ogni cosa al suo posto.</span><small>Titolo di sezione · 600 · -0,035em · interlinea 1</small></div>
<div><span style="font-size:1.5rem;font-weight:600;letter-spacing:-0.025em">Quanto hai speso, voce per voce</span><small>Sottotitolo · 600 · -0,025em</small></div>
<div><span>Previsto, firmato, pagato e residuo per ogni voce. Il totale torna sempre.</span><small>Testo · 400 · 17-19 px · interlinea 1,5</small></div>
<div><span class="small">Dati di esempio. Le date sono calcolate sul tuo giorno.</span><small>Nota · 14 px · mai sotto i 13 px</small></div></div>
<p class="small soft g-text" style="grid-column:1 / -1;margin-top:24px">Regole: maiuscola solo a inizio frase e nei nomi; mai tutto maiuscolo con spaziatura; mai corsivi decorativi; mai più di due pesi nella stessa schermata. Il carattere predefinito era Switzer: l'abbiamo sostituito perché la licenza Fontshare sull'ospitare i file sul proprio sito non è chiara.</p></div></section>

<section class="section frame" id="fuga" aria-labelledby="fu-h"><div class="grid"><h2 data-rv class="g-head" id="fu-h">La fuga: quattro pixel tra una tessera e l'altra.</h2>
<div class="g-text"><p class="lead">Ogni modulo del sito e del prodotto è una tessera quadrata. Tra due tessere c'è sempre la stessa fuga di 4 px, del colore della malta. Le tessere si distinguono per tono, non per bordi né ombre.</p>
<p>Gli angoli sono vivi, come quelli di una riggiola. Niente gradienti, niente vetro, niente linee sottili. Chi ha già posato (le scadenze passate) usa la tessera posata, più scura; chi deve ancora arrivare usa la tessera chiara; l'unica a campo pieno in aglianico è quella in corso.</p></div>
<div class="g-side"><div class="stage" data-ui aria-hidden="true"><div class="floor" style="grid-template-columns:repeat(3,1fr)"><div class="tile laid" style="min-height:110px"></div><div class="tile laid" style="min-height:110px"></div><div class="tile now" style="min-height:110px"></div><div class="tile" style="min-height:110px"></div><div class="tile" style="min-height:110px"></div><div class="tile" style="min-height:110px"></div></div></div><p class="small soft">Tessere già posate, tessera in corso, tessere da venire.</p></div>
<h3 style="grid-column:1 / -1;margin-top:clamp(32px,4vw,56px)">Stati nel prodotto</h3>
<div class="states">
<div><span class="chip">Da venire</span><span class="soft">Celeste. Una scadenza non ancora iniziata.</span></div>
<div><span class="chip on">In corso</span><span class="soft">Limone. La fase di questo momento. La sua tessera è aglianico.</span></div>
<div><span class="chip ok">Confermato</span><span class="soft">Verde vite. Fatto, pagato, risposto sì.</span></div>
<div><span class="chip no">Rifiutato</span><span class="soft">Cotto. Risposto no o in ritardo.</span></div>
<div><span class="chip wait">In attesa</span><span class="soft">Fuga. Nessuna risposta ancora.</span></div></div></div></section>

<section class="section frame" id="immagini" aria-labelledby="im-h"><div class="grid"><h2 data-rv class="g-head" id="im-h">Riggiole vere, non coppie in posa.</h2>
<div class="g-text"><p class="lead">Le immagini mostrano il mondo in cui lavoriamo: le riggiole di Napoli e della Campania, i chiostri, la luce naturale. Mai foto di coppie, mani con anelli, bokeh o corone di fiori. Un'immagine trovata non è mai presentata come nostra, né come un nostro cliente.</p>
<p>Colore naturale, nessun filtro, angoli vivi. Tre proporzioni: 3:2 per le foto grandi, 4:5 per le laterali, 2,8:1 per le fasce. Ogni didascalia dice che cosa si vede. Il credito sta in fondo alla pagina.</p></div>
<div class="photos" style="margin-top:clamp(32px,4vw,56px)">
<figure style="grid-column:span 5"><img src="../site/img/viale-1.jpg" alt="Il viale del chiostro di Santa Chiara" width="1500" height="1000" style="aspect-ratio:3/2"><figcaption>Il viale del chiostro maiolicato di Santa Chiara, Napoli. Sailko, CC BY 3.0, via Wikimedia Commons.</figcaption></figure>
<figure style="grid-column:span 4"><img src="../site/img/riggiole-tenda.jpg" alt="Riggiole dipinte con una tenda a strisce" width="1500" height="934" style="aspect-ratio:3/2"><figcaption>Riggiole dipinte, la tenda. Sailko, CC BY 3.0, via Wikimedia Commons.</figcaption></figure>
<figure style="grid-column:span 3"><img src="../site/img/viale-2.jpg" alt="Lo stesso viale visto con alcune persone" width="1500" height="843" style="aspect-ratio:3/2"><figcaption>Il viale, con persone. Sailko, CC BY 3.0.</figcaption></figure>
<figure style="grid-column:span 12"><img src="../site/img/riggiole-paesaggio.jpg" alt="Pannello di riggiole con un paesaggio" width="1500" height="540" style="aspect-ratio:1920/692"><figcaption>Pannello di riggiole, il paesaggio. Sailko, CC BY 3.0, via Wikimedia Commons.</figcaption></figure></div></div></section>

<section class="section frame" id="movimento" aria-labelledby="mo-h"><div class="grid"><h2 data-rv class="g-head" id="mo-h">Le tessere si posano.</h2>
<div class="g-text"><p class="lead">Il movimento serve a mostrare l'ordine, mai a decorare. Le cose arrivano al loro posto, una dopo l'altra, e poi stanno ferme.</p>
<ul class="small" style="display:grid;gap:8px;margin-left:20px;list-style:square"><li>Ingresso: sale di 28 px con dissolvenza, 700 ms, curva (0,2 · 0,7 · 0,2 · 1), a scaglioni di 60-90 ms. Una sola volta.</li><li>Marchio: le quattro tessere ruotano di 180 gradi e si posano, 900 ms, a scaglioni di 100 ms, solo al caricamento.</li><li>Date: quando cambi la data del sì le tessere si ricalcolano e si ripongono in 500 ms.</li><li>Pulsanti e tessere: si alzano di 2-3 px al passaggio del mouse; la freccia scivola di 4 px.</li><li>Immagini: dissolvenza lenta tra due scatti dello stesso viale (16 s) e un ingrandimento quasi impercettibile (28 s).</li><li>Con "riduci movimento" attivo tutto resta fermo e visibile.</li></ul></div><div class="g-side" style="justify-items:start"><div class="motion-demo" style="width:min(240px,60%)" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="small soft">Le quattro tessere si posano al caricamento: la stessa idea del marchio.</p></div></div></section>

<section class="section frame" id="voce" aria-labelledby="vo-h"><div class="grid"><h2 data-rv class="g-head" id="vo-h">Preciso, caldo, senza promesse.</h2>
<div class="g-text"><p class="lead">Scriviamo come una persona che mette a posto le cose: frasi corte, parole concrete, nessuna promessa su funzioni o prezzi che non esistono ancora. Alle coppie si dà del voi, alle wedding planner e nei moduli del tu.</p></div>
<div class="voice" style="margin-top:clamp(32px,4vw,56px)">
<div class="si"><b>Sì</b><span>Il matrimonio, tutto in ordine.</span></div><div class="no"><b>No</b><span>Il giorno più bello della tua vita, finalmente sotto controllo!</span></div>
<div class="si"><b>Sì</b><span>Previsto, firmato, pagato e residuo per ogni voce.</span></div><div class="no"><b>No</b><span>Gestisci il budget in modo smart e intuitivo.</span></div>
<div class="si"><b>Sì</b><span>Non chiediamo pagamenti. Ti scriviamo solo quando la prima versione è pronta.</span></div><div class="no"><b>No</b><span>Offerta esclusiva per i primi iscritti.</span></div>
<div class="si"><b>Sì</b><span>25 minuti, niente da vendere: voglio capire come lavori.</span></div><div class="no"><b>No</b><span>Scopri la soluzione che rivoluzionerà il tuo lavoro.</span></div></div>
<p class="small soft g-text" style="grid-column:1 / -1;margin-top:24px">Parole da evitare: magico, sogno, perfetto, rivoluzionario, esclusivo. Niente punti esclamativi. Slogan: "Il matrimonio, tutto in ordine." Secondario: "Ogni cosa al suo posto."</p></div></section>

<section class="section frame" id="applicazioni" aria-labelledby="ap-h"><div class="grid"><h2 data-rv class="g-head" id="ap-h">Dove si usa.</h2>
<div class="fields" style="margin-top:0">
<div class="field-tile t-accent s4"><div><img src="avatar.png" alt="Avatar quadrato: marchio bianco su aglianico" width="200" height="200"><small>Avatar, 1024 px (profilo Instagram e WhatsApp)</small></div></div>
<div class="field-tile t-ground s8"><div><img src="og.png" alt="Anteprima per i social: titolo e pavimento di tessere" width="520" height="273"><small class="soft">Anteprima social, 1200 × 630 (og.png)</small></div></div></div>
<div class="g-text" style="margin-top:28px"><p><b>Firma email:</b> Felice Mondo · Nozze in Ordine · info@nozzeinordine.com · nozzeinordine.com. Solo testo, in inchiostro; il marchio non si inserisce nelle email dei primi contatti, per non farle sembrare una newsletter.</p><p><b>Messaggi di primo contatto:</b> restano scritti a nome di Felice, dal suo profilo, senza grafica.</p></div></div></section>

<section class="section frame" id="token" aria-labelledby="to-h"><div class="grid"><h2 data-rv class="g-head" id="to-h">Token per chi costruisce.</h2>
<pre class="code"><code>${TOKENS.replace(/</g, "&lt;")}</code></pre><p class="small soft" style="grid-column:1 / -1;margin-top:12px">Gli stessi valori sono in <a href="tokens.css">tokens.css</a> e nel foglio di stile del sito.</p></div></section>

<section class="section frame" aria-labelledby="no-h"><div class="grid"><h2 data-rv class="g-head" id="no-h">Note e limiti.</h2>
<ul class="notes">
<li>Questa guida definisce l'aspetto, non il nome. La ricerca su UIBM e TMview non ha trovato risultati, ma non è un parere legale: prima del deposito serve un consulente in proprietà industriale, anche perché il nome è descrittivo.</li>
<li>La palette cambia rispetto alla decisione "bordeaux e avorio": il bordeaux resta, l'avorio cede a una calce neutra.</li>
<li>Le foto sono di Sailko, CC BY 3.0, da Wikimedia Commons: il credito è obbligatorio e compare in fondo alle pagine. Non sono immagini di Nozze in Ordine né di suoi clienti.</li>
<li>Hanken Grotesk è sotto SIL OFL e ospitato sul sito; non serve nessun servizio esterno.</li>
<li>I dati nei riquadri del sito (budget, preventivi, invitati, eventi, scaletta) sono di esempio e vanno sostituiti o dichiarati tali.</li>
<li>La riga "Prova a mano: 3 planner e 5 coppie" sul sito riprende gli obiettivi del Piano operativo. Se non vuoi renderli pubblici, si toglie in un punto solo.</li></ul></div></section>
</main>
<div class="frame"><footer class="foot"><div class="line"><span>Nozze in Ordine, identità visiva 1.0</span><nav aria-label="Piè di pagina"><a href="#marchio">Marchio</a><a href="#colore">Colore</a><a href="#carattere">Carattere</a></nav><span>23 ottobre 2026</span></div></footer></div>
<script src="../site/app.js"></script></body></html>`;
writeFileSync(join(OUT, "brand-guide.html"), html);
console.log("guida scritta");
