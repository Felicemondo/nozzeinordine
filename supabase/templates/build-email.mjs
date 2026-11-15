// Genera i modelli email di Supabase (Authentication › Email Templates).  node supabase/templates/build-email.mjs
// Ogni file riporta in testa l'oggetto e il nome del modello in cui incollarlo.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const OUT = dirname(fileURLToPath(import.meta.url));

// Colori da brand/tokens.css
const C = { ground: "#F5F0E7", tile: "#FBF8F2", laid: "#EBE4D6", grout: "#DCD2BF", ink: "#25241F", muted: "#514C45", accent: "#702F43", blu: "#5F8794", bluInk: "#386070", terra: "#B75F45", olive: "#465044" };
const SANS = "Arial,Helvetica,sans-serif", SERIF = "Georgia,'Times New Roman',serif";
const SITE = "https://nozzeinordine.com";

const p = (t, small) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:${small ? 14 : 16}px;line-height:1.6;color:${small ? C.muted : C.ink};">${t}</p>`;
const list = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${items.map((i, n) => `<tr>
<td valign="top" style="padding:0 12px 10px 0;font-family:${SERIF};font-size:15px;color:${C.terra};">0${n + 1}</td>
<td valign="top" style="padding:0 0 10px;font-family:${SANS};font-size:15px;line-height:1.5;color:${C.ink};">${i}</td></tr>`).join("")}</table>`;
const button = (label, url = "{{ .ConfirmationURL }}") => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr>
<td bgcolor="${C.accent}" style="border-radius:3px;"><a href="${url}" style="display:inline-block;padding:15px 26px;font-family:${SANS};font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${label} &rarr;</a></td></tr></table>`;
const code = () => `<p style="margin:8px 0 28px;font-family:${SERIF};font-size:34px;letter-spacing:6px;color:${C.accent};">{{ .Token }}</p>`;
const fallback = p(`Se il pulsante non funziona, copia questo indirizzo nel browser:<br><span style="word-break:break-all;color:${C.bluInk};">{{ .ConfirmationURL }}</span>`, true);
const hello = `Ciao{{ if .Data.full_name }} {{ .Data.full_name }}{{ end }},`;
// Le tessere: il motivo del marchio, "un tassello alla volta"
const tiles = `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${[C.accent, C.blu, C.terra, C.olive, C.laid].map((c) => `<td width="14" height="14" bgcolor="${c}" style="font-size:0;line-height:0;">&nbsp;</td><td width="4" style="font-size:0;line-height:0;">&nbsp;</td>`).join("")}</tr></table>`;

const layout = ({ file, model, subject, pre, eyebrow, title, body }) => writeFileSync(join(OUT, file), `<!--
  Modello Supabase: ${model}
  Oggetto: ${subject}
  File generato da build-email.mjs: le modifiche si fanno lì.
-->
<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.ground}"><tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
<tr><td style="padding:0 4px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" width="44"><img src="${SITE}/apple-touch-icon.png" width="36" height="36" alt="" style="display:block;border:0;"></td>
<td valign="middle" style="font-family:${SERIF};font-size:21px;color:${C.accent};">Nozze in Ordine</td>
<td valign="middle" align="right">${tiles}</td></tr></table></td></tr>
<tr><td bgcolor="${C.tile}" style="border:1px solid ${C.grout};border-top:3px solid ${C.accent};padding:36px 32px 20px;">
<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.bluInk};">${eyebrow}</p>
<h1 style="margin:0 0 22px;font-family:${SERIF};font-weight:normal;font-size:30px;line-height:1.15;color:${C.ink};">${title}</h1>
${body}
</td></tr>
<tr><td bgcolor="${C.olive}" style="padding:22px 32px;font-family:${SERIF};font-style:italic;font-size:17px;line-height:1.4;color:#E8E3DA;">Ogni dettaglio al suo posto. Ogni momento da vivere.</td></tr>
<tr><td style="padding:22px 4px 0;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted};">
Felice, di Nozze in Ordine<br>
Questa casella non riceve risposte. Per scriverci: <a href="mailto:info@nozzeinordine.com" style="color:${C.bluInk};">info@nozzeinordine.com</a><br>
<a href="${SITE}/privacy" style="color:${C.bluInk};">Privacy</a> &nbsp;·&nbsp; <a href="${SITE}/termini" style="color:${C.bluInk};">Termini</a> &nbsp;·&nbsp; <a href="${SITE}" style="color:${C.bluInk};">nozzeinordine.com</a>
</td></tr>
</table></td></tr></table>
</body></html>
`);

