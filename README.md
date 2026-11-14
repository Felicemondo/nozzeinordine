# Nozze in Ordine

Sito di lista d'attesa e identità visiva di Nozze in Ordine, una dashboard per organizzare matrimoni (coppie e wedding planner), nata in Campania e aperta a tutta Italia.

## Contenuto

- `site/`: il sito statico (index, coppie, planner, prezzi, privacy). Si pubblica così com'è, per esempio su Cloudflare Pages con la cartella `site` come directory di output.
- `brand/`: guida al marchio (`brand-guide.html`), loghi SVG, avatar, immagine per i social, `tokens.css`.
- `build.mjs`: rigenera le pagine HTML di `site/`. `node build.mjs`
- `build-brand.mjs`: rigenera la guida e `tokens.css`. `node build-brand.mjs`

Serve solo Node 18 o successivo. Gli stili e lo script stanno in `site/styles.css` e `site/app.js`; le pagine HTML sono generate, quindi si modificano in `build.mjs`.

## Dashboard (`site/app/`)

- `site/app/index.html`: accesso, registrazione (coppia o wedding planner), recupero password e dashboard.
- `site/app/demo.html`: la stessa dashboard con dati finti in memoria, per mostrarla senza account (`?ruolo=coppia`, `planner` o `admin`).
- `site/app/ui.js` disegna tutto; `api.js` parla con Supabase, `mock-api.js` fa lo stesso per la demo. `vendor/supabase.js` è supabase-js 2.117.3 (UMD), salvato in locale per rispettare la CSP.

Ruoli:
- **coppia**: crea il proprio matrimonio, gestisce budget (spesa totale, pagato, voci, viaggio di nozze), fornitori e preventivi, invitati per gruppo (famiglia e amici di ciascuno, amici comuni), tavoli e sala in pianta 2D (8-12 posti, nome del tavolo, nome su ogni posto), scadenze e scaletta; invita il partner o la planner.
- **planner**: segue più matrimoni, invita gli sposi nel loro portale, ha le note interne che gli sposi non vedono.
- **admin**: vede utenti, matrimoni e lista d'attesa, cambia i ruoli. Si assegna solo dal database (vedi sotto).

Avvisi: scadenze e pagamenti in arrivo compaiono nella dashboard (con il numero accanto ad "Avvisi") e, se la persona lo consente, come notifiche del dispositivo quando apre l'app. `sw.js` e `manifest.webmanifest` permettono di aggiungerla alla schermata Home. Le notifiche ad app chiusa richiedono un servizio di invio email o web push lato server, non ancora attivo.

Il database è in `supabase/migrations/`: tabelle, ruoli, scadenze generate dalla data, inviti e regole RLS. Le prove sono in `supabase/tests/rls.sql` (si lancia nell'editor SQL e annulla tutto) e in `tests/e2e-api.mjs` (prova `api.js` dal vivo con due account di prova confermati).

Per nominare il primo amministratore, dopo che si è registrato:

```sql
update public.profiles set role = 'admin' where email = 'indirizzo@esempio.it';
```

## Lista d'attesa

Il modulo scrive su Supabase (tabella `waitlist`) con la chiave publishable, che per sua natura è pubblica: la protezione sta nelle regole RLS della tabella, non nella chiave. Non mettere mai nel sito la chiave `service_role`.

## Crediti

- Caratteri: DM Serif Display (titoli) e DM Sans (interfaccia e dati), SIL Open Font License, ospitati in `site/fonts`.
- Foto: Sailko (CC BY 3.0) per il chiostro maiolicato di Santa Chiara, Napoli; Leandro Neumann Ciuffo (CC BY 2.0) per Villa Rufolo, Ravello. Da Wikimedia Commons, con credito in fondo a ogni pagina.
- I dati nei riquadri del sito sono di esempio.
- Il nome "Nozze in Ordine" non ha un parere legale sul marchio: serve un consulente prima del deposito.
