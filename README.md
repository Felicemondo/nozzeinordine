# Nozze in Ordine

Sito di lista d'attesa e identità visiva di Nozze in Ordine, una dashboard per organizzare matrimoni (coppie e wedding planner), a partire dalla Campania.

## Contenuto

- `site/`: il sito statico (index, coppie, planner, prezzi, privacy). Si pubblica così com'è, per esempio su Cloudflare Pages con la cartella `site` come directory di output.
- `brand/`: guida al marchio (`brand-guide.html`), loghi SVG, avatar, immagine per i social, `tokens.css`.
- `build.mjs`: rigenera le pagine HTML di `site/`. `node build.mjs`
- `build-brand.mjs`: rigenera la guida e `tokens.css`. `node build-brand.mjs`

Serve solo Node 18 o successivo. Gli stili e lo script stanno in `site/styles.css` e `site/app.js`; le pagine HTML sono generate, quindi si modificano in `build.mjs`.

## Lista d'attesa

Il modulo scrive su Supabase (tabella `waitlist`) con la chiave publishable, che per sua natura è pubblica: la protezione sta nelle regole RLS della tabella, non nella chiave. Non mettere mai nel sito la chiave `service_role`.

## Crediti

- Caratteri: DM Serif Display (titoli) e DM Sans (interfaccia e dati), SIL Open Font License, ospitati in `site/fonts`.
- Foto: Sailko (CC BY 3.0) per il chiostro maiolicato di Santa Chiara, Napoli; Leandro Neumann Ciuffo (CC BY 2.0) per Villa Rufolo, Ravello. Da Wikimedia Commons, con credito in fondo a ogni pagina.
- I dati nei riquadri del sito sono di esempio.
- Il nome "Nozze in Ordine" non ha un parere legale sul marchio: serve un consulente prima del deposito.