layout({ file: "conferma-registrazione.html", model: "Confirm signup", subject: "Conferma la tua email per entrare in Nozze in Ordine", pre: "Un solo passaggio e il vostro spazio è pronto.",
  eyebrow: "Benvenuti", title: "Il primo tassello è confermare l'email.",
  body: p(hello) + `{{ if eq .Data.role "planner" }}` +
    p("grazie per la registrazione a Nozze in Ordine. Manca un solo passaggio: confermare che questa email è tua.") + button("Conferma l'email ed entra") +
    p("Al primo accesso crei il tuo spazio di lavoro. Poi puoi:") +
    list(["Aggiungere i matrimoni che segui, uno alla volta.", "Invitare gli sposi nel loro portale.", "Tenere budget, fornitori e scadenze di ogni evento nello stesso posto."]) +
    `{{ else }}` +
    p("grazie per aver scelto Nozze in Ordine per il vostro matrimonio. Manca un solo passaggio: confermare che questa email è tua.") + button("Conferma l'email ed entra") +
    p("Al primo accesso create il vostro spazio. Poi potete:") +
    list(["Inserire la data e trovare le scadenze già calcolate.", "Impostare il budget e aggiungere i primi invitati.", "Invitare il partner, così lavorate sulle stesse informazioni."]) +
    `{{ end }}` + fallback + p("Se non hai chiesto tu questa registrazione, ignora questa email: senza conferma l'account non viene attivato.", true) });

layout({ file: "recupero-password.html", model: "Reset password", subject: "Scegli una nuova password per Nozze in Ordine", pre: "Il link per scegliere una nuova password.",
  eyebrow: "Accesso", title: "Scegli una nuova password.",
  body: p(hello) + p("abbiamo ricevuto la richiesta di cambiare la password del tuo account. Il pulsante apre la pagina in cui sceglierne una nuova.") + button("Scegli la nuova password") +
    fallback + p("Il link vale per un tempo limitato e si può usare una volta sola. Se non hai chiesto tu il cambio, ignora questa email: la password resta quella di prima.", true) });

layout({ file: "cambio-email.html", model: "Change email address", subject: "Conferma il nuovo indirizzo email", pre: "Conferma il nuovo indirizzo per il tuo account.",
  eyebrow: "Account", title: "Conferma il nuovo indirizzo.",
  body: p(hello) + p("hai chiesto di usare <strong>{{ .NewEmail }}</strong> al posto di {{ .Email }} per entrare in Nozze in Ordine. Conferma con il pulsante e il cambio è fatto.") + button("Conferma il nuovo indirizzo") +
    fallback + p("Se non hai chiesto tu il cambio, ignora questa email e scrivici: l'indirizzo resta quello di prima.", true) });

layout({ file: "link-di-accesso.html", model: "Magic link", subject: "Il tuo link per entrare in Nozze in Ordine", pre: "Entra senza password con questo link.",
  eyebrow: "Accesso", title: "Entra con un link.",
  body: p(hello) + p("ecco il link per entrare nel tuo spazio senza scrivere la password.") + button("Entra in Nozze in Ordine") +
    fallback + p("Il link vale per un tempo limitato e si può usare una volta sola. Se non l'hai chiesto tu, ignora questa email.", true) });

layout({ file: "invito.html", model: "Invite user", subject: "Sei stato invitato in Nozze in Ordine", pre: "Qualcuno ti ha invitato in uno spazio condiviso.",
  eyebrow: "Invito", title: "C'è uno spazio che ti aspetta.",
  body: p("Ciao,") + p("sei stato invitato a entrare in Nozze in Ordine, lo spazio condiviso in cui si organizza un matrimonio: budget, fornitori, invitati e scadenze nello stesso posto.") + button("Accetta l'invito") +
    fallback + p("Se non conosci chi ti ha invitato, ignora questa email: non succede nulla.", true) });

layout({ file: "codice-di-verifica.html", model: "Reauthentication", subject: "Il tuo codice di verifica", pre: "Il codice per confermare che sei tu.",
  eyebrow: "Sicurezza", title: "Conferma che sei tu.",
  body: p(hello) + p("per completare l'operazione scrivi questo codice nella dashboard:") + code() +
    p("Il codice vale per pochi minuti. Se non stavi facendo nulla sul tuo account, cambia la password e scrivici.", true) });

console.log("modelli email scritti in", OUT);
